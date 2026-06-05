import { motion } from 'framer-motion'
import { instructionSteps } from '../../data/platforms'
import { StepCard } from './StepCard'

export function InstructionBlock() {
	return (
		<section className='px-4 py-12'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-8 max-w-2xl'>
					<motion.h2
						initial={{ opacity: 0, y: 12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className='text-2xl font-semibold text-white md:text-3xl'
					>
						Как работает загрузка
					</motion.h2>
					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						className='mt-3 text-base leading-7 text-text-secondary'
					>
						Процесс рассчитан на один понятный сценарий: ссылка, качество, готовый файл.
					</motion.p>
				</div>
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{instructionSteps.map(step => (
						<StepCard key={step.id} step={step} />
					))}
				</div>
			</div>
		</section>
	)
}
