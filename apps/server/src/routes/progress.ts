import { Elysia } from 'elysia'
import { downloadSessionService } from '../services/download-session.service'

export const progressRoutes = new Elysia({ prefix: '/api/video' })
	.get('/progress/:id', ({ params, set }) => {
		const { id } = params
		set.headers['Content-Type'] = 'text/event-stream'
		set.headers['Cache-Control'] = 'no-cache'
		set.headers['Connection'] = 'keep-alive'
		set.headers['X-Accel-Buffering'] = 'no'

		const encoder = new TextEncoder()
		let isActive = true
		let finalProgressSent = false

		const stream = new ReadableStream({
			start(controller) {
				const sendProgress = () => {
					if (!isActive || finalProgressSent) return
					const prog = downloadSessionService.getProgress(id)
					if (!prog) return

					if (prog.status === 'finished' || prog.status === 'error') {
						finalProgressSent = true
					}

					try {
						const payload = `data: ${JSON.stringify(prog)}\n\n`
						controller.enqueue(encoder.encode(payload))
					} catch {
						isActive = false
					}
				}

				const progressInterval = setInterval(() => {
					sendProgress()
				}, 250)

				const heartbeatInterval = setInterval(() => {
					if (!isActive) {
						clearInterval(progressInterval)
						clearInterval(heartbeatInterval)
						return
					}
					try {
						controller.enqueue(encoder.encode(': heartbeat\n\n'))
					} catch {
						isActive = false
						clearInterval(progressInterval)
						clearInterval(heartbeatInterval)
					}
				}, 15000)

				const checkFinish = setInterval(() => {
					const prog = downloadSessionService.getProgress(id)
					if (prog?.status === 'finished' || prog?.status === 'error') {
						clearInterval(progressInterval)
						clearInterval(heartbeatInterval)
						clearInterval(checkFinish)
						sendProgress()
						try {
							controller.close()
						} catch {}
						isActive = false
					}
				}, 200)

				const cleanup = () => {
					isActive = false
					clearInterval(progressInterval)
					clearInterval(heartbeatInterval)
					clearInterval(checkFinish)
					try {
						controller.close()
					} catch {}
				}

				setTimeout(() => {
					if (isActive) sendProgress()
				}, 50)
			},
			cancel() {
				isActive = false
			},
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			},
		})
	})
