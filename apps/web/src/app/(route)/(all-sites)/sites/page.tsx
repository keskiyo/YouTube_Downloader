import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { platforms } from '../../../../data/platforms'

export default function SitesPage() {
	const navigate = useNavigate()

	return (
		<div className='max-w-6xl mx-auto px-4 py-12'>
			<motion.h1
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='text-3xl md:text-5xl font-bold text-center mb-12 text-white'
			>
				Другие <span className='text-primary-blue'>сайты</span>
			</motion.h1>

			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
				{platforms.map((platform, index) => (
					<motion.button
						key={platform.name}
						onClick={() => navigate(`/site/${platform.name}`)}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0 }}
						whileHover={{ scale: 1.05 }}
						className='relative overflow-hidden bg-bg-secondary border border-border-color rounded-xl p-8 text-center hover:border-primary-blue transition-colors group text-white cursor-pointer'
					>
						<div className='text-4xl mb-4'>{platform.name}</div>
						<div className='text-text-secondary text-sm'>
							Скачать видео с {platform.name}
						</div>
						<Download className='w-10 h-10 text-primary-blue mx-auto mt-4' />
					</motion.button>
				))}
			</div>
		</div>
	)
}
