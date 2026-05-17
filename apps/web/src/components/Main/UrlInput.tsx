import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useState } from 'react'
import type { VideoInfo } from '../../types'

interface UrlInputProps {
	onSubmit: (url: string) => void
	loading: boolean
	videoInfo: VideoInfo | null
}

export function UrlInput({ onSubmit, loading, videoInfo }: UrlInputProps) {
	const [url, setUrl] = useState('')

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault()
		if (url.trim()) {
			onSubmit(url.trim())
		}
	}

	return (
		<form onSubmit={handleSubmit} className='w-full max-w-2xl'>
			<div className='relative'>
				<input
					type='text'
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder='Вставьте ссылку на видео...'
					className='w-full px-6 py-4 bg-black border border-border-color rounded-full text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-blue transition-all'
					disabled={loading}
				/>
				<button
					type='submit'
					disabled={loading || !url.trim()}
					className='absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary-blue text-white rounded-full hover:bg-primary-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 z-50 cursor-pointer'
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
							<Search className='w-4 h-4' />
							<span>Найти</span>
						</>
					)}
				</button>
			</div>
			{videoInfo && !loading && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className='mt-4 text-center text-text-secondary text-sm'
				>
					Видео найдено! Прокрутите вниз для выбора качества и скачивания.
				</motion.div>
			)}
		</form>
	)
}