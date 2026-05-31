import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import DesktopIcon   from './DesktopIcon'
import DesktopWindow from './DesktopWindow'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getClock() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ── Title bar ─────────────────────────────────────────────────────────────────
function TitleBar({ scale: s, title }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 28 * s,
      background: 'linear-gradient(180deg, #1e1e38 0%, #14142a 100%)',
      borderBottom: `${2 * s}px solid #3030a0`,
      display: 'flex', alignItems: 'center',
      padding: `0 ${10 * s}px`,
      userSelect: 'none',
      zIndex: 100,
      imageRendering: 'pixelated',
    }}>
      {/* OS logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
        <div style={{
          width: 14 * s, height: 14 * s,
          background: 'linear-gradient(135deg, #4080ff, #8040ff)',
          border: `${1 * s}px solid rgba(255,255,255,0.3)`,
        }} />
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7 * s, color: '#c0c0e0', letterSpacing: 1,
        }}>{title || 'Calvey v1.0'}</span>
      </div>
    </div>
  )
}

// ── Taskbar ───────────────────────────────────────────────────────────────────
function Taskbar({ scale: s, onShutDown, openTitles, time, adminMode, onResetLayout, saving }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 36 * s,
      background: 'linear-gradient(180deg, #141428 0%, #0e0e20 100%)',
      borderTop: `${2 * s}px solid #3030a0`,
      display: 'flex', alignItems: 'center',
      padding: `0 ${8 * s}px`,
      gap: 8 * s,
      userSelect: 'none',
      zIndex: 100,
      imageRendering: 'pixelated',
    }}>
      {/* Shut-down / back button */}
      <button
        onClick={onShutDown}
        style={{
          background: 'linear-gradient(180deg, #2a2a4a, #1a1a34)',
          border: `${2 * s}px solid #5050c0`,
          color: '#c0c0e0',
          padding: `${4 * s}px ${14 * s}px`,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7 * s,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6 * s,
          letterSpacing: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(180deg, #3a3a6a, #2a2a4a)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(180deg, #2a2a4a, #1a1a34)'}
      >
        ▶ HOME
      </button>

      {/* Divider */}
      <div style={{ width: 1 * s, height: 22 * s, background: '#3030a0' }} />

      {/* Open window chips */}
      {openTitles.map((t, i) => (
        <div key={i} style={{
          background: '#1e1e38', border: `${1 * s}px solid #4040a0`,
          padding: `${2 * s}px ${8 * s}px`,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9 * s, color: '#a0a0c0',
          maxWidth: 120 * s, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{t}</div>
      ))}

      {/* Admin controls */}
      {adminMode && (
        <>
          <div style={{ width: 1 * s, height: 22 * s, background: '#3030a0' }} />
          <button
            onClick={onResetLayout}
            style={{
              background: 'linear-gradient(180deg, #2a1a1a, #1a0e0e)',
              border: `${2 * s}px solid #a03030`,
              color: '#e08080',
              padding: `${4 * s}px ${10 * s}px`,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 6 * s, cursor: 'pointer', letterSpacing: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(180deg, #3a2020, #2a1010)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(180deg, #2a1a1a, #1a0e0e)'}
          >⟳ RESET LAYOUT</button>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 6 * s, color: saving ? '#ffdd80' : '#ff8888',
            letterSpacing: 1, padding: `${2 * s}px ${6 * s}px`,
            border: `${1 * s}px solid ${saving ? '#806040' : '#602020'}`,
            background: saving ? '#1a1500' : '#1a0a0a',
          }}>
            {saving ? '● SAVING' : '✎ ADMIN'}
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* System tray */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8 * s,
        padding: `${2 * s}px ${8 * s}px`,
        border: `${1 * s}px solid #3030a0`,
        background: '#0e0e20',
      }}>
        <span style={{ fontSize: 10 * s }}>🔊</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9 * s, color: '#8080b0' }}>
          {time}
        </span>
      </div>
    </div>
  )
}

// ── Desktop wallpaper ─────────────────────────────────────────────────────────
function Wallpaper() {
  // Pixel art dark cityscape approximation using CSS gradients.
  // The user can swap this for a real image later via admin → Settings.
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `
        linear-gradient(180deg,
          #0a0a1e 0%,
          #0d0d28 35%,
          #0e1020 55%,
          #080808 100%)
      `,
      imageRendering: 'pixelated',
    }}>
      {/* Stars */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(1px 1px at 12% 8%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 28% 14%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 45% 6%,  rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 63% 18%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 78% 9%,  rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 91% 22%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 34% 28%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 57% 31%, rgba(255,255,255,0.5) 0%, transparent 100%)
        `,
        pointerEvents: 'none',
      }} />
      {/* Silhouette city blocks */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '28%',
        backgroundImage: `
          linear-gradient(to top,
            #060608 0%,
            #060608 40%,
            transparent 40%
          )
        `,
        backgroundSize: '100% 100%',
      }} />
      {/* Building silhouettes using box-shadows */}
      <div style={{
        position: 'absolute', bottom: '28%', left: 0, right: 0,
        height: '20%',
        backgroundImage: `
          repeating-linear-gradient(90deg,
            #070710 0px, #070710 22px,
            transparent 22px, transparent 6px,
            #070710 28px, #070710 40px,
            transparent 40px, transparent 8px,
            #060610 48px, #060610 18px,
            transparent 18px, transparent 14px
          )
        `,
        backgroundSize: '120px 100%',
        backgroundPosition: '0 bottom',
        opacity: 0.9,
      }} />
    </div>
  )
}

// ── Main Desktop component ────────────────────────────────────────────────────

// ── Calculate default grid position (% of desktop area) ─────────────────────
function getDefaultPos(index, dw, dh, s) {
  const ICON_W = 112 * s
  const ICON_H = 124 * s
  const PAD    = 16  * s
  const GAP_X  = 8   * s
  const GAP_Y  = 14  * s
  const cols   = Math.max(1, Math.floor((dw - PAD * 2 + GAP_X) / (ICON_W + GAP_X)))
  const col    = index % cols
  const row    = Math.floor(index / cols)
  const x      = PAD + col * (ICON_W + GAP_X)
  const y      = PAD + row * (ICON_H + GAP_Y)
  return {
    xPct: Math.min(90, (x / dw) * 100),
    yPct: Math.min(90, (y / dh) * 100),
  }
}

export default function Desktop({ projects, content, settings, scale, isTouchDevice, onExit, adminMode, onProjectsChange }) {
  const s = scale
  const [time, setTime]           = useState(getClock)
  const [openWindows, setWindows] = useState([])
  const [activeId, setActiveId]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const desktopAreaRef            = useRef(null)
  const [desktopSize, setDesktopSize] = useState({ w: 1280, h: 720 })

  // Track desktop area size for percentage ↔ pixel conversion
  useEffect(() => {
    const el = desktopAreaRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setDesktopSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Live clock
  useEffect(() => {
    const iv = setInterval(() => setTime(getClock()), 10000)
    return () => clearInterval(iv)
  }, [])

  const visibleProjects = projects
    .filter(p => !p.hidden)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const openProject = useCallback((project) => {
    const id = project.id
    if (openWindows.find(w => w.id === id)) { setActiveId(id); return }
    setWindows(ws => [...ws, { id, project }])
    setActiveId(id)
  }, [openWindows])

  const closeWindow = useCallback((id) => {
    setWindows(ws => ws.filter(w => w.id !== id))
    setActiveId(prev => prev === id ? null : prev)
  }, [])

  // Save a single icon's position to projects data + API
  const handlePositionSave = useCallback(async (projectId, xPct, yPct) => {
    const updated = projects.map(p =>
      p.id === projectId ? { ...p, desktopPos: { x: xPct, y: yPct } } : p
    )
    onProjectsChange?.({ projects: updated })
    if (!import.meta.env.DEV) return
    setSaving(true)
    try {
      await fetch('/api/save-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updated }),
      })
    } catch (e) { console.warn('Position save failed', e) }
    finally { setTimeout(() => setSaving(false), 900) }
  }, [projects, onProjectsChange])

  // Reset all positions to auto-grid
  const handleResetLayout = useCallback(async () => {
    const updated = projects.map(p => ({ ...p, desktopPos: { x: 0, y: 0 } }))
    onProjectsChange?.({ projects: updated })
    if (!import.meta.env.DEV) return
    setSaving(true)
    try {
      await fetch('/api/save-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updated }),
      })
    } catch (e) { console.warn('Reset failed', e) }
    finally { setTimeout(() => setSaving(false), 900) }
  }, [projects, onProjectsChange])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && openWindows.length === 0) onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openWindows.length, onExit])

  const TITLE_H = 28 * s
  const TASK_H  = 36 * s

  return (
    <div style={{
      position: 'fixed', inset: 0,
      fontFamily: "'Press Start 2P', monospace",
      imageRendering: 'pixelated',
      overflow: 'hidden',
    }}>
      <TitleBar scale={s} title={settings?.osTitle} />

      {/* Desktop area — icons are absolutely positioned */}
      <div
        ref={desktopAreaRef}
        style={{
          position: 'absolute',
          top: TITLE_H, bottom: TASK_H,
          left: 0, right: 0,
          overflow: 'hidden',
        }}
      >
        <Wallpaper />

        {visibleProjects.map((project, index) => {
          const saved = project.desktopPos
          const hasCustom = saved && (saved.x !== 0 || saved.y !== 0)
          const { xPct, yPct } = hasCustom
            ? { xPct: saved.x, yPct: saved.y }
            : getDefaultPos(index, desktopSize.w, desktopSize.h, s)

          return (
            <DesktopIcon
              key={project.id}
              project={project}
              scale={s}
              isActive={activeId === project.id}
              isTouchDevice={isTouchDevice}
              onOpen={() => openProject(project)}
              adminMode={adminMode}
              xPct={xPct}
              yPct={yPct}
              desktopSize={desktopSize}
              onPositionSave={(x, y) => handlePositionSave(project.id, x, y)}
            />
          )
        })}

        {/* Open windows */}
        <AnimatePresence>
          {openWindows.map((win, idx) => (
            <DesktopWindow
              key={win.id}
              project={win.project}
              content={content[win.project.id] || {}}
              scale={s}
              zIndex={20 + idx}
              isActive={activeId === win.id}
              onClose={() => closeWindow(win.id)}
              onFocus={() => setActiveId(win.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <Taskbar
        scale={s}
        onShutDown={onExit}
        openTitles={openWindows.map(w => w.project.title)}
        time={time}
        adminMode={adminMode}
        onResetLayout={handleResetLayout}
        saving={saving}
      />
    </div>
  )
}
