import { motion } from 'framer-motion'
import { CheckCircle, Download, Loader2, XCircle } from 'lucide-react'
import type { DownloadProgress, VideoInfo } from '../../types'

interface VideoResultProps {
	video: VideoInfo
	onDownload: () => void
	onCancel: () => void
	loading?: boolean
	progress?: DownloadProgress | null
	disabled?: boolean
}

export function VideoResult({
	video,
	onDownload,
	onCancel,
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
				return 'Подготовка'
			case 'downloading':
				return 'Скачивание'
			case 'merging':
				return 'Сборка MP4'
			case 'finished':
				return 'Готово'
			case 'error':
				return 'Ошибка'
			default:
				return 'Загрузка'
		}
	}

	const isActive =
		progress &&
		['preparing', 'downloading', 'merging'].includes(progress.status)

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			className='mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/24'
		>
			<div className='aspect-video bg-black'>
				<img
					src={video.thumbnail}
					alt={video.title}
					className='h-full w-full object-contain'
				/>
			</div>
			<div className='space-y-4 p-4'>
				<div>
					<h3 className='line-clamp-2 text-base font-semibold leading-6 text-white'>
						{video.title}
					</h3>
					<div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-secondary'>
						<span>{video.author}</span>
						<span>{formatDuration(video.duration)}</span>
					</div>
				</div>

				<button
					type='button'
					onClick={onDownload}
					disabled={loading || disabled}
					className='focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-blue text-sm font-semibold text-white shadow-[0_16px_36px_rgba(21,168,223,0.22)] transition-colors hover:bg-[#1297ca] disabled:cursor-not-allowed disabled:opacity-50'
				>
					{loading ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<Download className='h-4 w-4' />
					)}
					<span>{loading ? 'Загрузка' : 'Скачать'}</span>
				</button>

				{isActive && (
					<div className='space-y-3 rounded-xl border border-white/10 bg-bg-primary/80 p-3'>
						<div className='flex items-center justify-between gap-3'>
							<div className='flex items-center gap-2'>
								<Loader2 className='h-4 w-4 animate-spin text-primary-blue' />
								<span className='text-sm font-medium text-white'>
									{getStatusText(progress?.status)}
								</span>
							</div>
							<span className='text-sm font-semibold text-primary-blue'>
								{Math.round(progress?.percent || 0)}%
							</span>
						</div>
						<div className='h-2 overflow-hidden rounded-full bg-white/8'>
							<motion.div
								initial={{ width: 0 }}
								animate={{
									width: `${progress?.percent || 0}%`,
								}}
								transition={{ duration: 0.25 }}
								className='h-full rounded-full bg-primary-blue'
							/>
						</div>
						<div className='flex flex-wrap justify-between gap-2 text-xs text-text-secondary'>
							{progress?.speed && <span>{progress.speed}</span>}
							{progress?.eta && (
								<span>Осталось: {progress.eta}</span>
							)}
							{progress?.totalSize && !progress?.speed && (
								<span>{progress.totalSize}</span>
							)}
						</div>
						<button
							type='button'
							onClick={onCancel}
							className='focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-400/35 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10'
						>
							<XCircle className='h-4 w-4' />
							<span>Отменить загрузку</span>
						</button>
					</div>
				)}

				{progress?.status === 'finished' && (
					<div className='flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-500/10 p-3'>
						<CheckCircle className='h-4 w-4 text-green-400' />
						<span className='text-sm text-green-300'>
							Файл готов к сохранению
						</span>
					</div>
				)}

				{progress?.status === 'error' && (
					<div className='rounded-xl border border-red-400/20 bg-red-500/10 p-3'>
						<span className='text-sm text-red-300'>
							{progress.error || 'Произошла ошибка'}
						</span>
					</div>
				)}
			</div>
		</motion.div>
	)
}
