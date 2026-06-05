export function SeoText() {
	return (
		<section className='px-4 py-12'>
			<div className='glass-panel mx-auto max-w-6xl rounded-2xl p-5 md:p-6'>
				<div className='grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start'>
					<div>
						<p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary-blue'>
							Локальный сервис
						</p>
						<h2 className='mt-3 text-2xl font-semibold text-white'>
							Скачивание без лишних шагов
						</h2>
					</div>
					<p className='text-sm leading-7 text-text-secondary md:text-base'>
						Downloader Video помогает сохранить ролики с YouTube, Rutube и VK Video в MP4.
						Сервер получает доступные форматы через yt-dlp, собирает видео и аудио через ffmpeg
						и проверяет итоговый файл перед передачей пользователю.
					</p>
				</div>
			</div>
		</section>
	)
}
