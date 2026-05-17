import { motion } from 'framer-motion'
import { Download, Hd, MonitorDown, Video } from 'lucide-react'

interface StepIllustrationProps {
	step: number
}

export function StepIllustration({ step }: StepIllustrationProps) {
	const illustrations = [
		<div
			key={1}
			className='w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center'
		>
			<div className='text-xs text-white/50'>
				{' '}
				<Video />
			</div>
		</div>,
		<div
			key={2}
			className='w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center'
		>
			<div className='text-xs text-white/50'>COPY</div>
		</div>,
		<div
			key={3}
			className='w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center'
		>
			<div className='w-8 h-2 bg-gray-600 rounded-full' />
		</div>,
		<div
			key={4}
			className='w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center gap-1'
		>
			<div className='text-xs text-white/50'>
				<Hd />
			</div>
		</div>,
		<div
			key={5}
			className='w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center'
		>
			<div className='text-xs text-white/50'>
				<Download />
			</div>
		</div>,
		<div
			key={6}
			className='w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center'
		>
			<div className='text-xs text-white/50'>
				{' '}
				<MonitorDown />{' '}
			</div>
		</div>,
	]

	return (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			whileInView={{ scale: 1, opacity: 1 }}
			viewport={{ once: true }}
			className='shrink-0'
		>
			{illustrations[step - 1]}
		</motion.div>
	)
}
