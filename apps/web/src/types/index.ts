export interface VideoFormat {
	quality: string
	format: string
	size: number
	hasAudio: boolean
	bitrate?: number
}

export interface VideoInfo {
	id: string
	title: string
	thumbnail: string
	duration: number
	author: string
	platform: string
	videoId: string
	formats: VideoFormat[]
}

export interface DownloadOptions {
	url: string
	quality: VideoQuality
	format: VideoFormat
}

export type VideoQuality =
	| '144'
	| '240'
	| '360'
	| '480'
	| '720'
	| '1080'
	| '1440'
	| '2160'
	| 'best'
	| 'choose'

export type DownloadStatus = 'preparing' | 'downloading' | 'merging' | 'finished' | 'error'

export interface DownloadProgress {
	percent: number
	totalSize?: string
	speed?: string
	eta?: string
	status: DownloadStatus
	error?: string
}

export interface Platform {
	name: string
	url: string
}