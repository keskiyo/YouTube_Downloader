import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { videoRoutes } from './routes/video'
import { downloadRoutes } from './routes/download'

const app = new Elysia()
	.use(cors({ origin: ['http://localhost:5173'] }))
	.onError(({ error, path }) => {
		console.error(`[FATAL] Route error ${path}:`, 'message' in error ? error.message : String(error))
		if ('stack' in error && error.stack) console.error(error.stack)
	})
	.use(videoRoutes)
	.use(downloadRoutes)
	.get('/api/health', () => ({ status: 'ok', runtime: 'bun', port: 3001 }))
	.listen(3001)

console.log(`🦊 Elysia запущена → http://localhost:${app.server?.port}`)