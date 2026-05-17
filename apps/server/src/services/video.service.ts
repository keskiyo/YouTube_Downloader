import type { VideoInfo, ParsedUrl } from '../types'
import { parseUrl } from './platform-parser'
import { getYouTubeInfo } from './platforms/youtube'
import { getRutubeInfo } from './platforms/rutube'

export async function getVideoInfo(url: string): Promise<VideoInfo> {
	console.log('[video.service] getVideoInfo called with:', url)

	const parsed = parseUrl(url)
	console.log('[video.service] Parsed URL:', parsed)

	if (!parsed) {
		throw new Error('Unsupported URL')
	}

	switch (parsed.platform) {
		case 'YouTube':
			return getYouTubeInfo(url)
		case 'Rutube':
			return getRutubeInfo(url)
		default:
			throw new Error(`Platform ${parsed.platform} not supported yet`)
	}
}

export function getDownloadHandler(url: string, quality?: string) {
	const parsed = parseUrl(url)
	if (!parsed) {
		throw new Error('Unsupported URL')
	}

	switch (parsed.platform) {
		case 'YouTube':
			throw new Error('YouTube download via API not implemented')
		case 'Rutube':
			throw new Error('Rutube download not implemented')
		default:
			throw new Error(`Platform ${parsed.platform} not supported yet`)
	}
}

export { parseUrl }