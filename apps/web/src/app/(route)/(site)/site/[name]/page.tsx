import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { getPlatformByName } from '../../../../../data/platforms'
import MainPage from '../../../page'

export function SitePage() {
	const { name } = useParams<{ name: string }>()
	const platform = getPlatformByName(name || '')

	if (!platform) {
		return (
			<div className='flex min-h-[70vh] items-center justify-center px-4'>
				<div className='glass-panel max-w-md rounded-2xl p-6 text-center'>
					<h1 className='text-xl font-semibold text-white'>Платформа не найдена</h1>
					<p className='mt-2 text-sm text-text-secondary'>
						Проверьте адрес страницы или выберите сайт из списка.
					</p>
				</div>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35 }}
		>
			<MainPage platform={platform.name} />
		</motion.div>
	)
}
