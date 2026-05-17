import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { platforms } from '../../data/platforms'

export function Footer() {
	const navigate = useNavigate()

	return (
		<footer className='border-t border-border-color py-8 px-4'>
			<div className='flex flex-wrap justify-center gap-x-6 gap-y-6'>
				{platforms.map((platform, index) => (
					<motion.button
						key={platform.name}
						onClick={() => navigate(`/site/${platform.name}`)}
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ delay: index * 0.05 }}
						className='text-text-secondary/60 hover:text-white transition-colors duration-200 text-xs md:text-sm cursor-pointer'
					>
						{platform.name}
					</motion.button>
				))}
			</div>
		</footer>
	)
}
