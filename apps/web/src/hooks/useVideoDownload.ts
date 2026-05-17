import { useCallback, useEffect, useRef, useState } from 'react'
import type { DownloadProgress, VideoInfo } from '../types'

function sanitizeAndTransliterate(name: string): string {
	const transliterationMap: Record<string, string> = {
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ё: 'e',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'y',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'kh',
		ц: 'c',
		ч: 'ch',
		ш: 'sh',
		щ: 'shch',
		ъ: '',
		ы: 'y',
		ь: '',
		э: 'e',
		ю: 'yu',
		я: 'ya',
		А: 'A',
		Б: 'B',
		В: 'V',
		Г: 'G',
		Д: 'D',
		Е: 'E',
		Ё: 'E',
		Ж: 'Zh',
		З: 'Z',
		И: 'I',
		Й: 'Y',
		К: 'K',
		Л: 'L',
		М: 'M',
		Н: 'N',
		О: 'O',
		П: 'P',
		Р: 'R',
		С: 'S',
		Т: 'T',
		У: 'U',
		Ф: 'F',
		Х: 'Kh',
		Ц: 'C',
		Ч: 'Ch',
		Ш: 'Sh',
		Щ: 'Shch',
		Ъ: '',
		Ы: 'Y',
		Ь: '',
		Э: 'E',
		Ю: 'Yu',
		Я: 'Ya',
	}

	const transliterated = name
		.split('')
		.map(c => transliterationMap[c] || c)
		.join('')
	return transliterated
		.replace(/[<>:"/\\|?*]/g, '')
		.replace(/\s+/g, '_')
		.substring(0, 80)
}

function getExtension(contentType: string): string {
	if (contentType.includes('mp4') || contentType.includes('quicktime'))
		return 'mp4'
	if (
		contentType.includes('mpeg') ||
		contentType.includes('mp2t') ||
		contentType.includes('ts')
	)
		return 'ts'
	if (contentType.includes('webm')) return 'webm'
	return 'mp4'
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
	const resolvedQualityRef = useRef<string>('best')

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
				throw new Error(
					errData.error || 'Не удалось получить информацию о видео',
				)
			}
			const data = await response.json()
			setVideoInfo(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}, [])

	const downloadVideo = useCallback(
		async (quality?: string) => {
			if (!videoInfo || !originalUrlRef.current) return

			setIsDownloading(true)
			setError(null)
			setProgress({ percent: 0, downloaded: 0, total: 0 })

			try {
				const urlParams = new URLSearchParams({
					url: originalUrlRef.current,
				})
				if (quality && quality !== 'best') {
					urlParams.set('quality', quality)
				}

				const response = await fetch(`/api/video/download?${urlParams}`)

				if (!response.ok) {
					const contentType =
						response.headers.get('content-type') || ''
					if (contentType.includes('application/json')) {
						const errData = await response.json()
						throw new Error(
							errData.error || 'Не удалось скачать видео',
						)
					} else {
						const text = await response.text()
						throw new Error(text || 'Ошибка сервера')
					}
				}

				const contentType =
					response.headers.get('Content-Type') || 'video/mp4'
				const extension = getExtension(contentType)
				const safeName = sanitizeAndTransliterate(
					videoInfo.title || 'video',
				)

				const qualityLabel =
					quality && quality !== 'best'
						? quality.replace('p', '')
						: 'best'
				resolvedQualityRef.current = qualityLabel
				const filename = `${safeName}_${qualityLabel}p.${extension}`

				console.log(
					'[useVideoDownload] Content-Type:',
					contentType,
					'Extension:',
					extension,
					'Filename:',
					filename,
				)

				const reader = response.body?.getReader()
				if (!reader) throw new Error('Нет данных для скачивания')

				const contentLength =
					response.headers.get('Content-Length') || '0'
				const total = parseInt(contentLength, 10) || 0
				let downloaded = 0

				const chunks: BlobPart[] = []
				while (true) {
					const { done, value } = await reader.read()
					if (done) break
					chunks.push(value)
					downloaded += value.length
					setProgress({
						percent:
							total > 0
								? Math.round((downloaded / total) * 100)
								: 0,
						downloaded,
						total,
					})
				}

				const blob = new Blob(chunks, { type: contentType })
				const blobUrl = URL.createObjectURL(blob)
				const a = document.createElement('a')

				a.href = blobUrl
				a.download = filename
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
			} catch (err) {
				console.error('[useVideoDownload] Error:', err)
				setError(
					err instanceof Error ? err.message : 'Произошла ошибка',
				)
			} finally {
				setIsDownloading(false)
				setTimeout(() => setProgress(null), 1000)
			}
		},
		[videoInfo],
	)

	const reset = useCallback(() => {
		setVideoInfo(null)
		setLoading(false)
		setError(null)
		setProgress(null)
		setIsDownloading(false)
		originalUrlRef.current = ''
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
