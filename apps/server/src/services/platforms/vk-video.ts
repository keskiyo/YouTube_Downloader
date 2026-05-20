import { spawn } from 'child_process'
import { getYtDlpNetworkArgs } from '../../config/network'
import type { VideoFormat, VideoInfo } from '../../types'
import { extractVkVideoId, normalizeVkVideoUrl } from '../platform-parser'

function parseSize(value: unknown): number {
	const size = Number.parseInt(String(value ?? '0'), 10)
	return Number.isFinite(size) ? size : 0
}

function buildFormats(formats: Array<Record<string, unknown>> | undefined): VideoFormat[] {
	if (!formats) {
		return []
	}

	const byQuality = new Map<string, VideoFormat>()

	for (const format of formats) {
		const height = typeof format.height === 'number' ? format.height : 0
		const vcodec = String(format.vcodec || 'none')
		if (!height || vcodec === 'none') {
			continue
		}

		const quality = `${height}p`
		const size = parseSize(format.filesize || format.filesize_approx)
		const existing = byQuality.get(quality)
		if (!existing || size > existing.size) {
			byQuality.set(quality, {
				quality,
				format: String(format.ext || 'mp4'),
				size,
				hasAudio: String(format.acodec || 'none') !== 'none',
				bitrate: typeof format.tbr === 'number' ? format.tbr : undefined,
			})
		}
	}

	return Array.from(byQuality.values())
		.sort((a, b) => Number.parseInt(b.quality, 10) - Number.parseInt(a.quality, 10))
}

function fallbackInfo(url: string): VideoInfo {
	const videoId = extractVkVideoId(url) || ''
	const qualities = ['1080p', '720p', '480p', '360p', '240p']

	return {
		title: `VK Video ${videoId}`,
		thumbnail: '',
		duration: 0,
		platform: 'VkVideo',
		videoId,
		author: 'VK Video',
		formats: qualities.map(quality => ({
			quality,
			format: 'mp4',
			size: 0,
			hasAudio: true,
		})),
	}
}

export async function getVkVideoInfo(url: string): Promise<VideoInfo> {
	const videoId = extractVkVideoId(url)
	if (!videoId) {
		throw new Error('Could not extract VK Video ID from URL')
	}

	const downloadUrl = normalizeVkVideoUrl(url)
	const args = [
		'--dump-json',
		'--no-download',
		'--no-playlist',
		'--socket-timeout', '20',
		...getYtDlpNetworkArgs(),
		downloadUrl,
	]

	console.log('[vkvideo] Getting info for:', downloadUrl)

	return new Promise(resolve => {
		let stdout = ''
		let stderr = ''
		let settled = false

		const proc = spawn('yt-dlp', args)
		const timeout = setTimeout(() => {
			if (settled) return
			settled = true
			proc.kill('SIGKILL')
			console.warn('[vkvideo] Metadata request timed out, using fallback')
			resolve(fallbackInfo(url))
		}, 30000)

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
			console.warn('[vkvideo] yt-dlp spawn failed, using fallback:', err)
			resolve(fallbackInfo(url))
		})

		proc.on('close', code => {
			if (settled) return
			settled = true
			clearTimeout(timeout)

			if (code !== 0) {
				console.warn('[vkvideo] yt-dlp failed, using fallback:', stderr.trim())
				resolve(fallbackInfo(url))
				return
			}

			try {
				const data = JSON.parse(stdout) as Record<string, unknown>
				const formats = buildFormats(data.formats as Array<Record<string, unknown>> | undefined)
				resolve({
					title: String(data.title || `VK Video ${videoId}`),
					thumbnail: String(data.thumbnail || ''),
					duration: typeof data.duration === 'number' ? data.duration : 0,
					platform: 'VkVideo',
					videoId: String(data.id || videoId),
					author: String(data.uploader || data.channel || 'VK Video'),
					formats: formats.length > 0 ? formats : fallbackInfo(url).formats,
				})
			} catch (err) {
				console.warn('[vkvideo] Failed to parse yt-dlp metadata, using fallback:', err)
				resolve(fallbackInfo(url))
			}
		})
	})
}
