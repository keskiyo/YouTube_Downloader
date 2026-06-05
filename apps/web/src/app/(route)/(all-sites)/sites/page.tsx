import { motion } from 'framer-motion'
import { ArrowRight, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { platforms } from '../../../../data/platforms'

export default function SitesPage() {
	const navigate = useNavigate()

	return (
		<div className='mx-auto max-w-6xl px-4 py-14'>
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='mb-10 max-w-2xl'
			>
				<p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary-blue'>
					Платформы
				</p>
				<h1 className='mt-3 text-4xl font-semibold text-white md:text-5xl'>
					Выберите сайт для скачивания
				</h1>
				<p className='mt-4 text-base leading-7 text-text-secondary'>
					Каждая платформа использует тот же надежный pipeline: yt-dlp, ffmpeg, проверка потоков и готовый MP4.
				</p>
			</motion.div>

			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{platforms.map((platform, index) => (
					<motion.button
						key={platform.name}
						type='button'
						onClick={() => navigate(`/site/${platform.name}`)}
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className='glass-panel focus-ring group rounded-2xl p-5 text-left transition-colors hover:border-primary-blue/60'
					>
						<div className='mb-6 flex items-center justify-between'>
							<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary-blue/10'>
								<Download className='h-5 w-5 text-primary-blue' />
							</div>
							<ArrowRight className='h-5 w-5 text-text-secondary transition-transform group-hover:translate-x-1 group-hover:text-primary-blue' />
						</div>
						<h2 className='text-xl font-semibold text-white'>{platform.name}</h2>
						<p className='mt-2 text-sm leading-6 text-text-secondary'>
							Скачать видео с {platform.name} в выбранном качестве.
						</p>
					</motion.button>
				))}
			</div>
		</div>
	)
}
