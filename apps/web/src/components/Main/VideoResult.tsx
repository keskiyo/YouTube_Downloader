import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import type { DownloadProgress, VideoInfo } from '../../types'

interface VideoResultProps {
	video: VideoInfo
	onDownload: () => void
	loading?: boolean
	progress?: DownloadProgress | null
	disabled?: boolean
}

export function VideoResult({
	video,
	onDownload,
	loading = false,
	progress = null,
	disabled = false,
}: VideoResultProps) {
	const formatDuration = (seconds: number): string => {
		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = seconds % 60
		if (h > 0)
			return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
		return `${m}:${s.toString().padStart(2, '0')}`
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='w-full max-w-2xl mt-6 bg-bg-secondary rounded-xl overflow-hidden border border-border-color'
		>
			<div className='aspect-video bg-black relative'>
				<img
					src={video.thumbnail}
					alt={video.title}
					className='w-full h-full object-contain'
				/>
			</div>
			<div className='p-4'>
				<h3 className='text-white font-medium line-clamp-2 mb-2'>
					{video.title}
				</h3>
				<div className='flex items-center justify-between mb-4'>
					<div className='text-text-secondary text-sm'>
						<span>{video.author}</span>
						<span className='mx-2'>·</span>
						<span>{formatDuration(video.duration)}</span>
					</div>
					<button
						onClick={onDownload}
						disabled={loading || disabled}
						className='px-6 py-2.5 bg-primary-blue text-white rounded-full hover:bg-primary-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
					>
						{loading ? (
							<motion.div
								animate={{ rotate: 360 }}
								transition={{
									duration: 1,
									repeat: Infinity,
									ease: 'linear',
								}}
								className='w-5 h-5 border-2 border-white border-t-transparent rounded-full'
							/>
						) : (
							<>
								<Download className='w-4 h-4' />
								<span>СКАЧАТЬ</span>
							</>
						)}
					</button>
				</div>
				{progress && (
					<div className='space-y-2'>
						<div className='flex justify-between text-sm'>
							<span className='text-text-secondary'>
								Загрузка...
							</span>
							<span className='text-primary-blue font-medium'>
								{progress.percent}%
							</span>
						</div>
						<div className='w-full h-2 bg-bg-primary rounded-full overflow-hidden'>
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${progress.percent}%` }}
								transition={{ duration: 0.3 }}
								className='h-full bg-primary-blue rounded-full'
							/>
						</div>
						<div className='flex justify-between text-xs text-text-secondary'>
							<span>
								{Math.round(progress.downloaded / 1024 / 1024)}{' '}
								MB
							</span>
							<span>
								{Math.round(progress.total / 1024 / 1024)} MB
							</span>
						</div>
					</div>
				)}
				{video.formats && video.formats.filter(f => f.quality !== 'best').length > 0 && (
					<div className='mt-3 text-xs text-text-secondary'>
						Доступные качества:{' '}
						{video.formats.filter(f => f.quality !== 'best').map(f => f.quality).join(', ')}
					</div>
				)}
			</div>
		</motion.div>
	)
}
