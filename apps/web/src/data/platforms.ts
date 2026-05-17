import type { Platform } from '../types'

export const platforms: Platform[] = [
	{ name: 'YouTube', url: '/site/YouTube' },
	{ name: 'VK', url: '/site/VK' },
	{ name: 'Yandex', url: '/site/Yandex' },
	{ name: 'Rutube', url: '/site/Rutube' },
	{ name: 'Telegram', url: '/site/Telegram' },
	{ name: 'Odnoklassniki', url: '/site/Odnoklassniki' },
	{ name: 'Video@Mail.Ru', url: '/site/Video@Mail.Ru' },
	{ name: 'Dzen', url: '/site/Dzen' },
	{ name: 'Smotrim', url: '/site/Smotrim' },
]

export const getPlatformByName = (name: string): Platform | undefined => {
	return platforms.find(platform => platform.name === name)
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
