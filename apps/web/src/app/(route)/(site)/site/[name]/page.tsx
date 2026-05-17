import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { getPlatformByName } from '../../../../../data/platforms'
import MainPage from '../../../page'

export function SitePage() {
	const { name } = useParams<{ name: string }>()
	const platform = getPlatformByName(name || '')

	if (!platform) {
		return (
			<div className='min-h-screen bg-bg-primary flex items-center justify-center'>
				<h1 className='text-text-primary text-2xl font-bold'>
					Платформа не найдена
				</h1>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-bg-primary py-12 px-4'
		>
			<MainPage platform={platform.name} />
		</motion.div>
	)
}
