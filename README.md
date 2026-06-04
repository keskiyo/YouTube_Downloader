# YouTube Downloader

Веб-приложение для скачивания видео с YouTube, Rutube и VK Video. Проект состоит из React-фронтенда и Elysia API-сервера на Bun. Загрузка выполняется через `yt-dlp`, а проверка и подготовка итогового файла — через `ffmpeg`/`ffprobe`.

## Возможности

- Скачивание видео с YouTube, Rutube и VK Video.
- Выбор качества: `144p`, `240p`, `360p`, `480p`, `720p`, `1080p`, `1440p`, `2160p` или лучшее доступное.
- Автоматическое объединение видео и аудио в корректный MP4.
- Проверка итогового файла на наличие видео- и аудиопотока.
- Прогресс скачивания через SSE.
- Отмена активной загрузки через API.
- Автоматическая очистка устаревших временных файлов.
- Поддержка ссылок YouTube с параметрами плейлиста, например `watch?v=...&list=...`.
- Поддержка ссылок VK Video вида `https://vkvideo.ru/video-228275494_456239115`.
- Специальная обработка Rutube HLS, чтобы итоговый файл открывался с картинкой и звуком.

## YouTube и Zapret

Для скачивания YouTube из сетей, где доступ к YouTube ограничен, приложение может работать через системный обход Zapret.

Zapret если он запущен как системный сервис `winws.exe`, оставьте `YTDLP_PROXY` пустым:

```env
YTDLP_PROXY=
YTDLP_FORCE_IPV4=true
```

Проверьте доступ к YouTube из PowerShell:

```powershell
curl.exe -4 -I --max-time 20 https://www.youtube.com
```

Если команда возвращает `HTTP/1.1 200 OK`, `yt-dlp` и приложение смогут использовать этот системный обход. Если у вас есть именно HTTP/SOCKS proxy, укажите его отдельно:

```env
YTDLP_PROXY=socks5://127.0.0.1:1080
```

## Стек

| Часть       | Технологии                   |
| ----------- | ---------------------------- |
| Runtime     | Bun                          |
| Frontend    | Vite, React 19, React Router |
| Backend     | Elysia                       |
| Video tools | yt-dlp, ffmpeg, ffprobe      |
| Язык        | TypeScript                   |

## Требования

- Bun 1.x+
- yt-dlp
- ffmpeg и ffprobe
- Для YouTube в ограниченных сетях: рабочий Zapret или HTTP/SOCKS proxy

Проверка внешних инструментов:

```bash
yt-dlp --version
ffmpeg -version
ffprobe -version
```

## Установка

```bash
bun install
```

Создайте или обновите `.env` в корне проекта:

```env
VITE_FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

YTDLP_PROXY=
YTDLP_FORCE_IPV4=true
```

## Запуск

```bash
bun run dev
```

После запуска откройте:

```text
http://localhost:5173
```

## Desktop-режим

Приложение можно запускать как desktop-окно через Electron. Desktop-режим не переписывает backend и frontend: Electron поднимает существующие Bun server + Vite web и открывает локальное окно приложения.

Запуск из терминала:

```bash
bun run desktop
```

Запуск двойным кликом на Windows:

```text
desktop/YouTube Downloader.cmd
```

Для удобства можно создать ярлык на этот `.cmd` файл и вынести его на рабочий стол.

В desktop-режиме сохраняются те же требования: `yt-dlp`, `ffmpeg` и `ffprobe` должны быть доступны в `PATH`. Для YouTube в ограниченных сетях должен работать Zapret или должен быть указан `YTDLP_PROXY`.

## Команды

| Команда                   | Описание                                   |
| ------------------------- | ------------------------------------------ |
| `bun run dev`             | Запустить frontend и backend одновременно  |
| `bun run desktop`         | Запустить desktop-приложение через Electron |
| `bun run dev:web`         | Запустить только frontend на порту `5173`  |
| `bun run dev:server`      | Запустить только backend на порту `3001`   |
| `bun run build:web`       | Собрать frontend                           |
| `bun run preview:web`     | Открыть preview production-сборки frontend |

## API

| Endpoint                                  | Метод | Описание                    |
| ----------------------------------------- | ----- | --------------------------- |
| `/api/video/info?url=...`                 | GET   | Получить информацию о видео |
| `/api/video/download?url=...&quality=720` | GET   | Начать скачивание           |
| `/api/video/cancel/:id`                   | POST  | Отменить активную загрузку  |
| `/api/video/progress/:id`                 | GET   | SSE-прогресс скачивания     |
| `/api/video/file/:id`                     | GET   | Скачать готовый файл        |
| `/api/health`                             | GET   | Проверка состояния backend  |

## Структура проекта

```text
youtube_downloader/
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── config/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── types/
│   │       └── utils/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       ├── data/
│   │       ├── hooks/
│   │       └── types/
│   └── downloads_files/
├── desktop/
│   ├── main.cjs
│   └── YouTube Downloader.cmd
├── package.json
├── tsconfig.json
└── README.md
```

## Загрузки

Временные файлы скачивания хранятся в:

```text
apps/downloads_files/
```

Сервер отдает файл пользователю только после завершения `yt-dlp`/`ffmpeg` и проверки, что файл не пустой и содержит корректные потоки. Старые временные папки удаляются при старте сервера, а зависшие активные сессии очищаются по TTL.

## Поддерживаемые платформы

| Платформа | Статус         |
| --------- | -------------- |
| YouTube   | Поддерживается |
| Rutube    | Поддерживается |
| VK Video  | Поддерживается |

## Примечания

- Проект использует Bun workspaces, команды запускаются из корня репозитория.
- Для YouTube ссылка с `list`, `index`, `start_radio` нормализуется до одного видео.
- Для VK Video ссылки `vkvideo.ru` нормализуются в формат `vk.com/video...`, который стабильно понимает `yt-dlp`.
- Для Rutube используется отдельная обработка HLS/MPEG-TS, чтобы избежать audio-only MP4.
- Для прогресса используется SSE, а не WebSocket: клиенту нужен односторонний поток статуса от сервера.
- SQLite не используется, потому что история загрузок и пользовательские данные не сохраняются.
