import { ChevronDown } from 'lucide-react'
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

export function QualitySelector({
	value,
	onChange,
	availableQualities = [],
}: QualitySelectorProps) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const filteredQualities = availableQualities.length > 0
		? allQualities.filter(quality => {
				if (quality.value === 'best') return true
				const target = parseInt(quality.value)
				const available = availableQualities.map(item => parseInt(item))
				return available.some(item => item >= target)
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
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const selected = filteredQualities.find(quality => quality.value === value) || filteredQualities[0]

	return (
		<div className='relative' ref={containerRef}>
			<button
				type='button'
				onClick={() => setOpen(!open)}
				className='focus-ring inline-flex h-11 min-w-32 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white transition-colors hover:border-primary-blue/60'
			>
				<span>{selected.label}</span>
				<ChevronDown className={`h-4 w-4 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
			</button>
			{open && (
				<div className='absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#0d1520] p-1 shadow-2xl'>
					{filteredQualities.map(quality => (
						<button
							key={quality.value}
							type='button'
							onClick={() => {
								onChange(quality.value)
								setOpen(false)
							}}
							className={`focus-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
								quality.value === value
									? 'bg-primary-blue/[0.16] text-primary-blue'
									: 'text-white hover:bg-white/[0.06]'
							}`}
						>
							<span>{quality.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
