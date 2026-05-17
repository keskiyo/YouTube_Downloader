import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'

export interface StreamInfo {
	codec: string
	width?: number
	height?: number
	duration: number
	bitrate?: string
}

export interface FfprobeResult {
	hasVideo: boolean
	hasAudio: boolean
	videoStream?: StreamInfo
	audioStream?: StreamInfo
	duration: number
	fileSize: number
}

export interface FaststartResult {
	success: boolean
	outputPath: string
	error?: string
}

function runCommand(
	cmd: string,
	args: string[],
): Promise<string> {
	return new Promise((resolve, reject) => {
		let output = ''
		let errorOutput = ''

		const proc = spawn(cmd, args)
		proc.stdout.on('data', data => {
			output += data.toString()
		})
		proc.stderr.on('data', data => {
			errorOutput += data.toString()
		})
		proc.on('close', code => {
			// Для ffprobe разрешаем non-zero exit code (предупреждения)
			if (cmd === 'ffprobe') {
				resolve(output)
			} else if (code === 0) {
				resolve(output)
			} else {
				reject(new Error(errorOutput || `Command failed with code ${code}`))
			}
		})
		proc.on('error', reject)
	})
}

export async function runFfprobe(filePath: string): Promise<FfprobeResult | null> {
	console.log('[runFfprobe] STARTED with path:', filePath)
	
	if (!existsSync(filePath)) {
		console.error('[runFfprobe] File does not exist:', filePath)
		return null
	}

	const fs = await import('fs')
	const fileSize = fs.statSync(filePath).size
	console.log('[runFfprobe] File exists, size:', fileSize)

	if (fileSize < 10000) {
		console.error('[runFfprobe] File too small to be valid:', fileSize)
		return null
	}

	let validFilePath = filePath

	if (filePath.endsWith('.ts')) {
		console.log('[runFfprobe] Converting .ts to .mp4...')
		const mp4Path = filePath.replace('.ts', '.mp4')
		try {
			await runCommand('ffmpeg', [
				'-y',
				'-i', filePath,
				'-c', 'copy',
				'-bsf:a', 'aac_adtstoasc',
				mp4Path,
			])
			console.log('[runFfprobe] Conversion complete, new file:', mp4Path)
			fs.unlinkSync(filePath)
			validFilePath = mp4Path
		} catch (err) {
			console.warn('[runFfprobe] .ts conversion failed, keeping original:', err)
		}
	}

	console.log('[runFfprobe] Attempting remux to fix container...')
	try {
		const tempFile = filePath.replace('.mp4', '_fixed.mp4')
		console.log('[runFfprobe] Creating temp file:', tempFile)
		
		await runCommand('ffmpeg', [
			'-y',
			'-i', filePath,
			'-c', 'copy',
			'-movflags', '+faststart',
			tempFile,
		])
		
		const fixedSize = fs.statSync(tempFile).size
		console.log('[runFfprobe] Remux completed, size:', fixedSize)
		
		if (fixedSize > fileSize * 0.9 && fixedSize > 10000) {
			console.log('[runFfprobe] Remux successful, replacing original')
			fs.unlinkSync(filePath)
			fs.renameSync(tempFile, filePath)
			validFilePath = filePath
			console.log('[runFfprobe] Original replaced with fixed version')
		} else {
			console.log('[runFfprobe] Remux failed or file too small, keeping original')
			try { fs.unlinkSync(tempFile) } catch {}
		}
	} catch (err) {
		console.warn('[runFfprobe] Remux failed:', err)
	}

	console.log('[runFfprobe] Running ffprobe on:', validFilePath)
	try {
		const args = [
			'-v', 'quiet',
			'-print_format', 'json',
			'-show_format',
			'-show_streams',
			validFilePath,
		]
		console.log('[runFfprobe] ffprobe args:', args.join(' '))

		const output = await runCommand('ffprobe', args)
		console.log('[runFfprobe] ffprobe output length:', output.length)
		console.log('[runFfprobe] ffprobe raw output:', output.slice(0, 500))

		if (!output || output.trim() === '') {
			console.error('[runFfprobe] ffprobe returned empty output')
			return null
		}

		let data
		try {
			data = JSON.parse(output)
			console.log('[runFfprobe] JSON parsed successfully')
		} catch {
			console.error('[runFfprobe] Failed to parse ffprobe output')
			return null
		}

		if (!data) {
			console.error('[runFfprobe] data is null/undefined')
			return null
		}
		
		if (!data.streams || !Array.isArray(data.streams)) {
			console.error('[runFfprobe] streams missing or not array')
			console.log('[runFfprobe] data keys:', Object.keys(data))
			return null
		}
		
		console.log('[runFfprobe] All streams:', data.streams.map((s: any) => s.codec_type))
		const streams = data.streams

		const videoStream = streams.find((s: { codec_type: string }) => s.codec_type === 'video')
		const audioStream = streams.find((s: { codec_type: string }) => s.codec_type === 'audio')

		console.log('[runFfprobe] Video stream found:', !!videoStream)
		console.log('[runFfprobe] Audio stream found:', !!audioStream)
		
		const validFileSize = fs.statSync(validFilePath).size

		const result: FfprobeResult = {
			hasVideo: !!videoStream,
			hasAudio: !!audioStream,
			duration: parseFloat(data.format?.duration) || 0,
			fileSize: validFileSize,
		}

		if (videoStream) {
			result.videoStream = {
				codec: videoStream.codec_name,
				width: videoStream.width,
				height: videoStream.height,
				duration: parseFloat(videoStream.duration) || result.duration,
				bitrate: videoStream.bit_rate,
			}
		}

		if (audioStream) {
			result.audioStream = {
				codec: audioStream.codec_name,
				duration: parseFloat(audioStream.duration) || result.duration,
				bitrate: audioStream.bit_rate,
			}
		}

		console.log('[runFfprobe] Final result:', JSON.stringify(result, null, 2))
		console.log('[runFfprobe] RETURNING RESULT')
		return result
	} catch (err) {
		console.error('[runFfprobe] EXCEPTION:', err)
		return null
	}
}

export async function applyFaststart(inputPath: string): Promise<FaststartResult> {
	if (!existsSync(inputPath)) {
		return { success: false, outputPath: inputPath, error: 'Input file not found' }
	}

	const dir = dirname(inputPath)
	const tempFile = join(dir, `temp_${Date.now()}_faststart.mp4`)

	try {
		console.log('[ffmpeg] Applying faststart to:', inputPath)

		await runCommand('ffmpeg', [
			'-y',
			'-i', inputPath,
			'-c', 'copy',
			'-movflags', '+faststart',
			tempFile,
		])

		const { renameSync, unlinkSync, copyFileSync } = await import('fs')
		copyFileSync(tempFile, inputPath)
		unlinkSync(tempFile)

		console.log('[ffmpeg] Faststart applied successfully')
		return { success: true, outputPath: inputPath }
	} catch (err) {
		console.error('[ffmpeg] Faststart error:', err)
		const errorMsg = err instanceof Error ? err.message : 'Unknown error'
		return { success: false, outputPath: inputPath, error: errorMsg }
	}
}

export async function mergeVideoAudio(
	videoPath: string,
	audioPath: string,
	outputPath: string,
): Promise<boolean> {
	if (!existsSync(videoPath) || !existsSync(audioPath)) {
		console.error('[ffmpeg] Missing input files for merge')
		return false
	}

	try {
		console.log('[ffmpeg] Merging video + audio')
		await runCommand('ffmpeg', [
			'-y',
			'-i', videoPath,
			'-i', audioPath,
			'-c:v', 'copy',
			'-c:a', 'aac',
			'-strict', 'experimental',
			outputPath,
		])
		console.log('[ffmpeg] Merge completed:', outputPath)
		return true
	} catch (err) {
		console.error('[ffmpeg] Merge error:', err)
		return false
	}
}