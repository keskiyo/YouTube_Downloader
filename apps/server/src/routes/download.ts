import { Elysia } from 'elysia'
import { join } from 'path'
import { parseUrl } from '../services/platform-parser'
import { downloadSessionService } from '../services/download-session.service'
import { downloadWithRetry } from '../services/yt-dlp.service'
import { runFfprobe, applyFaststart, normalizeToPlayableMp4 } from '../services/ffmpeg.service'

function logError(label: string, err: unknown) {
	console.error(`[ERROR] ${label}:`, err)
	if (err instanceof Error && err.stack) {
		console.error('[ERROR] Stack:', err.stack)
	}
}

async function processDownload(sessionId: string, url: string, tempDir: string, quality?: string) {
	console.log('========================================')
	console.log('[processDownload] STARTED')
	console.log('[processDownload] sessionId:', sessionId)
	console.log('[processDownload] url:', url)
	console.log('[processDownload] tempDir:', tempDir)
	console.log('[processDownload] quality:', quality)
	console.log('========================================')
	
	try {
		downloadSessionService.updateStatus(sessionId, 'downloading')
		console.log('[processDownload] Status set to: downloading')

		console.log('[processDownload] Calling downloadWithRetry...')
		const ytResult = await downloadWithRetry(
			url,
			tempDir,
			quality,
			progress => {
				console.log('[processDownload] Progress update:', progress.percent + '%')
				downloadSessionService.setProgress(sessionId, {
					percent: progress.percent,
					totalSize: progress.totalSize,
					speed: progress.speed,
					eta: progress.eta,
					status: 'downloading',
				})
			},
			3,
		)
		
		console.log('========================================')
		console.log('[processDownload] downloadWithRetry completed')
		console.log('[processDownload] ytResult:', JSON.stringify(ytResult, null, 2))
		console.log('========================================')

		if (!ytResult.success || !ytResult.filePath) {
			console.error('[processDownload] yt-dlp failed!')
			console.error('[processDownload] error:', ytResult.error)
			downloadSessionService.markError(sessionId, ytResult.error || 'yt-dlp download failed')
			return
		}

		console.log('[processDownload] File downloaded to:', ytResult.filePath)
		downloadSessionService.updateStatus(sessionId, 'merging')
		console.log('[processDownload] Status set to: merging')

		console.log('[processDownload] Calling runFfprobe...')
		let ffprobeResult = await runFfprobe(ytResult.filePath)
		console.log('[processDownload] runFfprobe completed, result:', ffprobeResult)

		if (!ffprobeResult) {
			console.error('[processDownload] ffprobe returned null!')
			console.error('[processDownload] File path:', ytResult.filePath)
			
			const fs = await import('fs')
			const files = fs.readdirSync(tempDir)
			console.log('[processDownload] Files in tempDir:', files)
			
			for (const file of files) {
				const filePath = join(tempDir, file)
				const stats = fs.statSync(filePath)
				console.log('[processDownload] File:', file, 'size:', stats.size)
			}
			
			downloadSessionService.markError(sessionId, 'Failed to validate video file')
			return
		}

		console.log('[processDownload] ffprobe result:', {
			hasVideo: ffprobeResult.hasVideo,
			hasAudio: ffprobeResult.hasAudio,
			hasVideoStream: !!ffprobeResult.videoStream,
			hasAudioStream: !!ffprobeResult.audioStream,
			duration: ffprobeResult.duration,
			fileSize: ffprobeResult.fileSize,
		})

		if (!ffprobeResult.hasVideo) {
			console.error('[processDownload] No video stream!')
			downloadSessionService.markError(sessionId, 'Video file has no video stream')
			return
		}

		if (!ffprobeResult.hasAudio) {
			console.warn('[processDownload] No audio stream detected - proceeding anyway')
		}

		if (ffprobeResult.formatName?.includes('mpegts')) {
			console.log('[processDownload] Normalizing MPEG-TS output to playable MP4...')
			await normalizeToPlayableMp4(ytResult.filePath, ffprobeResult)
			ffprobeResult = await runFfprobe(ytResult.filePath)
			if (!ffprobeResult?.hasVideo || !ffprobeResult.hasAudio) {
				downloadSessionService.markError(sessionId, 'Failed to normalize video file')
				return
			}
		}

		console.log('[processDownload] Applying faststart...')
		const faststartResult = await applyFaststart(ytResult.filePath)
		console.log('[processDownload] faststartResult:', faststartResult)

		if (ffprobeResult.fileSize === 0) {
			console.error('[processDownload] File is empty!')
			downloadSessionService.markError(sessionId, 'Downloaded file is empty')
			return
		}

		console.log('[processDownload] SUCCESS - final file:', ytResult.filePath)
		downloadSessionService.markFinished(sessionId, ytResult.filePath, ytResult.quality || 'best')
		console.log('[processDownload] Session marked as finished')
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : 'Download error'
		console.error('[processDownload] EXCEPTION!')
		console.error('[processDownload] error:', errorMsg)
		if (err instanceof Error && err.stack) {
			console.error('[processDownload] stack:', err.stack)
		}
		logError('download failed', err)
		downloadSessionService.markError(sessionId, errorMsg)
	}
}

export const downloadRoutes = new Elysia({ prefix: '/api/video' })
	.onError(({ error, path }) => {
		logError(`Route error ${path}`, 'message' in error ? error : String(error))
	})
	.get('/download', async ({ query }) => {
		const { url, quality } = query as { url?: string; quality?: string }

		console.log('[download] Received request')

		if (!url) {
			return Response.json(
				{ error: 'URL parameter is required', code: 'MISSING_URL' },
				{ status: 400 },
			)
		}

		console.log('[download] Request - URL:', url, 'quality:', quality)

		const parsed = parseUrl(url)
		if (!parsed) {
			console.log('[download] Unsupported URL:', url)
			return Response.json(
				{ error: 'Unsupported URL', code: 'UNSUPPORTED_URL' },
				{ status: 400 },
			)
		}

		console.log('[download] Platform:', parsed.platform, 'Video ID:', parsed.videoId)

		const sessionId = downloadSessionService.create()
		const tempDir = downloadSessionService.getTempDir(sessionId)

		if (!tempDir) {
			return Response.json(
				{ error: 'Failed to create session', code: 'SESSION_ERROR' },
				{ status: 500 },
			)
		}

		console.log('[download] Returning sessionId immediately')

		processDownload(sessionId, url, tempDir, quality)

		return Response.json({ downloadId: sessionId })
	})
