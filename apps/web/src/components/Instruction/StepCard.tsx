import { motion } from 'framer-motion'
import { StepIllustration } from './StepIllustration'

interface StepCardProps {
	step: {
		id: number
		title: string
		description: string
	}
}

export function StepCard({ step }: StepCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ delay: step.id * 0.04 }}
			className='glass-panel rounded-2xl p-4'
		>
			<div className='flex items-start gap-4'>
				<StepIllustration step={step.id} />
				<div>
					<div className='mb-2 inline-flex rounded-md bg-white/[0.05] px-2 py-1 text-xs font-semibold text-text-secondary'>
						Шаг {step.id}
					</div>
					<h3 className='text-base font-semibold text-white'>{step.title}</h3>
					<p className='mt-2 text-sm leading-6 text-text-secondary'>
						{step.description}
					</p>
				</div>
			</div>
		</motion.div>
	)
}
