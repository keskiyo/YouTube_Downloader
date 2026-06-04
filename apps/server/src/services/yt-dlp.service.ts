import { spawn } from 'child_process'
import { readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { getYtDlpNetworkArgs, getYtDlpProxy } from '../config/network'
import { extractYouTubeVideoId, extractVkVideoId, normalizeVkVideoUrl } from './platform-parser'

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

function delay(ms: number, signal?: AbortSignal): Promise<boolean> {
	return new Promise(resolve => {
		if (signal?.aborted) {
			resolve(false)
			return
		}

		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort)
			resolve(true)
		}, ms)

		const onAbort = () => {
			clearTimeout(timer)
			resolve(false)
		}

		signal?.addEventListener('abort', onAbort, { once: true })
	})
}

const SAFE_FORMAT_SELECTOR = 'bv*[vcodec!=none]+ba[acodec!=none]/b[vcodec!=none][acodec!=none]'
const VALID_QUALITIES = new Set(['144', '240', '360', '480', '720', '1080', '1440', '2160'])

function normalizeQuality(quality?: string): string | undefined {
	if (!quality || quality === 'best' || quality === 'choose') {
		return undefined
	}

	const normalized = quality.toLowerCase().replace(/p$/, '')
	return VALID_QUALITIES.has(normalized) ? normalized : undefined
}

function isRutubeUrl(url: string): boolean {
	try {
		const hostname = new URL(url).hostname.toLowerCase()
		return hostname === 'rutube.ru' || hostname.endsWith('.rutube.ru')
	} catch {
		return /rutube\.ru/i.test(url)
	}
}

function getDownloadUrl(url: string): string {
	const youtubeId = extractYouTubeVideoId(url)
	if (youtubeId) {
		return `https://www.youtube.com/watch?v=${youtubeId}`
	}

	if (extractVkVideoId(url)) {
		return normalizeVkVideoUrl(url)
	}

	return url
}

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

export function buildFormatSelector(quality?: string, attempt = 0, preferMp4 = false): string {
	const normalizedQuality = normalizeQuality(quality)

	if (normalizedQuality) {
		const qNum = parseInt(normalizedQuality, 10)
		const mp4Selectors = [
			`bv*[height<=${qNum}][ext=mp4][vcodec^=avc1]+ba[ext=m4a][acodec!=none]/b[height<=${qNum}][ext=mp4][vcodec!=none][acodec!=none]`,
		]
		const selectors = [
			`bv*[height<=${qNum}][vcodec!=none]+ba[acodec!=none]/b[height<=${qNum}][vcodec!=none][acodec!=none]`,
			`bv*[height<=${qNum}][vcodec!=none]+ba/b[height<=${qNum}][vcodec!=none][acodec!=none]`,
			SAFE_FORMAT_SELECTOR,
		]
		if (preferMp4) {
			selectors.unshift(...mp4Selectors)
		}
		return selectors[Math.min(attempt, selectors.length - 1)] ?? selectors[0]!
	}

	const mp4Selectors = [
		'bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a][acodec!=none]/b[ext=mp4][vcodec!=none][acodec!=none]',
	]
	const selectors = [
		SAFE_FORMAT_SELECTOR,
		'bv*[vcodec!=none]+ba/b[vcodec!=none][acodec!=none]',
		'b[vcodec!=none][acodec!=none]',
	]
	if (preferMp4) {
		selectors.unshift(...mp4Selectors)
	}
	return selectors[Math.min(attempt, selectors.length - 1)] ?? SAFE_FORMAT_SELECTOR
}

export async function downloadWithYtDlp(
	url: string,
	outputDir: string,
	quality?: string,
	onProgress?: ProgressCallback,
	attempt = 0,
	signal?: AbortSignal,
): Promise<YtDlpResult> {
	return new Promise(resolve => {
		let stdoutData = ''
		let stderrData = ''
		let settled = false

		const finish = (result: YtDlpResult) => {
			if (settled) return
			settled = true
			resolve(result)
		}

		const outputTemplate = join(outputDir, 'video.%(ext)s')
		const downloadUrl = getDownloadUrl(url)
		const isRutube = isRutubeUrl(downloadUrl)
		const isYouTube = !!extractYouTubeVideoId(url)
		const isVkVideo = !!extractVkVideoId(url)
		const formatSelector = buildFormatSelector(quality, attempt, isYouTube || isVkVideo)

		const args = [
			'--newline',
			'--progress',
			'--no-part',
			...getYtDlpNetworkArgs(),
			'--socket-timeout', '20',
			'--retries', '3',
			'--fragment-retries', '3',
			'-f', formatSelector,
			'-o', outputTemplate,
			'--no-mtime',
		]

		if (isRutube) {
			args.push('--hls-use-mpegts')
		}

		if (isYouTube) {
			args.push('--no-playlist')
		}

		args.push(downloadUrl)
		
		console.log('[yt-dlp] Starting download')
		console.log('[yt-dlp] Format selector:', formatSelector)
		console.log('[yt-dlp] Download URL:', downloadUrl)
		console.log('[yt-dlp] Proxy enabled:', !!getYtDlpProxy())
		console.log('[yt-dlp] Command: yt-dlp ' + args.join(' '))
		console.log('[yt-dlp] Working directory:', outputDir)

		const proc = spawn('yt-dlp', args)
		const abortDownload = () => {
			console.log('[yt-dlp] Aborting download')
			proc.kill('SIGTERM')
			setTimeout(() => {
				if (!proc.killed) proc.kill('SIGKILL')
			}, 2000)
			finish({ success: false, error: 'Download canceled' })
		}

		if (signal?.aborted) {
			abortDownload()
			return
		}

		signal?.addEventListener('abort', abortDownload, { once: true })

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
			signal?.removeEventListener('abort', abortDownload)
			console.log('[yt-dlp] Process exited with code:', code)

			if (signal?.aborted) {
				finish({ success: false, error: 'Download canceled' })
				return
			}

			if (code === 0) {
				if (!(await delay(10000, signal))) {
					finish({ success: false, error: 'Download canceled' })
					return
				}
				const files = readdirSync(outputDir)
					.filter(f => /\.(mp4|mkv|webm|mov|ts)$/i.test(f))
					.map(f => {
						const path = join(outputDir, f)
						const stat = statSync(path)
						return { name: f, path, size: stat.size, mtimeMs: stat.mtimeMs }
					})
					.filter(f => existsSync(f.path))
					.sort((a, b) => b.mtimeMs - a.mtimeMs)

				if (files.length > 0) {
					const file = files[0]!
					try {
						if (file.size > 1000) {
							if (!(await delay(5000, signal))) {
								finish({ success: false, error: 'Download canceled' })
								return
							}
							const newStat = statSync(file.path)
							if (file.size === newStat.size) {
								console.log('[yt-dlp] File ready:', file.path, 'size:', newStat.size)
								finish({ success: true, filePath: file.path, quality: normalizeQuality(quality) || 'best' })
								return
							}
						}
					} catch (e) {
						console.error('[yt-dlp] Error checking file:', e)
					}
				}
				console.error('[yt-dlp] No output file found:', files.map(f => f.name))
				finish({ success: false, error: 'No output file found' })
			} else {
				const errorMsg = stderrData.trim() || `yt-dlp failed with code ${code}`
				console.error('[yt-dlp] Error:', errorMsg)
				finish({ success: false, error: errorMsg })
			}
		})

		proc.on('error', err => {
			signal?.removeEventListener('abort', abortDownload)
			console.error('[yt-dlp] Spawn error:', err)
			finish({ success: false, error: err.message })
		})
	})
}

export async function downloadWithRetry(
	url: string,
	outputDir: string,
	quality?: string,
	onProgress?: ProgressCallback,
	maxRetries = 3,
	signal?: AbortSignal,
): Promise<YtDlpResult> {
	let lastError: string | undefined

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		if (signal?.aborted) {
			return { success: false, error: 'Download canceled' }
		}

		if (attempt > 0) {
			console.log(`[yt-dlp] Retry attempt ${attempt + 1}/${maxRetries}`)
		}

		const result = await downloadWithYtDlp(url, outputDir, quality, onProgress, attempt, signal)

		if (result.success) {
			return result
		}

		lastError = result.error

		if (attempt < maxRetries - 1) {
			const waitTime = (attempt + 1) * 2000
			console.log(`[yt-dlp] Waiting ${waitTime}ms before retry...`)
			if (!(await delay(waitTime, signal))) {
				return { success: false, error: 'Download canceled' }
			}
		}
	}

	return { success: false, error: lastError }
}
