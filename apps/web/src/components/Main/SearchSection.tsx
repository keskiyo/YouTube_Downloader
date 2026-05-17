import { motion } from 'framer-motion'
import type { VideoInfo, VideoQuality, DownloadProgress } from '../../types'
import { QualitySelector } from './QualitySelector'
import { UrlInput } from './UrlInput'
import { VideoResult } from './VideoResult'

interface SearchSectionProps {
	onSearch: (url: string) => void
	videoInfo: VideoInfo | null
	loading: boolean
	selectedQuality: VideoQuality
	onQualityChange: (quality: VideoQuality) => void
	onDownload: () => void
	isDownloading?: boolean
	progress?: DownloadProgress | null
	platform?: string
	isServerReady?: boolean
}

export function SearchSection({
	onSearch,
	videoInfo,
	loading,
	selectedQuality,
	onQualityChange,
	onDownload,
	isDownloading,
	progress,
	platform,
	isServerReady = true,
}: SearchSectionProps) {
	const availableQualities = videoInfo?.formats?.map(f => f.quality.replace('p', '')) || []

	return (
		<section className='min-h-[60vh] flex flex-col items-center justify-center px-4 py-8'>
			<motion.h1
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className='text-2xl md:text-4xl font-bold text-white text-center mb-12 uppercase tracking-tight'
			>
				Скачать видео бесплатно онлайн{' '}
				<span className='text-primary-blue'>{platform}</span>
			</motion.h1>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className='w-full flex flex-col items-center gap-4'
			>
				<UrlInput
					onSubmit={onSearch}
					loading={loading}
					videoInfo={videoInfo}
				/>
				<div className='flex items-center gap-4'>
					<QualitySelector
						value={selectedQuality}
						onChange={onQualityChange}
						availableQualities={availableQualities}
					/>
				</div>
				{videoInfo && (
					<VideoResult
						video={videoInfo}
						onDownload={onDownload}
						loading={isDownloading}
						progress={progress}
						disabled={!isServerReady}
					/>
				)}
			</motion.div>
		</section>
	)
}