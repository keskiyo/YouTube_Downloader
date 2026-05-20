import { spawn } from 'child_process'
import { getYtDlpNetworkArgs, getYtDlpProxy } from '../../config/network'
import { extractYouTubeVideoId } from '../platform-parser'
import type { VideoInfo, VideoFormat } from '../../types'

const INVIDIOUS_INSTANCES = [
	'https://invidious.privacyredirect.com/api/v1',
	'https://invidious.projectsegfault.au/api/v1',
	'https://yewtu.be/api/v1',
	'https://inv.nadeko.net/api/v1',
	'https://iv.nbo1.com/api/v1',
]

async function fetchWithTimeout(url: string, timeout = 1500): Promise<Response> {
	const controller = new AbortController()
	const id = setTimeout(() => controller.abort(), timeout)

	try {
		const response = await fetch(url, { signal: controller.signal })
		clearTimeout(id)
		return response
	} catch (err) {
		clearTimeout(id)
		throw err
	}
}

async function fetchViaInvidious(videoId: string): Promise<VideoInfo> {
	const errors: string[] = []

	for (const baseUrl of INVIDIOUS_INSTANCES) {
		try {
			console.log(`[invidious] Trying ${baseUrl}`)
			const response = await fetchWithTimeout(
				`${baseUrl}/videos/${videoId}?fields=title,videoId,thumbnailUrl,author,lengthSeconds,adaptiveFormats,formatStreams`
			)

			if (!response.ok) {
				errors.push(`${baseUrl}: HTTP ${response.status}`)
				continue
			}

			const data = await response.json() as Record<string, unknown>
			console.log('[invidious] Success!')

			const formats: VideoFormat[] = []

			const adaptiveFormats = data.adaptiveFormats as Array<Record<string, unknown>> | undefined
			if (adaptiveFormats) {
				for (const f of adaptiveFormats) {
					const type = f.type as string | undefined
					if (type?.startsWith('video')) {
						formats.push({
							quality: (f.quality as string) || 'unknown',
							format: 'mp4',
							size: parseInt((f.contentLength as string) || '0'),
							hasAudio: false,
						})
					}
				}
			}

			const formatStreams = data.formatStreams as Array<Record<string, unknown>> | undefined
			if (formatStreams) {
				for (const f of formatStreams) {
					if (!formats.some((x) => x.quality === (f.quality as string))) {
						formats.push({
							quality: (f.quality as string) || 'unknown',
							format: 'mp4',
							size: parseInt((f.contentLength as string) || '0'),
							hasAudio: true,
						})
					}
				}
			}

			formats.sort((a, b) => parseInt(b.quality) - parseInt(a.quality))

			return {
				title: (data.title as string) || 'Unknown',
				thumbnail: (data.thumbnailUrl as string) || '',
				duration: parseInt((data.lengthSeconds as string) || '0'),
				platform: 'YouTube',
				videoId: (data.videoId as string) || videoId,
				author: (data.author as string) || 'Unknown',
				formats: formats.slice(0, 10),
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			console.error(`[invidious] ${baseUrl} failed: ${msg}`)
			errors.push(`${baseUrl}: ${msg}`)
		}
	}

	throw new Error(`All Invidious instances failed. Last errors: ${errors.slice(0, 3).join('; ')}`)
}

function createFallbackYouTubeInfo(videoId: string): VideoInfo {
	const qualities = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p']

	return {
		title: `YouTube video ${videoId}`,
		thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
		duration: 0,
		platform: 'YouTube',
		videoId,
		author: 'YouTube',
		formats: qualities.map(quality => ({
			quality,
			format: 'mp4',
			size: 0,
			hasAudio: true,
		})),
	}
}

function parseContentLength(value: unknown): number {
	const parsed = Number.parseInt(String(value ?? '0'), 10)
	return Number.isFinite(parsed) ? parsed : 0
}

function buildFormatsFromYtDlp(formats: Array<Record<string, unknown>> | undefined): VideoFormat[] {
	if (!formats) {
		return []
	}

	const byQuality = new Map<string, VideoFormat>()

	for (const format of formats) {
		const height = typeof format.height === 'number' ? format.height : undefined
		const qualityLabel = height ? `${height}p` : String(format.format_note || format.quality || 'unknown')
		const ext = String(format.ext || 'mp4')
		const acodec = String(format.acodec || 'none')
		const vcodec = String(format.vcodec || 'none')
		const hasVideo = vcodec !== 'none'

		if (!hasVideo || qualityLabel === 'unknown') {
			continue
		}

		const size = parseContentLength(format.filesize || format.filesize_approx)
		const existing = byQuality.get(qualityLabel)
		if (!existing || size > existing.size) {
			byQuality.set(qualityLabel, {
				quality: qualityLabel,
				format: ext,
				size,
				hasAudio: acodec !== 'none',
				bitrate: typeof format.tbr === 'number' ? format.tbr : undefined,
			})
		}
	}

	return Array.from(byQuality.values())
		.sort((a, b) => Number.parseInt(b.quality, 10) - Number.parseInt(a.quality, 10))
		.slice(0, 10)
}

async function fetchViaYtDlp(videoId: string): Promise<VideoInfo> {
	const url = `https://www.youtube.com/watch?v=${videoId}`
	const args = [
		'--dump-json',
		'--no-download',
		'--no-playlist',
		'--socket-timeout', '20',
		...getYtDlpNetworkArgs(),
		url,
	]

	console.log('[youtube] Falling back to yt-dlp metadata')
	console.log('[youtube] Proxy enabled:', !!getYtDlpProxy())

	return new Promise((resolve, reject) => {
		let stdout = ''
		let stderr = ''
		let settled = false

		const proc = spawn('yt-dlp', args)
		const timeout = setTimeout(() => {
			if (settled) return
			settled = true
			proc.kill('SIGKILL')
			reject(new Error('yt-dlp metadata request timed out'))
		}, 8000)

		proc.stdout.on('data', data => {
			stdout += data.toString()
		})

		proc.stderr.on('data', data => {
			stderr += data.toString()
		})

		proc.on('error', err => {
			if (settled) return
			settled = true
			clearTimeout(timeout)
			reject(err)
		})

		proc.on('close', code => {
			if (settled) return
			settled = true
			clearTimeout(timeout)

			if (code !== 0) {
				reject(new Error(stderr.trim() || `yt-dlp metadata failed with code ${code}`))
				return
			}

			try {
				const data = JSON.parse(stdout) as Record<string, unknown>
				resolve({
					title: String(data.title || 'Unknown'),
					thumbnail: String(data.thumbnail || ''),
					duration: typeof data.duration === 'number' ? data.duration : 0,
					platform: 'YouTube',
					videoId: String(data.id || videoId),
					author: String(data.uploader || data.channel || 'Unknown'),
					formats: buildFormatsFromYtDlp(data.formats as Array<Record<string, unknown>> | undefined),
				})
			} catch {
				reject(new Error('Failed to parse yt-dlp metadata response'))
			}
		})
	})
}

export async function getYouTubeInfo(url: string): Promise<VideoInfo> {
	console.log('[youtube] Getting info for:', url)

	const videoId = extractYouTubeVideoId(url)
	if (!videoId) {
		throw new Error('Could not extract video ID from URL')
	}

	console.log('[youtube] Video ID:', videoId)
	try {
		return await fetchViaInvidious(videoId)
	} catch (err) {
		console.warn('[youtube] Invidious failed:', err)
		try {
			return await fetchViaYtDlp(videoId)
		} catch (ytDlpErr) {
			console.warn('[youtube] yt-dlp metadata failed, using fallback info:', ytDlpErr)
			return createFallbackYouTubeInfo(videoId)
		}
	}
}

export function getDownloadStream(url: string, quality?: string): NodeJS.ReadableStream {
	throw new Error('Download via Invidious not implemented. Use direct streaming.')
}

export function createYouTubeDownloadStream(url: string, quality?: string): NodeJS.ReadableStream {
	throw new Error('Download via Invidious not implemented. Use direct streaming.')
}
