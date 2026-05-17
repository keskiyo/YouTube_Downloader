import type { VideoInfo, VideoFormat } from '../../types'

const INVIDIOUS_INSTANCES = [
	'https://invidious.privacyredirect.com/api/v1',
	'https://invidious.projectsegfault.au/api/v1',
	'https://yewtu.be/api/v1',
	'https://inv.nadeko.net/api/v1',
	'https://iv.nbo1.com/api/v1',
]

function extractVideoId(url: string): string | null {
	const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
	return match?.[1] ?? null
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
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

export async function getYouTubeInfo(url: string): Promise<VideoInfo> {
	console.log('[youtube] Getting info for:', url)

	const videoId = extractVideoId(url)
	if (!videoId) {
		throw new Error('Could not extract video ID from URL')
	}

	console.log('[youtube] Video ID:', videoId)
	return fetchViaInvidious(videoId)
}

export function getDownloadStream(url: string, quality?: string): NodeJS.ReadableStream {
	throw new Error('Download via Invidious not implemented. Use direct streaming.')
}

export function createYouTubeDownloadStream(url: string, quality?: string): NodeJS.ReadableStream {
	throw new Error('Download via Invidious not implemented. Use direct streaming.')
}