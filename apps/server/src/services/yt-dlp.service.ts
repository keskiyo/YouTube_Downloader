import { spawn } from 'child_process'
import { readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export interface YtDlpProgress {
	percent: number
	totalSize?: string
	speed?: string
	eta?: string
}

export interface YtDlpResult {
	success: boolean
	filePath?: string
	quality?: string
	error?: string
}

type ProgressCallback = (progress: YtDlpProgress) => void



const PROGRESS_REGEX = /\[download\]\s+(\d+\.?\d*)%\s+of\s+([\d.]+[KMG]iB)(?:\s+at\s+([\d.]+[KMG]iB\/s))?(?:\s+ETA\s+([\d:]+))?/

function parseProgressLine(line: string): YtDlpProgress | null {
	const match = line.match(PROGRESS_REGEX)
	if (!match) return null

	return {
		percent: Number.parseFloat(match[1] ?? '0'),
		totalSize: match[2],
		speed: match[3] ?? undefined,
		eta: match[4] ?? undefined,
	}
}

export function buildFormatSelector(quality?: string, attempt = 0): string {
	if (quality && quality !== 'best') {
		const qNum = parseInt(quality.replace('p', ''), 10)
		const selectors = [
			`best[height<=${qNum}]`,
			`bestvideo[height<=${qNum}]+bestaudio/best[height<=${qNum}]`,
			`bestvideo[height<=${qNum}]/best[height<=${qNum}]`,
		]
		return selectors[Math.min(attempt, selectors.length - 1)] ?? selectors[0]!
	}

	const selectors = [
		'best',
		'bestvideo+bestaudio/best',
		'bestvideo/best',
	]
	return selectors[Math.min(attempt, selectors.length - 1)] ?? 'best'
}

export async function downloadWithYtDlp(
	url: string,
	outputDir: string,
	quality?: string,
	onProgress?: ProgressCallback,
): Promise<YtDlpResult> {
	return new Promise(resolve => {
		let stdoutData = ''
		let stderrData = ''

		const outputTemplate = join(outputDir, 'video.%(ext)s')

		const args = [
			'-f', 'best',
			'-o', outputTemplate,
			'--no-mtime',
			url,
		]
		
		console.log('[yt-dlp] Starting download')
		console.log('[yt-dlp] Using format: default')
		console.log('[yt-dlp] Command: yt-dlp ' + args.join(' '))
		console.log('[yt-dlp] Working directory:', outputDir)

		const proc = spawn('yt-dlp', args)

		proc.stdout.on('data', data => {
			const line = data.toString().trim()
			if (line) {
				stdoutData += line + '\n'
				console.log('[yt-dlp] stdout:', line)

				const progress = parseProgressLine(line)
				if (progress && onProgress) {
					onProgress(progress)
				}
			}
		})

		proc.stderr.on('data', data => {
			const line = data.toString().trim()
			if (line) {
				stderrData += line + '\n'
				console.log('[yt-dlp] stderr:', line)

				const progress = parseProgressLine(line)
				if (progress && onProgress) {
					onProgress(progress)
				}
			}
		})
		
		proc.on('spawn', () => {
			console.log('[yt-dlp] Process spawned successfully')
		})
		
		proc.on('exit', (code, signal) => {
			console.log('[yt-dlp] Process exited with code:', code, 'signal:', signal)
		})

		proc.on('close', async code => {
			console.log('[yt-dlp] Process exited with code:', code)

			if (code === 0) {
				await new Promise(r => setTimeout(r, 10000))
				const files = readdirSync(outputDir)
					.filter(f => f.endsWith('.mp4') || f.endsWith('.ts') || f.endsWith('.m4a'))
					.map(f => ({ name: f, path: join(outputDir, f) }))
					.filter(f => existsSync(f.path))

				if (files.length > 0) {
				const file = files[files.length - 1]!
				try {
					const stat = statSync(file.path)
					if (stat.size > 1000) {
						await new Promise(r => setTimeout(r, 5000))
						const newStat = statSync(file.path)
						if (stat.size === newStat.size) {
							console.log('[yt-dlp] File ready:', file.path, 'size:', newStat.size)
							resolve({ success: true, filePath: file.path, quality: 'best' })
							return
						}
					}
				} catch (e) {
					console.error('[yt-dlp] Error checking file:', e)
				}
			}
			console.error('[yt-dlp] No output file found:', files.map(f => f.name))
				resolve({ success: false, error: 'No output file found' })
			} else {
				const errorMsg = stderrData.trim() || `yt-dlp failed with code ${code}`
				console.error('[yt-dlp] Error:', errorMsg)
				resolve({ success: false, error: errorMsg })
			}
		})

		proc.on('error', err => {
			console.error('[yt-dlp] Spawn error:', err)
			resolve({ success: false, error: err.message })
		})
	})
}

export async function downloadWithRetry(
	url: string,
	outputDir: string,
	quality?: string,
	onProgress?: ProgressCallback,
	maxRetries = 3,
): Promise<YtDlpResult> {
	let lastError: string | undefined

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		if (attempt > 0) {
			console.log(`[yt-dlp] Retry attempt ${attempt + 1}/${maxRetries}`)
		}

		const result = await downloadWithYtDlp(url, outputDir, quality, onProgress)

		if (result.success) {
			return result
		}

		lastError = result.error

		if (attempt < maxRetries - 1) {
			const waitTime = (attempt + 1) * 2000
			console.log(`[yt-dlp] Waiting ${waitTime}ms before retry...`)
		}
	}

	return { success: false, error: lastError }
}