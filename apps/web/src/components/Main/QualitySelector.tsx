import { useEffect, useRef, useState } from 'react'
import type { VideoQuality } from '../../types'

interface QualitySelectorProps {
	value: VideoQuality
	onChange: (quality: VideoQuality) => void
	availableQualities?: string[]
}

const allQualities: { value: VideoQuality; label: string }[] = [
	{ value: 'best', label: 'Лучшее' },
	{ value: '2160', label: '4K' },
	{ value: '1440', label: '1440p' },
	{ value: '1080', label: '1080p' },
	{ value: '720', label: '720p' },
	{ value: '480', label: '480p' },
	{ value: '360', label: '360p' },
]

export function QualitySelector({ value, onChange, availableQualities = [] }: QualitySelectorProps) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const filteredQualities = availableQualities.length > 0
		? allQualities.filter(q => {
				if (q.value === 'best') return true
				const qNum = parseInt(q.value)
				const availNums = availableQualities.map(a => parseInt(a))
				return availNums.some(av => av >= qNum)
			})
		: allQualities

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const selected = filteredQualities.find(q => q.value === value) || filteredQualities[0]

	return (
		<div className='relative' ref={containerRef}>
			<button
				onClick={() => setOpen(!open)}
				className='px-4 py-2 bg-bg-secondary border border-border-color text-white rounded-lg hover:border-primary-blue transition-colors min-w-[120px]'
			>
				{selected.label}
			</button>
			{open && (
				<div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-bg-secondary border border-border-color rounded-lg shadow-lg overflow-hidden z-10'>
					{filteredQualities.map(q => (
						<button
							key={q.value}
							onClick={() => {
								onChange(q.value)
								setOpen(false)
							}}
							className={`w-full px-4 py-2 text-left hover:bg-primary-blue transition-colors flex justify-center items-center ${
								q.value === value
									? 'text-primary-blue'
									: 'text-white'
							}`}
						>
							{q.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}