import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { InstructionBlock } from '../../components/Instruction/InstructionBlock'
import { SearchSection } from '../../components/Main/SearchSection'
import { SeoText } from '../../components/Seo/SeoText'
import { getPlatformByVideoUrl } from '../../data/platforms'
import { useVideoDownload } from '../../hooks/useVideoDownload'
import type { VideoQuality } from '../../types'

interface NavigationState {
	searchUrl?: string
}

export default function MainPage({ platform }: { platform?: string }) {
	const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('best')
	const lastProgressStatusRef = useRef<string | null>(null)
	const location = useLocation()
	const navigate = useNavigate()
	const {
		videoInfo,
		loading,
		error,
		progress,
		isDownloading,
		isServerReady,
		fetchVideoInfo,
		downloadVideo,
		cancelDownload,
	} = useVideoDownload()

	const searchUrlFromNavigation = (location.state as NavigationState | null)?.searchUrl

	useEffect(() => {
		if (searchUrlFromNavigation) {
			void fetchVideoInfo(searchUrlFromNavigation)
			navigate(location.pathname, { replace: true, state: null })
		}
	}, [fetchVideoInfo, location.pathname, navigate, searchUrlFromNavigation])

	useEffect(() => {
		if (!error) {
			return
		}

		toast.error(error, {
			toastId: `video-error-${error}`,
		})
	}, [error])

	useEffect(() => {
		if (!progress?.status || progress.status === lastProgressStatusRef.current) {
			return
		}

		lastProgressStatusRef.current = progress.status

		if (progress.status === 'downloading') {
			toast.info('Загрузка началась', {
				toastId: 'video-download-started',
			})
		}

		if (progress.status === 'merging') {
			toast.info('Собираем MP4-файл', {
				toastId: 'video-download-merging',
			})
		}

		if (progress.status === 'finished') {
			toast.success('Файл готов к сохранению', {
				toastId: 'video-download-finished',
			})
		}
	}, [progress?.status])

	const handleSearch = async (url: string) => {
		const detectedPlatform = getPlatformByVideoUrl(url)

		if (detectedPlatform && detectedPlatform.name !== platform) {
			navigate(detectedPlatform.url, { state: { searchUrl: url } })
			return
		}

		await fetchVideoInfo(url)
	}

	const handleDownload = async () => {
		const quality = selectedQuality === 'best' ? undefined : selectedQuality
		await downloadVideo(quality)
	}

	return (
		<>
			<div>
				<SearchSection
					onSearch={handleSearch}
					videoInfo={videoInfo}
					loading={loading}
					selectedQuality={selectedQuality}
					onQualityChange={setSelectedQuality}
					onDownload={handleDownload}
					onCancel={cancelDownload}
					isDownloading={isDownloading}
					progress={progress}
					platform={platform}
					isServerReady={isServerReady}
				/>
				<InstructionBlock />
				<SeoText />
			</div>
		</>
	)
}
