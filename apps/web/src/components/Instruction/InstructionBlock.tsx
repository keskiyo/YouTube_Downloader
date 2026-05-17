import { motion } from 'framer-motion'
import { instructionSteps } from '../../data/platforms'
import { StepCard } from './StepCard'

export function InstructionBlock() {
	return (
		<section className='py-16 px-4'>
			<div className='max-w-2xl mx-auto'>
				<motion.h2
					initial={{ opacity: 0, y: -20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className='text-2xl md:text-3xl font-bold text-white text-center mb-4'
				>
					Как использовать наш сервис ?
				</motion.h2>
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className='text-text-secondary text-center mb-12'
				>
					Для того чтобы скачать видеофайл сделайте следующие шаги:
				</motion.p>
				<div>
					{instructionSteps.map(step => (
						<StepCard key={step.id} step={step} />
					))}
				</div>
			</div>
		</section>
	)
}
