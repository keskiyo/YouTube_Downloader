import type { ParsedUrl, SupportedPlatform } from '../types'

const PLATFORM_PATTERNS: Record<SupportedPlatform, RegExp> = {
	YouTube: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
	VK: /^(?:https?:\/\/)?(?:www\.)?vk\.com\/video(-?\d+_\d+)/,
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

function extractVideoId(platform: string, match: RegExpMatchArray): string | null {
	console.log('[platform-parser] extractVideoId for', platform, 'match:', match.slice(1))

	switch (platform) {
		case 'YouTube':
			return match[1] || null
		case 'VK':
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