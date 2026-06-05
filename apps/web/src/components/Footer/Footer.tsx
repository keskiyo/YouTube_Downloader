import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { platforms } from '../../data/platforms'

export function Footer() {
	const navigate = useNavigate()

	return (
		<footer className='border-t border-white/10 px-4 py-8'>
			<div className='mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between'>
				<div>
					<p className='text-sm font-semibold text-white'>Downloader Video</p>
					<p className='mt-1 text-xs text-text-secondary'>
						Локальный загрузчик видео через yt-dlp и ffmpeg.
					</p>
				</div>
				<div className='flex flex-wrap gap-2'>
					{platforms.map((platform, index) => (
						<motion.button
							key={platform.name}
							type='button'
							onClick={() => navigate(`/site/${platform.name}`)}
							initial={{ opacity: 0, y: 8 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.04 }}
							className='focus-ring rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary-blue/60 hover:text-white'
						>
							{platform.name}
						</motion.button>
					))}
				</div>
			</div>
		</footer>
	)
}
