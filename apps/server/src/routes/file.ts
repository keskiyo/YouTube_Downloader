import { Elysia } from 'elysia'
import { downloadSessionService } from '../services/download-session.service'
import { contentDisposition } from '../utils/content-disposition'

export const fileRoutes = new Elysia({ prefix: '/api/video' })
  .get('/file/:id', async ({ params }) => {
    const { id } = params
    const filePath = downloadSessionService.getFinalPath(id)
    if (!filePath) {
      return Response.json({ error: 'File not ready or invalid ID', code: 'FILE_NOT_FOUND' }, { status: 404 })
    }
    // stream the file
    const file = Bun.file(filePath)
    const filename = filePath.split(/[\\/]/).pop() ?? 'video.mp4'
    const response = new Response(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(file.size),
        'Content-Disposition': contentDisposition(filename),
      },
    })
    // cleanup after response is consumed (fire-and-forget)
    response.clone().body?.cancel?.() // ensure stream is started
    // schedule cleanup a short time after response is sent
    setTimeout(() => downloadSessionService.cleanup(id), 5000)
    return response
  })
