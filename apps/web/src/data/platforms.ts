import type { Platform } from '../types'

export const platforms: Platform[] = [
	{ name: 'YouTube', url: '/site/YouTube' },
	{ name: 'VkVideo', url: '/site/VkVideo' },
	{ name: 'Rutube', url: '/site/Rutube' },
]

export const getPlatformByName = (name: string): Platform | undefined => {
	return platforms.find(platform => platform.name === name)
}

export const getPlatformByVideoUrl = (
	videoUrl: string,
): Platform | undefined => {
	let hostname = ''

	try {
		const parsedUrl = new URL(videoUrl)
		hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
	} catch {
		return undefined
	}

	const domainMatchers: Record<string, (hostname: string) => boolean> = {
		YouTube: hostname =>
			hostname === 'youtube.com' ||
			hostname === 'youtu.be' ||
			hostname.endsWith('.youtube.com'),
		VkVideo: hostname =>
			hostname === 'vkvideo.ru' ||
			hostname.endsWith('.vkvideo.ru') ||
			hostname === 'vk.com' ||
			hostname.endsWith('.vk.com'),
		Rutube: hostname =>
			hostname === 'rutube.ru' || hostname.endsWith('.rutube.ru'),
	}

	return platforms.find(platform => domainMatchers[platform.name]?.(hostname))
}

export const instructionSteps = [
	{
		id: 1,
		title: 'Найдите видео',
		description: 'Откройте ролик на YouTube, Rutube или VK Video.',
	},
	{
		id: 2,
		title: 'Скопируйте ссылку',
		description: 'Поддерживаются обычные ссылки, shorts, плейлисты и vkvideo.ru.',
	},
	{
		id: 3,
		title: 'Вставьте ссылку',
		description: 'Приложение определит платформу и получит доступные качества.',
	},
	{
		id: 4,
		title: 'Выберите качество',
		description: 'Можно выбрать конкретное разрешение или лучшее доступное.',
	},
	{
		id: 5,
		title: 'Скачайте файл',
		description: 'Сервер соберет видео и аудио в корректный MP4.',
	},
	{
		id: 6,
		title: 'Сохраните видео',
		description: 'Готовый файл будет передан браузеру для сохранения.',
	},
]
