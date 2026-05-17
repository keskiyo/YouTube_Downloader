const CYRILLIC_MAP: Record<string, string> = {
	'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
	'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
	'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
	'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
	'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
	'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
	'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
	'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
	'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
	'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
}

export function transliterate(text: string): string {
	return text
		.split('')
		.map((char) => CYRILLIC_MAP[char] || char)
		.join('')
}

export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[<>:"/\\|?*]/g, '')
		.replace(/\s+/g, '_')
		.replace(/_+/g, '_')
		.substring(0, 100)
}

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B'
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateFilename(title: string, quality: string, format: string): string {
	const transliterated = transliterate(title)
	const sanitized = sanitizeFilename(transliterated)
	return `${sanitized}_${quality}.${format}`
}

export function getFormatFromContentType(contentType: string): string {
	if (contentType.includes('mp4') || contentType.includes('quicktime')) {
		return 'mp4'
	}
	if (contentType.includes('mpeg') || contentType.includes('ts')) {
		return 'ts'
	}
	if (contentType.includes('webm')) {
		return 'webm'
	}
	return 'mp4'
}

export function contentDisposition(filename: string): string {
	const encoded = encodeURIComponent(filename)
	return `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`
}