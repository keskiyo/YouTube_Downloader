import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Logo() {
	const navigate = useNavigate()
	return (
		<div className='flex items-center gap-2'>
			<div className='w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center'>
				<CheckCircle2 className='w-5 h-5 text-primary-blue' />
			</div>
			<button onClick={() => navigate('/')} className='cursor-pointer'>
				<span className='flex text-sm font-bold tracking-wider text-text-primary gap-x-2'>
					DOWNLOADER_VIDEO.COM
					<p className='flex text-[9px] '>RU</p>
				</span>
			</button>
		</div>
	)
}
