import { spawn } from 'child_process'
import type { VideoInfo, VideoFormat } from '../../types'

export async function getRutubeInfo(url: string): Promise<VideoInfo> {
	console.log('[rutube] Getting info for:', url)

	const formats: VideoFormat[] = []
	const qualities = new Set<string>()
	let title = 'Unknown'
	let thumbnail = ''
	let duration = 0
	let author = 'Unknown'

	try {
		const proc = spawn('yt-dlp', ['--dump-json', '--no-download', url])
		let output = ''
		
		proc.stdout.on('data', (data) => { output += data.toString() })
		proc.stderr.on('data', (data) => { output += data.toString() })
		
		await new Promise<void>((resolve) => {
			proc.on('close', () => resolve())
		})

		const json = JSON.parse(output)
		title = json.title || title
		thumbnail = json.thumbnail || ''
		duration = json.duration || 0
		author = json.uploader || json.channel || author

		const heightSet = new Set<number>()
		for (const f of json.formats || []) {
			const height = f.height
			if (height && height >= 360 && !heightSet.has(height)) {
				heightSet.add(height)
				qualities.add(`${height}p`)
				formats.push({ quality: `${height}p`, format: 'mp4', size: 0, hasAudio: true })
			}
		}
		console.log('[rutube] yt-dlp formats found:', Array.from(qualities))
	} catch (e) {
		console.log('[rutube] yt-dlp error:', e)
	}

	if (formats.length === 0) {
		const videoIdMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/)
		if (videoIdMatch) {
			const videoId = videoIdMatch[1]
			const apiUrl = `https://rutube.ru/api/video/${videoId}/?format=json`
			const response = await fetch(apiUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					'Accept': 'application/json',
				},
			})

			if (response.ok) {
				const data = await response.json() as Record<string, unknown>
				title = (data.title as string) || title
				thumbnail = (data.thumbnail_url as string) || (data.poster_url as string) || thumbnail
				duration = parseInt(String(data.duration || '0'))
				author = (data.author as Record<string, unknown>)?.name as string || (data.author_name as string) || author

				const masterUrl = data.master_url as string | undefined
				if (masterUrl) {
					try {
						const m3u8Res = await fetch(masterUrl)
						const m3u8Text = await m3u8Res.text()
						const resMatches = m3u8Text.match(/RESOLUTION=\d+x(\d+)/g)
						if (resMatches) {
							const unique = [...new Set(resMatches.map(m => m.match(/\d+$/)?.[0]))]
							for (const q of unique) {
								if (q && !qualities.has(`${q}p`)) {
									qualities.add(`${q}p`)
									formats.push({ quality: `${q}p`, format: 'mp4', size: 0, hasAudio: true })
								}
							}
						}
					} catch (e) {}
				}
			}
		}
	}

	const uniqueFormats = formats.filter((f, i, arr) => arr.findIndex(x => x.quality === f.quality) === i)
	
	const sortedFormats = uniqueFormats.sort((a, b) => {
		const aRes = parseInt(a.quality.replace('p', ''))
		const bRes = parseInt(b.quality.replace('p', ''))
		return bRes - aRes
	})

	if (sortedFormats.length === 0) {
		sortedFormats.push({ quality: 'best', format: 'mp4', size: 0, hasAudio: true })
	}

	const videoIdMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/)
	const videoId = videoIdMatch?.[1] || ''

	console.log('[rutube] Final formats:', sortedFormats.map(f => f.quality))

	return {
		title,
		thumbnail,
		duration,
		platform: 'Rutube',
		videoId,
		author,
		formats: sortedFormats,
	}
}

export async function getRutubeStreamUrl(videoId: string, quality?: string): Promise<{ url: string; quality: string; contentType: string } | null> {
	try {
		const response = await fetch(`https://rutube.ru/api/video/${videoId}/?format=json`, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				'Accept': 'application/json',
			},
		})

		if (!response.ok) return null

		const data = await response.json() as Record<string, unknown>
		console.log('[rutube] getStreamUrl - has master_url:', !!data.master_url)

		const masterUrl = data.master_url as string | undefined
		if (masterUrl) {
			const m3u8Res = await fetch(masterUrl)
			const m3u8Text = await m3u8Res.text()
			
			console.log('[rutube] Master m3u8 first 500 chars:', m3u8Text.substring(0, 500))
			
			const lines = m3u8Text.split('\n')
			const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1)
			
			const streams: { url: string; res: number; bandwidth: number }[] = []
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]?.trim()
				if (line && !line.startsWith('#')) {
					const prevLine = lines[i - 1]?.trim()
					let res = 0
					let bandwidth = 0
					
					if (prevLine?.includes('RESOLUTION=')) {
						const resM = prevLine.match(/RESOLUTION=(\d+)x(\d+)/)
						if (resM?.[2]) {
							res = parseInt(resM[2])
						}
					}
					
					if (prevLine?.includes('BANDWIDTH=')) {
						const bwMatch = prevLine.match(/BANDWIDTH=(\d+)/)
						if (bwMatch?.[1]) {
							bandwidth = parseInt(bwMatch[1])
						}
					}
					
					const streamUrl = line.startsWith('http') ? line : baseUrl + line
					streams.push({ url: streamUrl, res, bandwidth })
				}
			}

			console.log('[rutube] Parsed streams:', streams.length, streams.map(s => ({ res: s.res, bw: s.bandwidth })))

			if (streams.length > 0) {
				streams.sort((a, b) => {
					if (a.res !== b.res) return b.res - a.res
					return b.bandwidth - a.bandwidth
				})
				
				const targetRes = quality ? parseInt(quality.replace('p', '')) : 0
				const videoStreams = streams.filter(s => s.res > 0 && s.bandwidth > 100000)
				
				if (videoStreams.length > 0) {
					const selected = targetRes > 0
						? videoStreams.find(s => s.res <= targetRes) || videoStreams[0]
						: videoStreams[0]

					if (selected) {
						console.log('[rutube] Selected video stream:', selected.res + 'p', 'bandwidth:', selected.bandwidth)
						return { url: selected.url, quality: `${selected.res}`, contentType: 'video/mp4' }
					}
				}
				
				const firstStream = streams[0]
				if (firstStream && firstStream.bandwidth > 100000) {
					console.log('[rutube] Using stream with bandwidth:', firstStream.bandwidth)
					return { url: firstStream.url, quality: `${firstStream.res || 720}`, contentType: 'video/mp4' }
				}
			}
		}
		
		console.log('[rutube] No suitable stream found, returning null')
	} catch (e) {
		console.error('[rutube] getStreamUrl error:', e)
	}
	return null
}