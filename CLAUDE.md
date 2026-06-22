# Joe Calvey Portfolio — Claude Guide

## Start Here

**Tech stack:** Vite + React (JSX), Tailwind, no TypeScript.  
**Dev server:** `npm run dev` from `~/Documents/my-portfolio` (port 5173).  
**Admin panel:** Ctrl+Shift+A in dev. Tabs: Projects, About Me, Settings, Contact, Deploy, To-do.  
**Data files** (never hot-reloaded by Vite — ignored in watcher):
- `src/data/projects.json` — project list
- `src/data/settings.json` — site settings, about content, contact info
- `src/content.json` — per-project case study text
- `src/data/todos.json` — admin to-do list

**All tunable constants** (audio volumes, seasons, design width) → `src/config.js`

---

## Key Files

| File | What it does |
|---|---|
| `src/App.jsx` | Root. View routing, rain audio, admin shortcut, ntfy notifications. |
| `src/components/Room.jsx` | Homepage pixel-art room SVG. All interactive objects. ~1150 lines. |
| `src/components/Desktop.jsx` | Portfolio OS desktop (windows, icons). |
| `src/components/Admin.jsx` | Admin panel. All tabs. Saves via `/api/*` routes in vite.config.js. |
| `src/components/AboutMe.jsx` | Book-style about page. Reads from `settings.about`. |
| `src/components/Contact.jsx` | Contact page. Reads from `settings.contact`. |
| `src/components/VentPage.jsx` | Vent/puzzle page. |
| `src/components/SafeLock.jsx` | Safe combination puzzle. |
| `src/components/StaticTransition.jsx` | TV static transition (room ↔ desktop). |
| `src/components/HorrorOverlay.jsx` | Film grain / scanline / vignette overlay. |
| `src/config.js` | **All tunable constants** — edit this first. |
| `vite.config.js` | All `/api/*` dev-server routes (save, upload, deploy, todos). |

---

## Scale System

Every component receives `scale = containerWidth / DESIGN_WIDTH` (1280).  
Multiply all pixel values by `scale` — never hardcode px in components.  
`DESIGN_WIDTH` is exported from `src/config.js` (and re-exported from `App.jsx`).

---

## Views / Routing

Views: `'room'` | `'desktop'` | `'about'` | `'contact'` | `'vent'`

| View | URL | Entry point |
|---|---|---|
| room | `/` | default |
| desktop | `/portfolio` | click computer → TV static transition |
| about | `/about` | click mug/book on desk |
| contact | `/contact` | click phone on desk |
| vent | `/vent` | click vent fan |

Room stays rendered as backdrop when about/contact/vent panels are open.

---

## Audio

All volumes in `src/config.js`:

```js
VOL_RAIN_ROOM    = 0.18   // App.jsx — rain on homepage
VOL_RAIN_DESKTOP = 0.07   // App.jsx — rain on desktop
VOL_RAIN_VENT    = 0.05   // App.jsx — rain in vents
VOL_FRIDGE       = 0.25   // Room.jsx — fridge hum
VOL_STATIC       = 0.25   // StaticTransition.jsx — TV static
```

Rain starts on first user gesture (click/key) to satisfy browser autoplay policy.  
Fridge hum is managed inside Room.jsx with the same gesture-wait pattern.

---

## Room Objects (Room.jsx)

Constants near the top of Room.jsx control position/size of every object:

| Constant | Object |
|---|---|
| `SCR` | CRT screen bounds (x, y, w, h) |
| `WIN_X/Y/W/H` | Barred window |
| `FAN_CX/CY/R/SPEED` | Vent fan |
| `BOOK_X/Y/W/H` | About Me book/mug |
| `PHONE_X/Y/W/H` | Contact phone |
| `SAFEWEB_X/Y/W/H` | Safe on wall |
| `BOXES_X/Y/W/H` | Boxes bottom-left |
| `TABLE_X/Y/W/H` | Table overlay |
| `CAT_X/Y/GAP` | Hidden cat eyes (post-vent) |

Images imported at top of Room.jsx — swap image file by changing the import.

---

## Seasonal System

```js
// src/config.js
SUMMER_MONTHS = [5, 6, 7]   // Jun Jul Aug
AUTUMN_MONTHS = [8, 9, 10]  // Sep Oct Nov
```

Active month: `settings?.previewMonth ?? new Date().getMonth()`  
`previewMonth` is set in Admin → Settings → Season Preview (stored in localStorage).  
Currently all months show the same rainy window scene. Seasonal window variation is a TODO — `AUTUMN_LEAVES` array in Room.jsx is ready but not rendered.

---

## Data Saving (vite.config.js)

All API routes are in `adminApiPlugin()` in `vite.config.js`:

| Route | Method | Purpose |
|---|---|---|
| `/api/admin-data` | GET | Load all data files + project image inventory |
| `/api/save-projects` | POST | Write `projects.json` |
| `/api/save-settings` | POST | Write `settings.json` (includes about + contact) |
| `/api/save-content` | POST | Write per-project case study to `content.json` |
| `/api/upload-image` | POST | Save project cover/work image to `src/assets/images/projects/` |
| `/api/delete-work-image` | DELETE | Delete a project work image |
| `/api/upload-about-photo` | POST | Save photo to `public/about-photos/` |
| `/api/delete-about-photo` | DELETE | Delete an about photo |
| `/api/upload-pdf` | POST | Save PDF to `public/pdfs/` |
| `/api/todos` | GET/POST | Read/write todos |
| `/api/git-status` | GET | Git status for deploy tab |
| `/api/deploy` | POST | `git add -A && git commit && git push`, optionally trigger Netlify hook |

`PROJECT_ROOT` is derived from `import.meta.url` in vite.config.js — always correct regardless of where Vite is launched from.

---

## About Me Page

`AboutMe.jsx` reads from `settings.about`:
- `heading`, `photosHeading`, `bio`, `skills`, `cvLabel`, `cvUrl`, `photos[]`
- CV section hidden if `cvUrl` is empty
- Skills section hidden if `skills` is empty
- Photos default to `PHOTOS` constant in AboutMe.jsx if `settings.about.photos` is empty
- Uploaded photos go to `public/about-photos/`, referenced as `/about-photos/{filename}`

---

## Deployment

Deploy tab in Admin: commits all changes and pushes to git remote.  
Netlify auto-deploys on push if connected. Or set `settings.deploy.netlifyHookUrl` for an explicit trigger.

---

## Analytics & Notifications

- **GoatCounter**: set `settings.analytics.goatcounterSiteCode` in Admin → Settings.
- **ntfy.sh**: set `settings.notifications.ntfyTopic` in `settings.json`. Sends visit notification with IP geolocation + network type. Dev-only suppressed.
