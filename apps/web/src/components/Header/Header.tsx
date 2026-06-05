import { Grid3X3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from './Logo'

export function Header() {
	const navigate = useNavigate()

	return (
		<header className='sticky top-0 z-50 border-b border-white/10 bg-bg-primary/78 backdrop-blur-xl'>
			<div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3'>
				<Logo />
				<nav>
					<button
						type='button'
						onClick={() => navigate('/sites')}
						className='focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-primary-blue/60 hover:bg-primary-blue/10'
					>
						<Grid3X3 className='h-4 w-4 text-primary-blue' />
						<span>Сайты</span>
					</button>
				</nav>
			</div>
		</header>
	)
}
