export type DownloadStatus = 'preparing' | 'downloading' | 'merging' | 'finished' | 'error'

export interface DownloadProgress {
	percent: number
	totalSize?: string
	speed?: string
	eta?: string
	status: DownloadStatus
	error?: string
}
