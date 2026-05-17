import { useCallback, useEffect, useRef, useState } from 'react'
import { useSSE } from './useSSE'
import type { DownloadProgress, DownloadStatus, VideoInfo } from '../types'

function sanitizeAndTransliterate(name: string): string {
	const transliterationMap: Record<string, string> = {
		а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
		ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
		н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
		ф: 'f', х: 'kh', ц: 'c', ч: 'ch', ш: 'sh', щ: 'shch',
		ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
		А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E',
		Ж: 'Zh', З: 'Z', И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M',
		Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U',
		Ф: 'F', Х: 'Kh', Ц: 'C', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch',
		Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
	}
	return name
		.split('')
		.map(c => transliterationMap[c] || c)
		.join('')
		.replace(/[<>:"/\\|?*]/g, '')
		.replace(/\s+/g, '_')
		.substring(0, 80)
}

interface UseVideoDownloadReturn {
	videoInfo: VideoInfo | null
	loading: boolean
	error: string | null
	progress: DownloadProgress | null
	isDownloading: boolean
	isServerReady: boolean
	fetchVideoInfo: (url: string) => Promise<void>
	downloadVideo: (quality?: string) => Promise<void>
	reset: () => void
}

export function useVideoDownload(): UseVideoDownloadReturn {
	const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [progress, setProgress] = useState<DownloadProgress | null>(null)
	const [isDownloading, setIsDownloading] = useState(false)
	const [isServerReady, setIsServerReady] = useState(true)

	const originalUrlRef = useRef<string>('')
	const downloadIdRef = useRef<string | null>(null)
	const currentStatusRef = useRef<DownloadStatus | null>(null)

	useEffect(() => {
		fetch('/api/health', { method: 'GET' })
			.then(() => setIsServerReady(true))
			.catch(() => setIsServerReady(false))
	}, [])

	const fetchVideoInfo = useCallback(async (url: string) => {
		setLoading(true)
		setError(null)
		setVideoInfo(null)
		originalUrlRef.current = url

		try {
			const fetchUrl = `/api/video/info?url=${encodeURIComponent(url)}`
			const response = await fetch(fetchUrl)

			if (!response.ok) {
				const errData = await response.json()
				throw new Error(errData.error || 'Не удалось получить информацию о видео')
			}
			const data = await response.json()
			setVideoInfo(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}, [])

	const handleSSEProgress = useCallback((data: DownloadProgress) => {
		console.log('[useVideoDownload] SSE progress:', data.status, data.percent + '%')
		setProgress(data)
		currentStatusRef.current = data.status

		if (data.status === 'finished') {
			console.log('[useVideoDownload] Status is finished, triggering file download')
			triggerFileDownload(data)
		} else if (data.status === 'error') {
			console.log('[useVideoDownload] Status is error:', data.error)
			setError(data.error || 'Ошибка загрузки')
			setIsDownloading(false)
		}
	}, [])

	const triggerFileDownload = useCallback(async (finalProgress: DownloadProgress) => {
		if (!downloadIdRef.current || !videoInfo) {
			setIsDownloading(false)
			return
		}

		try {
			const response = await fetch(`/api/video/file/${downloadIdRef.current}`)

			if (!response.ok) {
				const errData = await response.json()
				throw new Error(errData.error || 'Не удалось скачать файл')
			}

			const contentType = response.headers.get('Content-Type') || 'video/mp4'
			const blob = await response.blob()

			const safeName = sanitizeAndTransliterate(videoInfo.title || 'video')
			const qualityLabel = finalProgress.totalSize || 'best'
			const filename = `${safeName}_${qualityLabel}.mp4`

			const blobUrl = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = blobUrl
			a.download = filename
			a.style.display = 'none'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)

			setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ошибка при сохранении файла')
		} finally {
			setIsDownloading(false)
			downloadIdRef.current = null
		}
	}, [videoInfo])

	const sseUrl = downloadIdRef.current
		? `/api/video/progress/${downloadIdRef.current}`
		: null

	useSSE<DownloadProgress>(sseUrl, {
		onMessage: handleSSEProgress,
		onError: err => {
			console.error('[useVideoDownload] SSE error:', err)
			if (currentStatusRef.current !== 'finished' && currentStatusRef.current !== 'error') {
				setError('Соединение потеряно')
				setIsDownloading(false)
			}
		},
		onClose: () => {
			console.log('[useVideoDownload] SSE connection closed, status:', currentStatusRef.current)
			if (currentStatusRef.current !== 'finished' && currentStatusRef.current !== 'error') {
				setIsDownloading(false)
			}
		},
		autoReconnect: false,
	})

	const downloadVideo = useCallback(async (quality?: string) => {
		if (!videoInfo || !originalUrlRef.current) return

		setIsDownloading(true)
		setError(null)
		setProgress({ percent: 0, status: 'preparing' })
		downloadIdRef.current = null
		currentStatusRef.current = null

		try {
			const urlParams = new URLSearchParams({ url: originalUrlRef.current })
			if (quality && quality !== 'best') {
				urlParams.set('quality', quality)
			}

			const response = await fetch(`/api/video/download?${urlParams}`)

			if (!response.ok) {
				const contentType = response.headers.get('content-type') || ''
				if (contentType.includes('application/json')) {
					try {
						const errData = await response.json()
						throw new Error(errData.error || 'Не удалось скачать видео')
					} catch {
						throw new Error('Не удалось скачать видео')
					}
				} else {
					throw new Error('Не удалось скачать видео')
				}
			}

			const data = await response.json()
			downloadIdRef.current = data.downloadId
			console.log('[useVideoDownload] Download started, ID:', data.downloadId)
		} catch (err) {
			console.error('[useVideoDownload] Error:', err)
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
			setIsDownloading(false)
		}
	}, [videoInfo])

	const reset = useCallback(() => {
		setVideoInfo(null)
		setLoading(false)
		setError(null)
		setProgress(null)
		setIsDownloading(false)
		originalUrlRef.current = ''
		downloadIdRef.current = null
		currentStatusRef.current = null
	}, [])

	return {
		videoInfo,
		loading,
		error,
		progress,
		isDownloading,
		isServerReady,
		fetchVideoInfo,
		downloadVideo,
		reset,
	}
}