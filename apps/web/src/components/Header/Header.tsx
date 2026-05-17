import { useNavigate } from 'react-router-dom'
import { Logo } from './Logo'

export function Header() {
	const navigate = useNavigate()

	return (
		<header className='top-0 z-50 backdrop-blur-md bg-bg-primary/80 border-b border-border-color'>
			<div className='max-w-6xl mx-auto px-4 py-4 flex items-center justify-between'>
				<Logo />
				<nav>
					<button
						onClick={() => navigate('/sites')}
						className='px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-900 transition-colors cursor-pointer'
					>
						Другие сайты
					</button>
				</nav>
			</div>
		</header>
	)
}
