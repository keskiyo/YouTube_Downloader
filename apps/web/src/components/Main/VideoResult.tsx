import { motion } from 'framer-motion'
import { CheckCircle, Download, Loader2 } from 'lucide-react'
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

	const getStatusText = (
		status: DownloadProgress['status'] | undefined,
	): string => {
		switch (status) {
			case 'preparing':
				return 'Подготовка...'
			case 'downloading':
				return 'Скачивание...'
			case 'merging':
				return 'Объединение дорожек...'
			case 'finished':
				return 'Готово!'
			case 'error':
				return 'Ошибка'
			default:
				return 'Загрузка...'
		}
	}

	const isActive =
		progress &&
		['preparing', 'downloading', 'merging'].includes(progress.status)

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

				{isActive && (
					<div className='space-y-2 p-3 bg-bg-primary rounded-lg'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Loader2 className='w-4 h-4 text-primary-blue animate-spin' />
								<span className='text-text-secondary text-sm'>
									{getStatusText(progress?.status)}
								</span>
							</div>
							<span className='text-primary-blue font-medium'>
								{Math.round(progress?.percent || 0)}%
							</span>
						</div>

						<div className='w-full h-2 bg-bg-secondary rounded-full overflow-hidden'>
							<motion.div
								initial={{ width: 0 }}
								animate={{
									width: `${progress?.percent || 0}%`,
								}}
								transition={{ duration: 0.3 }}
								className='h-full bg-primary-blue rounded-full'
							/>
						</div>

						<div className='flex justify-between text-xs text-text-secondary'>
							{progress?.speed && <span>{progress.speed}</span>}
							{progress?.eta && (
								<span>Осталось: {progress.eta}</span>
							)}
							{progress?.totalSize && !progress?.speed && (
								<span>{progress.totalSize}</span>
							)}
						</div>
					</div>
				)}

				{progress?.status === 'finished' && (
					<div className='flex items-center gap-2 p-3 bg-green-500/10 rounded-lg'>
						<CheckCircle className='w-4 h-4 text-green-500' />
						<span className='text-green-500 text-sm'>
							Файл готов к скачиванию
						</span>
					</div>
				)}

				{progress?.status === 'error' && (
					<div className='p-3 bg-red-500/10 rounded-lg'>
						<span className='text-red-500 text-sm'>
							{progress.error || 'Произошла ошибка'}
						</span>
					</div>
				)}
			</div>
		</motion.div>
	)
}

// ! Тестовая ссылка RUTUBE
// ? https://rutube.ru/video/8e3fbfcce4118bf11cd031563477cb5e/?r=wd

// ! Тестовая ссылка YOUTUBE
// ? https://www.youtube.com/watch?v=XA7Gab8MViw&list=RDXA7Gab8MViw

// ! Vk Видео
// ? https://vkvideo.ru/video-228275494_456239115
