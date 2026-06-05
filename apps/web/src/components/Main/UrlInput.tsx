import { motion } from 'framer-motion'
import { Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import type { VideoInfo } from '../../types'

interface UrlInputProps {
	onSubmit: (url: string) => void
	loading: boolean
	videoInfo: VideoInfo | null
}

export function UrlInput({ onSubmit, loading, videoInfo }: UrlInputProps) {
	const [url, setUrl] = useState('')

	const handleSubmit = (event: React.SyntheticEvent) => {
		event.preventDefault()
		if (url.trim()) onSubmit(url.trim())
	}

	return (
		<form onSubmit={handleSubmit} className='w-full'>
			<label className='mb-2 block text-sm font-medium text-white'>
				Ссылка на видео
			</label>
			<div className='flex flex-col gap-3 sm:flex-row'>
				<input
					type='text'
					value={url}
					onChange={event => setUrl(event.target.value)}
					placeholder='https://www.youtube.com/watch?v=...'
					className='focus-ring h-[52px] min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-text-secondary/70 transition-colors hover:border-white/20'
					disabled={loading}
				/>
				<button
					type='submit'
					disabled={loading || !url.trim()}
					className='focus-ring inline-flex h-[52px] min-w-[7.5rem] items-center justify-center gap-2 rounded-xl bg-primary-blue px-5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(21,168,223,0.26)] transition-colors hover:bg-[#1297ca] disabled:cursor-not-allowed disabled:opacity-50'
				>
					{loading ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<Search className='h-4 w-4' />
					)}
					<span>{loading ? 'Поиск' : 'Найти'}</span>
				</button>
			</div>
			{videoInfo && !loading && (
				<motion.p
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className='mt-3 text-sm text-text-secondary'
				>
					Видео найдено. Проверьте качество и нажмите скачать.
				</motion.p>
			)}
		</form>
	)
}
