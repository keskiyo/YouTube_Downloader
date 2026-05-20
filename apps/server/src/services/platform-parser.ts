import type { ParsedUrl, SupportedPlatform } from '../types'

const PLATFORM_PATTERNS: Record<SupportedPlatform, RegExp> = {
	YouTube: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
	VkVideo: /^(?:https?:\/\/)?(?:www\.)?(?:vk\.com|vkvideo\.ru)\/video(-?\d+_\d+)/,
	Yandex: /^(?:https?:\/\/)?(?:www\.)?yandex\.ru\/(?:[^\/]+\/video\/[^\/]+)/,
	Rutube: /^(?:https?:\/\/)?(?:www\.)?rutube\.ru\/video\/([a-zA-Z0-9]+)/,
	Telegram: /^(?:https?:\/\/)?t\.me\/([^\/]+)\/(\d+)/,
	Odnoklassniki: /^(?:https?:\/\/)?(?:www\.)?ok\.ru\/([^\/]+)/,
	'Video@Mail.Ru': /^(?:https?:\/\/)?(?:www\.)?mail\.ru\/video\/([^\/]+)/,
	Dzen: /^(?:https?:\/\/)?(?:www\.)?dzen\.ru\/([^\/]+)/,
	Smotrim: /^(?:https?:\/\/)?(?:www\.)?smotrim\.ru\/([^\/]+)/,
}

export function parseUrl(url: string): ParsedUrl | null {
	console.log('[platform-parser] Parsing URL:', url)

	const youtubeId = extractYouTubeVideoId(url)
	if (youtubeId) {
		console.log('[platform-parser] Matched platform: YouTube videoId:', youtubeId)
		return {
			platform: 'YouTube',
			videoId: youtubeId,
			originalUrl: url,
		}
	}

	const vkVideoId = extractVkVideoId(url)
	if (vkVideoId) {
		console.log('[platform-parser] Matched platform: VkVideo videoId:', vkVideoId)
		return {
			platform: 'VkVideo',
			videoId: vkVideoId,
			originalUrl: url,
		}
	}

	const normalizedUrl = url.split('&')[0]

	for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
		const match = normalizedUrl?.match(pattern)
		if (match) {
			const videoId = extractVideoId(platform, match)
			if (videoId) {
				console.log('[platform-parser] Matched platform:', platform, 'videoId:', videoId)
				return {
					platform: platform as SupportedPlatform,
					videoId,
					originalUrl: url,
				}
			}
		}
	}

	console.log('[platform-parser] No match found')
	return null
}

export function extractVkVideoId(url: string): string | null {
	try {
		const parsedUrl = new URL(url)
		const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
		const isVkVideo = hostname === 'vkvideo.ru' || hostname.endsWith('.vkvideo.ru')
		const isVk = hostname === 'vk.com' || hostname.endsWith('.vk.com')

		if (!isVkVideo && !isVk) {
			return null
		}

		const pathMatch = parsedUrl.pathname.match(/^\/video(-?\d+_\d+)/)
		if (pathMatch?.[1]) {
			return pathMatch[1]
		}

		const oid = parsedUrl.searchParams.get('oid')
		const id = parsedUrl.searchParams.get('id')
		if (oid && id && /^-?\d+$/.test(oid) && /^\d+$/.test(id)) {
			return `${oid}_${id}`
		}
	} catch {
		const match = url.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+_\d+)/i)
		return match?.[1] ?? null
	}

	return null
}

export function normalizeVkVideoUrl(url: string): string {
	const videoId = extractVkVideoId(url)
	return videoId ? `https://vk.com/video${videoId}` : url
}

export function extractYouTubeVideoId(url: string): string | null {
	try {
		const parsedUrl = new URL(url)
		const hostname = parsedUrl.hostname.toLowerCase()
		const isYoutube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com')
		const isShort = hostname === 'youtu.be'

		if (isYoutube) {
			if (parsedUrl.pathname === '/watch') {
				const videoId = parsedUrl.searchParams.get('v')
				return isValidYouTubeId(videoId) ? videoId : null
			}

			const match = parsedUrl.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/)
			return isValidYouTubeId(match?.[1]) ? match![1]! : null
		}

		if (isShort) {
			const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0]
			return isValidYouTubeId(videoId) ? videoId : null
		}
	} catch {
		const match = url.match(/(?:youtube\.com\/(?:watch\?.*?[?&]?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
		return isValidYouTubeId(match?.[1]) ? match![1]! : null
	}

	return null
}

function isValidYouTubeId(videoId?: string | null): videoId is string {
	return /^[a-zA-Z0-9_-]{11}$/.test(videoId ?? '')
}

function extractVideoId(platform: string, match: RegExpMatchArray): string | null {
	console.log('[platform-parser] extractVideoId for', platform, 'match:', match.slice(1))

	switch (platform) {
		case 'YouTube':
			return match[1] || null
		case 'VkVideo':
			return match[1] || null
		default:
			return match[1] || null
	}
}

export function isSupportedUrl(url: string): boolean {
	return parseUrl(url) !== null
}

export function getPlatformFromUrl(url: string): SupportedPlatform | null {
	const parsed = parseUrl(url)
	return parsed?.platform || null
}
