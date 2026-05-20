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
		description: 'Найдите видео, которое хотите скачать',
	},
	{
		id: 2,
		title: 'Скопируйте ссылку',
		description: 'Скопируйте ссылку на видео',
	},
	{
		id: 3,
		title: 'Вставьте ссылку',
		description:
			'Вставьте скопированную ссылку в поле ввода и нажмите "Найти"',
	},
	{
		id: 4,
		title: 'Выберите качество',
		description: 'Выберите желаемое качество видео из доступных вариантов',
	},
	{
		id: 5,
		title: 'Нажмите скачать',
		description: 'Нажмите кнопку "Скачать" и дождитесь завершения загрузки',
	},
	{
		id: 6,
		title: 'Сохраните файл',
		description: 'Выберите место на устройстве для сохранения файла',
	},
]
