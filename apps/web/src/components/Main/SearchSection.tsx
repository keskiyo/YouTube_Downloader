import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles } from 'lucide-react'
import type { DownloadProgress, VideoInfo, VideoQuality } from '../../types'
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
	onCancel: () => void
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
	onCancel,
	isDownloading,
	progress,
	platform,
	isServerReady = true,
}: SearchSectionProps) {
	const availableQualities = videoInfo?.formats?.map(f => f.quality.replace('p', '')) || []
	const platformLabel = platform ? `${platform} video` : 'online video'

	return (
		<section className='px-4 pb-12 pt-12 md:pt-18'>
			<div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start'>
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='pt-4'
				>
					<div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary-blue/25 bg-primary-blue/10 px-3 py-1.5 text-xs font-medium text-primary-blue'>
						<Sparkles className='h-3.5 w-3.5' />
						<span>YouTube · Rutube · VK Video</span>
					</div>
					<h1 className='max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl'>
						Скачать {platformLabel} в нужном качестве
					</h1>
					<p className='mt-5 max-w-2xl text-base leading-7 text-text-secondary md:text-lg'>
						Вставьте ссылку, выберите качество и сохраните готовый MP4-файл с видео и звуком.
					</p>
					<div className='mt-7 flex flex-wrap gap-3 text-sm text-text-secondary'>
						<div className='inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2'>
							<ShieldCheck className='h-4 w-4 text-primary-blue' />
							<span>Проверка потоков через ffprobe</span>
						</div>
						<div className='rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2'>
							SSE-прогресс загрузки
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 18 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.08 }}
					className='glass-panel rounded-2xl p-4 md:p-5'
				>
					<UrlInput
						onSubmit={onSearch}
						loading={loading}
						videoInfo={videoInfo}
					/>

					<div className='mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3'>
						<div>
							<p className='text-xs font-medium uppercase tracking-[0.16em] text-text-secondary'>
								Качество
							</p>
							<p className='mt-1 text-sm text-white'>Выберите перед скачиванием</p>
						</div>
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
							onCancel={onCancel}
							loading={isDownloading}
							progress={progress}
							disabled={!isServerReady}
						/>
					)}
				</motion.div>
			</div>
		</section>
	)
}
