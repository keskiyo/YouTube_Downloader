import { randomUUID } from 'crypto'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import type { DownloadProgress, DownloadStatus } from '../types/progress'

const currentDir = dirname(fileURLToPath(import.meta.url))
const downloadsDir = join(currentDir, '..', '..', '..', 'downloads_files')

export interface Session {
	tempDir: string
	progress: DownloadProgress
	abortController: AbortController
	createdAt: number
	updatedAt: number
	finalPath?: string
	errorMessage?: string
}

class DownloadSessionService {
	private sessions = new Map<string, Session>()

	private readonly baseTemp = downloadsDir
	private readonly sessionTtlMs = 60 * 60 * 1000
	private readonly startupTempMaxAgeMs = 24 * 60 * 60 * 1000

	constructor() {
		if (!existsSync(this.baseTemp)) {
			mkdirSync(this.baseTemp, { recursive: true })
		}
		this.cleanupOldTempDirs()
		setInterval(() => this.cleanupExpiredSessions(), 10 * 60 * 1000).unref()
	}

	create(): string {
		const id = randomUUID()
		const dir = join(this.baseTemp, id)
		const now = Date.now()
		mkdirSync(dir, { recursive: true })
		this.sessions.set(id, {
			tempDir: dir,
			progress: { percent: 0, status: 'preparing' },
			abortController: new AbortController(),
			createdAt: now,
			updatedAt: now,
		})
		console.log('[session] Created:', id, 'dir:', dir)
		return id
	}

	getTempDir(id: string): string | undefined {
		return this.sessions.get(id)?.tempDir
	}

	setProgress(id: string, progress: Partial<DownloadProgress>) {
		const session = this.sessions.get(id)
		if (!session) {
			console.warn('[session] Session not found:', id)
			return
		}
		if (session.abortController.signal.aborted) return
		session.progress = { ...session.progress, ...progress }
		session.updatedAt = Date.now()
	}

	updateStatus(id: string, status: DownloadStatus, extra?: Partial<DownloadProgress>) {
		const session = this.sessions.get(id)
		if (!session) return
		if (session.abortController.signal.aborted && status !== 'error') return
		session.progress = { ...session.progress, status, ...extra }
		session.updatedAt = Date.now()
	}

	getProgress(id: string): DownloadProgress | null {
		return this.sessions.get(id)?.progress ?? null
	}

	markFinished(id: string, finalPath: string, quality: string) {
		const session = this.sessions.get(id)
		if (!session) return
		if (session.abortController.signal.aborted) return
		session.finalPath = finalPath
		session.progress = {
			percent: 100,
			status: 'finished',
			totalSize: quality,
		}
		session.updatedAt = Date.now()
		console.log('[session] Finished:', id, 'path:', finalPath)
	}

	markError(id: string, error: string) {
		const session = this.sessions.get(id)
		if (!session) return
		session.errorMessage = error
		session.progress = {
			percent: 0,
			status: 'error',
			error,
		}
		session.updatedAt = Date.now()
		console.error('[session] Error:', id, error)
	}

	getAbortSignal(id: string): AbortSignal | undefined {
		return this.sessions.get(id)?.abortController.signal
	}

	cancel(id: string): boolean {
		const session = this.sessions.get(id)
		if (!session) return false
		if (session.progress.status === 'finished') return false

		session.abortController.abort()
		this.markError(id, 'Download canceled')
		setTimeout(() => void this.cleanup(id), 2000)
		return true
	}

	getFinalPath(id: string): string | undefined {
		return this.sessions.get(id)?.finalPath
	}

	getSession(id: string): Session | undefined {
		return this.sessions.get(id)
	}

	isFinished(id: string): boolean {
		return this.sessions.get(id)?.progress.status === 'finished'
	}

	async cleanup(id: string) {
		const session = this.sessions.get(id)
		if (!session) return
		console.log('[session] Cleaning up:', id)

		try {
			const { rmSync } = await import('fs')
			rmSync(session.tempDir, { recursive: true, force: true })
			console.log('[session] Cleanup complete:', id)
		} catch (err) {
			console.error('[session] Cleanup error:', err)
		}

		this.sessions.delete(id)
	}

	private cleanupExpiredSessions() {
		const now = Date.now()
		for (const [id, session] of this.sessions) {
			if (now - session.updatedAt > this.sessionTtlMs) {
				console.log('[session] TTL expired:', id)
				session.abortController.abort()
				void this.cleanup(id)
			}
		}
	}

	private cleanupOldTempDirs() {
		const now = Date.now()

		try {
			for (const entry of readdirSync(this.baseTemp)) {
				const path = join(this.baseTemp, entry)
				const stats = statSync(path)
				if (stats.isDirectory() && now - stats.mtimeMs > this.startupTempMaxAgeMs) {
					rmSync(path, { recursive: true, force: true })
					console.log('[session] Removed stale temp dir:', path)
				}
			}
		} catch (err) {
			console.error('[session] Startup temp cleanup failed:', err)
		}
	}
}

export const downloadSessionService = new DownloadSessionService()
