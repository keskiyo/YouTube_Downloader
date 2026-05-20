import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
	} = useVideoDownload()

	const [visibleError, setVisibleError] = useState<string | null>(null)
	const searchUrlFromNavigation = (location.state as NavigationState | null)?.searchUrl

	useEffect(() => {
		if (error) {
			setVisibleError(error)
			const timer = setTimeout(() => setVisibleError(null), 3000)
			//  Очистка таймера: сработает при изменении error или размонтировании компонента
			return () => clearTimeout(timer)
		}
	}, [error])

	useEffect(() => {
		if (searchUrlFromNavigation) {
			void fetchVideoInfo(searchUrlFromNavigation)
			navigate(location.pathname, { replace: true, state: null })
		}
	}, [fetchVideoInfo, location.pathname, navigate, searchUrlFromNavigation])

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
			<div className='max-w-4xl mx-auto'>
				<SearchSection
					onSearch={handleSearch}
					videoInfo={videoInfo}
					loading={loading}
					selectedQuality={selectedQuality}
					onQualityChange={setSelectedQuality}
					onDownload={handleDownload}
					isDownloading={isDownloading}
					progress={progress}
					platform={platform}
					isServerReady={isServerReady}
				/>
				<InstructionBlock />
				<SeoText />
			</div>
			{visibleError && (
				<div className='fixed top-30 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/90 text-white rounded-lg'>
					{visibleError}
				</div>
			)}
		</>
	)
}
