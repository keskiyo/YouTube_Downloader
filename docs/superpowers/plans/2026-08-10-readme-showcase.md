# README Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the README into a compact project showcase with three real application screenshots.

**Architecture:** Start the existing local Vite and Elysia services, then capture the three agreed UI states from the running app. Store the images under `docs/images/` and replace the README's technical sections with concise GitHub-facing content that references those assets.

**Tech Stack:** Bun, Vite, React, Elysia, Electron, Markdown, PNG.

## Global Constraints

- Keep the existing English title and opening description.
- Use real local application screenshots, not generated mockups.
- Store screenshots in `docs/images/` as PNG files.
- Keep only features, supported platforms, prerequisites, and launch commands.
- Do not modify user changes already present in `README.md` outside the agreed rewrite.
- Verify README image paths, `bun run build:web`, and `bun --filter web lint`.

---

### Task 1: Capture Real Application States

**Files:**
- Create: `docs/images/app-home.png`
- Create: `docs/images/app-quality.png`
- Create: `docs/images/app-progress.png`

**Interfaces:**
- Consumes: local app served by `bun run dev` on `http://localhost:5173`.
- Produces: three readable PNG screenshots for `README.md`.

- [ ] **Step 1: Start the local app**

Run: `bun run dev`

Expected: Vite is available at `http://localhost:5173` and the API is available at port `3001`.

- [ ] **Step 2: Capture the home screen**

Open `http://localhost:5173` at desktop width and save the page with the URL form visible as `docs/images/app-home.png`.

- [ ] **Step 3: Capture the quality selector**

Open the quality menu in the same UI and save it as `docs/images/app-quality.png`.

- [ ] **Step 4: Capture active progress**

Start a safe short download or use the existing UI's active-download state, then save the progress view as `docs/images/app-progress.png`.

- [ ] **Step 5: Check visual readability**

Open each saved PNG and confirm that the title, primary controls, and progress state are readable at a width of 960 pixels.

### Task 2: Rewrite README as a Showcase

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `docs/images/app-home.png`, `docs/images/app-quality.png`, and `docs/images/app-progress.png`.
- Produces: GitHub-ready project overview with valid relative image paths.

- [ ] **Step 1: Preserve the header**

Keep the existing `# YouTube Downloader` title and its opening English description.

- [ ] **Step 2: Add the visual gallery**

Insert the three screenshot references directly below the opening text:

```md
![Главный экран](docs/images/app-home.png)
![Выбор качества](docs/images/app-quality.png)
![Ход загрузки](docs/images/app-progress.png)
```

- [ ] **Step 3: Replace technical sections**

Keep concise sections only: `Что умеет`, `Поддерживаемые сайты`, `Что нужно`, and `Запуск`. Remove the API endpoint table, project tree, internal download pipeline, and pre-publication instructions.

- [ ] **Step 4: Validate Markdown references**

Run: `Test-Path docs/images/app-home.png; Test-Path docs/images/app-quality.png; Test-Path docs/images/app-progress.png`

Expected: three `True` values.

### Task 3: Verify and Commit

**Files:**
- Modify: `README.md`
- Create: `docs/images/app-home.png`
- Create: `docs/images/app-quality.png`
- Create: `docs/images/app-progress.png`

**Interfaces:**
- Consumes: rewritten README and screenshot assets.
- Produces: validated, committed README showcase.

- [ ] **Step 1: Build the frontend**

Run: `bun run build:web`

Expected: exit code `0`.

- [ ] **Step 2: Run the frontend linter**

Run: `bun --filter web lint`

Expected: exit code `0`.

- [ ] **Step 3: Review staged files**

Run: `git diff -- README.md; git status --short --untracked-files=all`

Expected: README and the three PNG files are the only task artifacts staged or ready to stage; preserve unrelated user files.

- [ ] **Step 4: Commit the showcase**

Run: `git add README.md docs/images/app-home.png docs/images/app-quality.png docs/images/app-progress.png; git commit -m "docs: add real app screenshots"`

Expected: one commit containing only the README and three screenshot assets.
