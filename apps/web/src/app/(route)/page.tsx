import { useEffect, useState } from 'react'
import { InstructionBlock } from '../../components/Instruction/InstructionBlock'
import { SearchSection } from '../../components/Main/SearchSection'
import { SeoText } from '../../components/Seo/SeoText'
import { useVideoDownload } from '../../hooks/useVideoDownload'
import type { VideoQuality } from '../../types'

export default function MainPage({ platform }: { platform?: string }) {
	const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('best')
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

	useEffect(() => {
		if (error) {
			setVisibleError(error)
			const timer = setTimeout(() => setVisibleError(null), 3000)
			//  Очистка таймера: сработает при изменении error или размонтировании компонента
			return () => clearTimeout(timer)
		}
	}, [error])

	const handleSearch = async (url: string) => {
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
