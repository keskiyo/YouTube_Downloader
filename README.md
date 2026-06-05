# YouTube Downloader

Desktop and web video downloader for YouTube, Rutube, and VK Video.

The project uses a React/Vite frontend, an Elysia API server on Bun, and an Electron desktop wrapper. Downloads are handled by `yt-dlp`; final MP4 validation and compatibility processing are handled by `ffmpeg` and `ffprobe`.

## Features

- Download videos from YouTube, Rutube, and VK Video.
- Choose quality: `144p`, `240p`, `360p`, `480p`, `720p`, `1080p`, `1440p`, `2160p`, or best available.
- Correct video+audio MP4 output.
- Rutube HLS handling through `ffmpeg`.
- YouTube playlist/watch URLs are normalized to a single video.
- VK Video links such as `https://vkvideo.ru/video-228275494_456239115` are supported.
- Real-time download progress through SSE.
- Active download cancellation.
- Finished-file validation with `ffprobe`.
- Automatic cleanup of stale temporary files.
- Desktop launch through Electron and a Windows shortcut.
- Toast notifications for errors and download states.
- Responsive dark UI with a custom desktop scrollbar.

## Supported Platforms

| Platform | Status |
| --- | --- |
| YouTube | Supported |
| Rutube | Supported |
| VK Video / vkvideo.ru | Supported |

## YouTube And Zapret

For networks where YouTube is restricted, the app can work through a system-wide Zapret setup.

If Zapret is running as a system service, leave `YTDLP_PROXY` empty and force IPv4:

```env
YTDLP_PROXY=
YTDLP_FORCE_IPV4=true
```

Check YouTube access from PowerShell:

```powershell
curl.exe -4 -I --max-time 20 https://www.youtube.com
```

If the response contains `HTTP/1.1 200 OK`, `yt-dlp` and the app should be able to use the same system route.

If you use a dedicated HTTP/SOCKS proxy instead of system-wide Zapret, set it explicitly:

```env
YTDLP_PROXY=socks5://127.0.0.1:1080
```

Do not commit real local proxy values to the repository.

## Requirements

- Bun 1.x+
- `yt-dlp`
- `ffmpeg`
- `ffprobe`
- Optional for restricted YouTube access: Zapret or an HTTP/SOCKS proxy

Verify external tools:

```bash
yt-dlp --version
ffmpeg -version
ffprobe -version
```

## Tech Stack

| Area | Technology |
| --- | --- |
| Runtime | Bun |
| Frontend | Vite, React 19, React Router |
| Backend | Elysia |
| Desktop | Electron |
| Styling | Tailwind CSS |
| Notifications | react-toastify |
| Video tools | yt-dlp, ffmpeg, ffprobe |
| Language | TypeScript |

## Installation

```bash
bun install
```

Create `.env` in the repository root or copy `.env.example`:

```env
VITE_FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# Leave empty when using system-wide Zapret.
# Example: socks5://127.0.0.1:1080
YTDLP_PROXY=

# Recommended for YouTube when Zapret is used.
YTDLP_FORCE_IPV4=true
```

## Development

Start frontend and backend together:

```bash
bun run dev
```

Open:

```text
http://localhost:5173
```

Run only frontend:

```bash
bun run dev:web
```

Run only backend:

```bash
bun run dev:server
```

## Desktop App

Start the desktop wrapper from terminal:

```bash
bun run desktop
```

On Windows, you can launch the desktop app by double-clicking:

```text
desktop/YouTube Downloader.cmd
```

To create a desktop shortcut with the project icon:

```powershell
powershell -ExecutionPolicy Bypass -File desktop/create-desktop-shortcut.ps1
```

The desktop app uses the same frontend and backend behavior as the web app. `yt-dlp`, `ffmpeg`, and `ffprobe` must still be available in `PATH`.

## Commands

| Command | Description |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start frontend and backend |
| `bun run desktop` | Start Electron desktop app |
| `bun run dev:web` | Start frontend on port `5173` |
| `bun run dev:server` | Start backend on port `3001` |
| `bun run build:web` | Type-check and build frontend |
| `bun run preview:web` | Preview frontend production build |
| `bun --filter web lint` | Run frontend ESLint |
| `bunx tsc -p apps/server/tsconfig.json` | Type-check backend |

## API

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/health` | GET | Backend health check |
| `/api/video/info?url=...` | GET | Read video metadata |
| `/api/video/download?url=...&quality=720` | GET | Start a download |
| `/api/video/progress/:id` | GET | SSE progress stream |
| `/api/video/cancel/:id` | POST | Cancel active download |
| `/api/video/file/:id` | GET | Download finished file |

## Project Structure

```text
YouTube_Downloader/
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
│   ├── app-icon.ico
│   ├── app-icon.png
│   ├── create-desktop-shortcut.ps1
│   ├── main.cjs
│   └── YouTube Downloader.cmd
├── AGENTS.md
├── package.json
├── README.md
└── tsconfig.json
```

## Download Flow

1. The client requests video metadata from the backend.
2. The user selects quality and starts the download.
3. The backend runs `yt-dlp` with progress output.
4. The client listens to `/api/video/progress/:id` through SSE.
5. The backend merges/prepares the MP4 and verifies it with `ffprobe`.
6. The client receives the file only after the backend reports `finished`.

Files are stored temporarily in:

```text
apps/downloads_files/
```

The app does not use SQLite because download history and user data are not persisted. The finished file is delivered directly to the user.

## Notes For GitHub

- `.env` is local and must not be committed.
- Use `.env.example` for public configuration examples.
- Downloaded videos and temporary files are ignored.
- YouTube access in restricted networks depends on a working Zapret setup or proxy.
- SSE is intentionally used instead of WebSocket because progress updates are one-way server-to-client events.
- Before publishing changes, run:

```bash
bun run build:web
bun --filter web lint
bunx tsc -p apps/server/tsconfig.json
```
