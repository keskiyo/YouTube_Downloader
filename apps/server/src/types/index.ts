export interface VideoFormat {
	quality: string
	format: string
	size: number
	hasAudio: boolean
	bitrate?: number
}

export interface VideoInfo {
	title: string
	thumbnail: string
	duration: number
	platform: string
	videoId: string
	author: string
	formats: VideoFormat[]
}

export interface DownloadProgress {
	loaded: number
	total: number
	percentage: number
}

export type SupportedPlatform =
	| 'YouTube'
	| 'VkVideo'
	| 'Yandex'
	| 'Rutube'
	| 'Telegram'
	| 'Odnoklassniki'
	| 'Video@Mail.Ru'
	| 'Dzen'
	| 'Smotrim'

export interface ParsedUrl {
	platform: SupportedPlatform
	videoId: string
	originalUrl: string
}

export interface ApiError {
	error: string
	code: string
	details?: string
}
