# Video Downloader — мультиплатформенный загрузчик видео

Веб-приложение для скачивания видео с YouTube, Rutube и других платформ. Работает как API-сервер на Bun + Elysia, фронтенд на Vite + React.

---

## Стек

| Уровень | Технологии |
|---------|-----------|
| **Runtime** | [Bun](https://bun.sh) (не Node.js) |
| **Monorepo** | Bun workspaces (`apps/*`) |
| **Frontend** | Vite + React 19 + TailwindCSS v4 + React Router v7 + Framer Motion |
| **Backend** | Elysia + ytdl-core |
| **Загрузка видео** | yt-dlp + ffmpeg |
| **Язык** | TypeScript (strict mode) |

---

## Быстрый старт

### 1. Установите зависимости

```bash
bun install
```

### 2. Установите yt-dlp и ffmpeg

**Windows (PowerShell):**
```powershell
# yt-dlp
irm https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -OutFile yt-dlp.exe

# ffmpeg
irm https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip -OutFile ffmpeg.zip
Expand-Archive ffmpeg.zip
# Добавьте путь к ffmpeg/bin в PATH
```

**Linux:**
```bash
sudo apt install yt-dlp ffmpeg
```

**macOS:**
```bash
brew install yt-dlp ffmpeg
```

Проверка:
```bash
yt-dlp --version
ffmpeg -version
```

### 3. Запуск

```bash
bun run dev
```

| Команда | Описание |
|---------|----------|
| `bun run dev` | Запуск web + server одновременно |
| `bun run dev:web` | Только фронтенд (port 5173) |
| `bun run dev:server` | Только сервер (port 3001) |
| `bun run build:web` | Сборка фронтенда |
| `bun run preview:web` | Превью собранного фронтенда |

### 4. Откройте в браузере

```
http://localhost:5173
```

---

## Поддерживаемые платформы

- [x] YouTube
- [x] Rutube
- [ ] VK Video (в разработке)

---

## Архитектура

```
youtube_downloader/
├── apps/
│   ├── server/              # API сервер (Elysia)
│   │   └── src/
│   │       ├── index.ts     # Точка входа
│   │       ├── routes/      # API endpoints
│   │       ├── services/    # Логика платформ
│   │       ├── utils/       # Утилиты
│   │       └── types/       # TypeScript типы
│   └── web/                 # Фронтенд (Vite + React)
│       └── src/
│           ├── components/ # UI компоненты
│           ├── hooks/       # React хуки
│           ├── app/         # Роуты React Router
│           └── data/        # Данные платформ
├── package.json             # Root workspace
└── tsconfig.json            # Общая TS конфигурация
```

### API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/video/info` | POST | Получить информацию о видео |
| `/api/video/download` | GET | Скачать видео |

### Проксирование

Vite проксирует `/api/*` → `http://localhost:3001` в режиме разработки.

---

## Требования

- **Bun** ≥ 1.x
- **yt-dlp** (актуальная версия)
- **ffmpeg** (актуальная версия)