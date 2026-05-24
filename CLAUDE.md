# Joe Calvey Portfolio — Architecture

## Overview
Personal portfolio for Joe Calvey (Creative Advertising student). Dark pixel-art prison room as the landing scene. Clicking the CRT computer triggers a TV static transition to the portfolio/work view. Built with React + Vite, Framer Motion, Tailwind CSS v4. Deployed to Netlify via GitHub.

## Visual Concept
- Full-viewport dark, dingy room (CSS-drawn, pixel art aesthetic)
- Back wall with brick texture, side walls, ceiling, floor all visible
- Pixel art CRT computer centered on back wall — clickable to enter portfolio
- On click: TV static animation (canvas-based) transitions to clean portfolio view
- Portfolio view is clean and readable (not pixel art — deliberate contrast)
- Style reference: Clover Pit game (dark, muted, earthy palette)
- The room scene is currently CSS-drawn. It is designed to be replaced with an actual pixel art sprite/illustration later — see `src/components/Room.jsx`

## Tech Stack
- React 19 + Vite
- Framer Motion (animations, hover states)
- Tailwind CSS v4 (via @tailwindcss/vite)
- Google Fonts: Press Start 2P (pixel art), Inter (portfolio UI), Share Tech Mono (admin/labels)
- Deployed to Netlify, GitHub auto-deploy

## File Structure
```
src/
  App.jsx                    Main app — state machine, ntfy, analytics, keyboard shortcut
  main.jsx                   Entry point
  content.json               Project text (problem/insight/solution per project ID)
  data/
    projects.json            Project list — title, brief, tags, year, order, coverImage
    settings.json            Site settings — ntfy topic, GoatCounter code, site title
    todos.json               Admin to-do list
  components/
    Room.jsx                 Pixel art prison room scene (CSS-drawn)
    Computer.jsx             Clickable CRT computer with idle flicker and hover state
    StaticTransition.jsx     Canvas-based TV static transition overlay
    Portfolio.jsx            Clean work view — project grid + ProjectModal
    ProjectModal.jsx         Individual project detail modal (cover, text, work images)
    Admin.jsx                Hidden admin panel (Ctrl+Shift+A, dev only)
  assets/
    images/
      projects/
        {id}/
          cover.png          Project cover image (uploaded via admin)
          work/              Work images (uploaded via admin)
```

## State Flow (App.jsx)
```
view: 'room' | 'portfolio'
transitioning: boolean

room → [click computer] → transitioning=true → StaticTransition plays
  → onComplete → view='portfolio', transitioning=false

portfolio → [click back] → transitioning=true → StaticTransition plays
  → onComplete → view='room', transitioning=false
```

## Admin Panel
- Trigger: Ctrl+Shift+A (only useful in dev — API routes don't exist on Netlify)
- Tabs: Projects | Settings | Deploy | To-do
- Draggable panel (drag the title bar)
- All saves call `/api/*` routes which write to `src/data/*.json` and `src/content.json`
- **Does nothing on the live site** — the API routes only exist in the Vite dev server plugin

## Vite Dev Plugin (vite.config.js)
The `adminApiPlugin()` function intercepts `/api/*` requests during `npm run dev` only (`apply: 'serve'`). Routes:
- `GET  /api/admin-data`        — reads all data files, scans for uploaded images
- `POST /api/save-projects`     — writes projects.json
- `POST /api/save-settings`     — writes settings.json
- `POST /api/save-content`      — writes content.json (per-project text)
- `POST /api/upload-image`      — saves cover or work images to assets/images/projects/
- `DELETE /api/delete-work-image`
- `GET  /api/todos`             — reads todos.json
- `POST /api/todos`             — writes todos.json
- `GET  /api/git-status`        — runs git status/log
- `POST /api/deploy`            — runs git add -A && git commit && git push

Vite's file watcher is configured to ignore data JSON files so admin saves don't trigger hot-reload.

## Data Architecture
All content lives in JSON files. In dev, App.jsx fetches fresh data from `/api/admin-data` on mount to avoid Vite's module cache serving stale JSON. In production, JSON is statically imported at build time (always fresh since Netlify rebuilds from scratch).

## Image Loading
Images are loaded via Vite's `import.meta.glob`. This means:
- **New images need a dev server restart to appear** (Vite re-scans globs at startup)
- At build time, all matched images are bundled with hashed filenames
- Cover images: `src/assets/images/projects/{id}/cover.{png,jpg,jpeg,webp}`
- Work images: `src/assets/images/projects/{id}/work/*.{png,jpg,jpeg,webp}`

## Analytics & Notifications
- **GoatCounter**: injected as `<script>` tag when `settings.analytics.goatcounterSiteCode` is set
- **ntfy.sh**: fires once on page load, **only on the live site** (skipped in dev). Sends visitor location (ipapi.co), network type, referrer, device. Topic set in `settings.notifications.ntfyTopic`
- ipapi.co is used for location (not ipinfo.io — that is CORS-blocked from the browser)

## Netlify Deployment
- `public/_redirects` contains `/* /index.html 200` for SPA routing
- Auto-deploys when `main` branch is pushed to GitHub
- The deploy button in the admin panel runs `git add -A && git commit && git push`

## Conventions
- All sizes in the Room and Computer components use explicit px values — no Tailwind for the visual scene
- `image-rendering: pixelated` on all pixel art elements
- No border-radius on structural room/computer elements (pixel art = sharp edges)
- Portfolio UI can use Tailwind and standard CSS — it's deliberately non-pixel-art
- ntfy notification must use URL query params (not custom headers) to avoid CORS preflight
- Admin panel is **never** shown in production — it requires the local Vite API to function

## Outstanding / Future Work
- Replace CSS room with an actual pixel art sprite illustration
- Add more room props/decorations (accessible via admin settings later)
- Add project filtering by tag in portfolio view
- Consider adding a "CV/about" section accessible from the portfolio
- Set up GitHub repo and connect Netlify
