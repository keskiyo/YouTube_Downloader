import { randomUUID } from 'crypto'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import type { DownloadProgress, DownloadStatus } from '../types/progress'

export interface Session {
	tempDir: string
	progress: DownloadProgress
	finalPath?: string
	errorMessage?: string
}

class DownloadSessionService {
	private sessions = new Map<string, Session>()

	private readonly baseTemp = 'D:\\1NeiroSlop\\YouTube_Downloader\\apps\\downloads_files'

	constructor() {
		if (!existsSync(this.baseTemp)) {
			mkdirSync(this.baseTemp, { recursive: true })
		}
	}

	create(): string {
		const id = randomUUID()
		const dir = join(this.baseTemp, id)
		mkdirSync(dir, { recursive: true })
		this.sessions.set(id, {
			tempDir: dir,
			progress: { percent: 0, status: 'preparing' },
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
		session.progress = { ...session.progress, ...progress }
	}

	updateStatus(id: string, status: DownloadStatus, extra?: Partial<DownloadProgress>) {
		const session = this.sessions.get(id)
		if (!session) return
		session.progress = { ...session.progress, status, ...extra }
	}

	getProgress(id: string): DownloadProgress | null {
		return this.sessions.get(id)?.progress ?? null
	}

	markFinished(id: string, finalPath: string, quality: string) {
		const session = this.sessions.get(id)
		if (!session) return
		session.finalPath = finalPath
		session.progress = {
			percent: 100,
			status: 'finished',
			totalSize: quality,
		}
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
		console.error('[session] Error:', id, error)
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
}

export const downloadSessionService = new DownloadSessionService()