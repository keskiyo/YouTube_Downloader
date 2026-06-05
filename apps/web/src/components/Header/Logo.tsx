import { useNavigate } from 'react-router-dom'

export function Logo() {
	const navigate = useNavigate()

	return (
		<button
			type='button'
			onClick={() => navigate('/')}
			className='focus-ring flex items-center gap-3 rounded-xl'
			aria-label='На главную'
		>
			<img
				src='/app-icon.png'
				alt=''
				className='h-10 w-10 rounded-xl shadow-[0_10px_30px_rgba(21,168,223,0.28)]'
			/>
			<span className='flex flex-col items-start leading-none'>
				<span className='text-sm font-semibold tracking-[0.18em] text-white'>
					DOWNLOADER
				</span>
				<span className='mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-text-secondary'>
					Video tools
				</span>
			</span>
		</button>
	)
}
