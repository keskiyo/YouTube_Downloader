import { motion } from 'framer-motion';
import { StepIllustration } from './StepIllustration';

interface StepCardProps {
  step: {
    id: number;
    title: string;
    description: string;
  };
}

export function StepCard({ step }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: step.id * 0.1 }}
      className='flex items-start gap-4 mb-8'
    >
      <div className='flex items-center gap-4 flex-1'>
        <div className='w-8 h-8 rounded-full bg-primary-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
          {step.id}
        </div>
        <div className='flex-1'>
          <h3 className='text-white font-medium mb-1'>{step.title}</h3>
          <p className='text-text-secondary text-sm'>{step.description}</p>
        </div>
      </div>
      <StepIllustration step={step.id} />
    </motion.div>
  );
}