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
	formatName?: string
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

async function probeFile(filePath: string): Promise<FfprobeResult | null> {
	const fs = await import('fs')
	const args = [
		'-v', 'quiet',
		'-print_format', 'json',
		'-show_format',
		'-show_streams',
		filePath,
	]
	console.log('[ffprobe] args:', args.join(' '))

	const output = await runCommand('ffprobe', args)
	console.log('[ffprobe] output length:', output.length)
	console.log('[ffprobe] raw output:', output.slice(0, 500))

	if (!output || output.trim() === '') {
		console.error('[ffprobe] returned empty output')
		return null
	}

	let data
	try {
		data = JSON.parse(output)
	} catch {
		console.error('[ffprobe] Failed to parse JSON output')
		return null
	}

	if (!data?.streams || !Array.isArray(data.streams)) {
		console.error('[ffprobe] streams missing or not array')
		return null
	}

	console.log('[ffprobe] All streams:', data.streams.map((s: any) => s.codec_type))
	const streams = data.streams
	const videoStream = streams.find((s: { codec_type: string }) => s.codec_type === 'video')
	const audioStream = streams.find((s: { codec_type: string }) => s.codec_type === 'audio')
	const fileSize = fs.statSync(filePath).size

	const result: FfprobeResult = {
		hasVideo: !!videoStream,
		hasAudio: !!audioStream,
		duration: parseFloat(data.format?.duration) || 0,
		fileSize,
		formatName: data.format?.format_name,
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

	return result
}

async function canDecodeVideoFrame(inputPath: string): Promise<boolean> {
	const { statSync, unlinkSync } = await import('fs')
	const dir = dirname(inputPath)
	const framePath = join(dir, `frame_${Date.now()}.jpg`)

	try {
		await runCommand('ffmpeg', [
			'-v', 'error',
			'-y',
			'-ss', '00:00:05',
			'-i', inputPath,
			'-frames:v', '1',
			framePath,
		])
		return existsSync(framePath) && statSync(framePath).size > 0
	} catch (err) {
		console.warn('[ffmpeg] Could not decode a video frame:', err)
		return false
	} finally {
		try { unlinkSync(framePath) } catch {}
	}
}

export async function normalizeToPlayableMp4(inputPath: string, probe: FfprobeResult): Promise<string> {
	if (!existsSync(inputPath)) {
		throw new Error('Input file not found')
	}

	if (!probe.formatName?.includes('mpegts')) {
		return inputPath
	}

	const { copyFileSync, unlinkSync } = await import('fs')
	const dir = dirname(inputPath)
	const tempFile = join(dir, `temp_${Date.now()}_transcoded.mp4`)

	console.log('[ffmpeg] Transcoding MPEG-TS HLS output to playable MP4:', inputPath)
	await runCommand('ffmpeg', [
		'-v', 'error',
		'-y',
		'-i', inputPath,
		'-map', '0:v:0',
		'-map', '0:a:0',
		'-c:v', 'libx264',
		'-preset', 'veryfast',
		'-crf', '20',
		'-c:a', 'aac',
		'-b:a', '128k',
		'-movflags', '+faststart',
		tempFile,
	])

	const normalizedProbe = await probeFile(tempFile)
	if (!normalizedProbe?.hasVideo || !normalizedProbe.hasAudio || !(await canDecodeVideoFrame(tempFile))) {
		try { unlinkSync(tempFile) } catch {}
		throw new Error('Transcoded MP4 failed validation')
	}

	copyFileSync(tempFile, inputPath)
	unlinkSync(tempFile)
	console.log('[ffmpeg] MPEG-TS normalized to playable MP4')
	return inputPath
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

	console.log('[runFfprobe] Running ffprobe on:', validFilePath)
	try {
		const result = await probeFile(validFilePath)
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

		const result = await probeFile(tempFile)
		if (!result?.hasVideo || !result.hasAudio || !(await canDecodeVideoFrame(tempFile))) {
			const { unlinkSync } = await import('fs')
			try { unlinkSync(tempFile) } catch {}
			const message = 'Faststart output is missing a playable video or audio stream; keeping original file'
			console.warn('[ffmpeg]', message, result)
			return { success: false, outputPath: inputPath, error: message }
		}

		const { unlinkSync, copyFileSync } = await import('fs')
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
