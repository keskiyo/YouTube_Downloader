import { Clipboard, Download, FileCheck, Hd, Link, Video } from 'lucide-react'

interface StepIllustrationProps {
	step: number
}

const icons = [Video, Clipboard, Link, Hd, Download, FileCheck]

export function StepIllustration({ step }: StepIllustrationProps) {
	const Icon = icons[step - 1] ?? Video

	return (
		<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-blue/25 bg-primary-blue/10'>
			<Icon className='h-5 w-5 text-primary-blue' />
		</div>
	)
}
