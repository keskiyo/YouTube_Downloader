const { app, BrowserWindow, dialog, shell } = require('electron')
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')

const ROOT_DIR = path.resolve(__dirname, '..')
const APP_ICON = path.join(__dirname, 'app-icon.png')
const WEB_URL = 'http://localhost:5173'
const API_HEALTH_URL = 'http://localhost:3001/api/health'
const childProcesses = new Set()

function getBunCommand() {
	return 'bun'
}

function requestOk(url) {
	return new Promise(resolve => {
		const request = http.get(url, response => {
			response.resume()
			resolve(response.statusCode >= 200 && response.statusCode < 500)
		})

		request.on('error', () => resolve(false))
		request.setTimeout(1500, () => {
			request.destroy()
			resolve(false)
		})
	})
}

async function waitFor(url, timeoutMs = 45000) {
	const startedAt = Date.now()

	while (Date.now() - startedAt < timeoutMs) {
		if (await requestOk(url)) {
			return true
		}
		await new Promise(resolve => setTimeout(resolve, 500))
	}

	return false
}

function startProcess(name, args) {
	const child = spawn(getBunCommand(), args, {
		cwd: ROOT_DIR,
		env: {
			...process.env,
			ELECTRON_DESKTOP: 'true',
		},
		shell: process.platform === 'win32',
		stdio: 'pipe',
		windowsHide: true,
	})

	childProcesses.add(child)
	child.stdout.on('data', data => console.log(`[${name}] ${data.toString().trim()}`))
	child.stderr.on('data', data => console.error(`[${name}] ${data.toString().trim()}`))
	child.on('exit', () => childProcesses.delete(child))

	return child
}

async function ensureServices() {
	const apiReady = await requestOk(API_HEALTH_URL)
	if (!apiReady) {
		startProcess('server', ['--filter', 'server', 'dev'])
	}

	const webReady = await requestOk(WEB_URL)
	if (!webReady) {
		startProcess('web', ['--filter', 'web', 'dev', '--host', '127.0.0.1'])
	}

	const [apiStarted, webStarted] = await Promise.all([
		waitFor(API_HEALTH_URL),
		waitFor(WEB_URL),
	])

	if (!apiStarted || !webStarted) {
		throw new Error('Failed to start local web/server services')
	}
}

function createWindow() {
	const window = new BrowserWindow({
		width: 1280,
		height: 820,
		minWidth: 960,
		minHeight: 640,
		backgroundColor: '#050505',
		autoHideMenuBar: true,
		icon: APP_ICON,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	})

	window.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url)
		return { action: 'deny' }
	})

	window.loadURL(WEB_URL)
	return window
}

function stopChildren() {
	for (const child of childProcesses) {
		if (!child.killed) {
			if (process.platform === 'win32') {
				spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
					windowsHide: true,
					stdio: 'ignore',
				})
			} else {
				child.kill()
			}
		}
	}
	childProcesses.clear()
}

app.whenReady().then(async () => {
	try {
		await ensureServices()
		createWindow()
	} catch (err) {
		console.error(err)
		dialog.showErrorBox(
			'YouTube Downloader',
			`Could not start the desktop app.\n\n${err instanceof Error ? err.message : String(err)}`,
		)
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})

app.on('before-quit', stopChildren)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
