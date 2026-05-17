import { Elysia } from 'elysia'
import { getVideoInfo } from '../services/video.service'

export const videoRoutes = new Elysia({ prefix: '/api/video' })
	.get('/info', async ({ query }) => {
		const { url } = query as { url?: string }

		console.log('[video/info] Received URL:', url)

		if (!url) {
			return Response.json(
				{ error: 'URL parameter is required', code: 'MISSING_URL' },
				{ status: 400 }
			)
		}

		try {
			console.log('[video/info] Fetching video info for:', url)
			const videoInfo = await getVideoInfo(url)
			console.log('[video/info] Success! Title:', videoInfo.title)
			return Response.json(videoInfo)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			console.error('[video/info] Error:', message, error)
			return Response.json(
				{ error: message, code: 'FETCH_ERROR' },
				{ status: 500 }
			)
		}
	})