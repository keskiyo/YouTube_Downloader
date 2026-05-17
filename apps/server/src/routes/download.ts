import { spawn } from 'child_process'
import { Elysia } from 'elysia'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { getPlatformFromUrl, parseUrl } from '../services/platform-parser'
import { getVideoInfo } from '../services/video.service'
import { contentDisposition } from '../utils/content-disposition'

const TEMP_DIR = 'D:\\1NeiroSlop\\YouTube_Downloader\\apps\\downloads_files'

function logError(label: string, err: unknown) {
	console.error(`[ERROR] ${label}:`, err)
	if (err instanceof Error && err.stack) {
		console.error('[ERROR] Stack:', err.stack)
	}
}

async function downloadWithYtDlp(
	url: string,
	quality?: string,
): Promise<{ path: string; quality: string } | null> {
	return new Promise((resolve, reject) => {
		if (!existsSync(TEMP_DIR)) {
			mkdirSync(TEMP_DIR, { recursive: true })
		}

		const timestamp = Date.now()
		const outputTemplate = join(
			TEMP_DIR,
			`video_${timestamp}_%(height)sp.%(ext)s`,
		)

		const args: string[] = []

		if (quality && quality !== 'best') {
			const qNum = parseInt(quality.replace('p', ''))
			args.push(
				'-f',
				`bestvideo[height<=${qNum}]+bestaudio/best[height<=${qNum}]`,
			)
		} else {
			args.push('-f', 'bestvideo+bestaudio/best')
		}

		args.push(
			'--merge-output-format', 'mp4',
			'--force-overwrites',
			'--no-part',
			'--newline',
			'-o',
			outputTemplate,
			url,
		)

		console.log(
			'[yt-dlp] Running with args:',
			args.join(' '),
		)

		const process = spawn('yt-dlp', args)

		let stdout = ''
		let stderr = ''

		process.stdout.on('data', data => {
			stdout += data.toString()
			console.log('[yt-dlp stdout]:', data.toString().trim())
		})

		process.stderr.on('data', data => {
			stderr += data.toString()
			console.log('[yt-dlp stderr]:', data.toString().trim())
		})

		process.on('close', code => {
			console.log('[yt-dlp] Exit code:', code)
			console.log('[yt-dlp] stdout length:', stdout.length)
			console.log('[yt-dlp] stderr length:', stderr.length)

			if (code === 0) {
				let filePath = ''
				let detectedQuality = 'best'

				const allOutput = stdout + '\n' + stderr

				const destinationMatch = allOutput.match(
					/\[download\] Destination: (.+\.mp4)/,
				)
				if (destinationMatch?.[1]) {
					filePath = destinationMatch[1].trim()
				}

				if (!filePath) {
					const mergeMatch = allOutput.match(
						/\[download\] Merging formats into "(.+\.mp4)"/,
					)
					if (mergeMatch?.[1]) {
						filePath = mergeMatch[1].trim()
					}
				}

				if (!filePath) {
					const ffmpegMatch = allOutput.match(
						/\[Merger\] Merging formats into "(.+\.mp4)"/,
					)
					if (ffmpegMatch?.[1]) {
						filePath = ffmpegMatch[1].trim()
					}
				}

				if (!filePath) {
					const files = readdirSync(TEMP_DIR)
						.filter(
							f =>
								f.startsWith(`video_${timestamp}`) &&
								f.endsWith('.mp4'),
						)
						.sort()
					const lastFile = files[files.length - 1]
					if (lastFile) {
						filePath = join(TEMP_DIR, lastFile)
						console.log('[yt-dlp] Found file by listing:', filePath)
					}
				}

				console.log('[yt-dlp] Parsed file path:', filePath)

				if (filePath) {
					const qualityMatch = filePath.match(/_(\d+)p\./)
					detectedQuality = qualityMatch?.[1] ?? 'best'
					console.log(
						'[yt-dlp] Downloaded to:',
						filePath,
						'quality:',
						detectedQuality,
					)
					resolve({ path: filePath, quality: detectedQuality })
				} else {
					console.log(
						'[yt-dlp] Full stdout:',
						stdout.substring(0, 500),
					)
					console.log(
						'[yt-dlp] Full stderr:',
						stderr.substring(0, 500),
					)
					reject(
						new Error(
							'Could not find output file in stdout/stderr',
						),
					)
				}
			} else {
				console.log('[yt-dlp] stderr:', stderr.substring(0, 500))
				reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`))
			}
		})

		process.on('error', err => {
			console.error('[yt-dlp] Error:', err)
			reject(err)
		})
	})
}

export const downloadRoutes = new Elysia({ prefix: '/api/video' })
	.onError(({ error, path }) => {
		logError(
			`Route error ${path}`,
			'message' in error ? error : String(error),
		)
	})
	.get('/download', async ({ query }) => {
		const { url, quality } = query as { url?: string; quality?: string }

		if (!url) {
			return Response.json(
				{ error: 'URL parameter is required', code: 'MISSING_URL' },
				{ status: 400 },
			)
		}

		try {
			const parsed = parseUrl(url)
			if (!parsed) {
				return Response.json(
					{ error: 'Unsupported URL', code: 'UNSUPPORTED_URL' },
					{ status: 400 },
				)
			}

			const platform = getPlatformFromUrl(url)
			const platformStr = platform ?? undefined
			console.log('[download] Platform from URL:', platform)

			let info
			try {
				info = await getVideoInfo(url)
				console.log('[download] Got video info:', info.title)
			} catch (infoErr) {
				logError('getVideoInfo failed', infoErr)
				info = { title: 'video' }
			}

			console.log(
				'[download] Platform:',
				platform,
				'Starting yt-dlp download for:',
				info.title,
			)

			const ytDlpUrl = url

			console.log(
				'[download] Before yt-dlp download, quality:',
				quality,
				'platform:',
				platform,
			)

			let result
			try {
				result = await downloadWithYtDlp(ytDlpUrl, quality)
			} catch (dlErr) {
				logError('downloadWithYtDlp failed', dlErr)
				return Response.json(
					{
						error:
							dlErr instanceof Error
								? dlErr.message
								: 'Download failed',
						code: 'DOWNLOAD_ERROR',
					},
					{ status: 500 },
				)
			}
			console.log('[download] Result:', result)

			if (!result) {
				return Response.json(
					{
						error: 'Download failed - no result returned',
						code: 'DOWNLOAD_FAILED',
					},
					{ status: 500 },
				)
			}

			if (!existsSync(result.path)) {
				return Response.json(
					{
						error: 'Download failed - file not found',
						code: 'DOWNLOAD_FAILED',
						path: result.path,
					},
					{ status: 500 },
				)
			}

			const { statSync, unlinkSync } = await import('node:fs')

			const filePath = result.path
			const fileStats = statSync(filePath)

			if (fileStats.size === 0) {
				try {
					unlinkSync(filePath)
				} catch (e) {
					console.log('[download] Could not delete temp file:', e)
				}
				return Response.json(
					{
						error: 'Download failed - file is empty',
						code: 'DOWNLOAD_FAILED',
						size: 0,
					},
					{ status: 500 },
				)
			}

			const safeName = (info.title || 'video')
				.replace(/[<>:"/\\|?*]/g, '')
				.replace(/\s+/g, '_')
				.substring(0, 100)
			const outputFilename = `${safeName}_${result.quality}p.mp4`

			const fileData = Bun.file(filePath)
			const fileSize = fileData.size

			console.log(
				'[download] Sending file:',
				filePath,
				'size:',
				fileSize,
			)

			return new Response(fileData, {
				headers: {
					'Content-Type': 'video/mp4',
					'Content-Length': String(fileSize),
					'Content-Disposition': contentDisposition(outputFilename),
				},
			})
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown error'
			console.error('[download] Error:', message)
			return Response.json(
				{ error: message, code: 'DOWNLOAD_ERROR' },
				{ status: 500 },
			)
		}
	})
