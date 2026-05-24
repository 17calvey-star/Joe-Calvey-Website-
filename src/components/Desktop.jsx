import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import DesktopIcon   from './DesktopIcon'
import DesktopWindow from './DesktopWindow'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getClock() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ── Title bar ─────────────────────────────────────────────────────────────────
function TitleBar({ scale: s, title, time, onShutDown }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 28 * s,
      background: 'linear-gradient(180deg, #1e1e38 0%, #14142a 100%)',
      borderBottom: `${2 * s}px solid #3030a0`,
      display: 'flex', alignItems: 'center',
      padding: `0 ${10 * s}px`,
      justifyContent: 'space-between',
      userSelect: 'none',
      zIndex: 100,
      imageRendering: 'pixelated',
    }}>
      {/* Left: OS logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 * s }}>
        <div style={{
          width: 14 * s, height: 14 * s,
          background: 'linear-gradient(135deg, #4080ff, #8040ff)',
          border: `${1 * s}px solid rgba(255,255,255,0.3)`,
        }} />
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7 * s, color: '#c0c0e0', letterSpacing: 1,
        }}>{title || 'CALVEY OS  v1.0'}</span>
      </div>

      {/* Right: clock */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10 * s, color: '#8080b0', letterSpacing: 1,
      }}>{time}</span>
    </div>
  )
}

// ── Taskbar ───────────────────────────────────────────────────────────────────
function Taskbar({ scale: s, onShutDown, openTitles }) {
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
          padding: `${3 * s}px ${10 * s}px`,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 6 * s,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6 * s,
          letterSpacing: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(180deg, #3a3a6a, #2a2a4a)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(180deg, #2a2a4a, #1a1a34)'}
      >
        ▶ START
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
          {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
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

export default function Desktop({ projects, content, settings, scale, isTouchDevice, onExit }) {
  const s = scale
  const [time, setTime]             = useState(getClock)
  const [openWindows, setWindows]   = useState([])
  const [activeId, setActiveId]     = useState(null)

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
    // Bring to front if already open
    if (openWindows.find(w => w.id === id)) {
      setActiveId(id)
      return
    }
    setWindows(ws => [...ws, { id, project }])
    setActiveId(id)
  }, [openWindows])

  const closeWindow = useCallback((id) => {
    setWindows(ws => ws.filter(w => w.id !== id))
    setActiveId(prev => prev === id ? null : prev)
  }, [])

  // Ctrl+Escape or keyboard shortcut to exit
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
      <TitleBar scale={s} title={settings?.osTitle} time={time} onShutDown={onExit} />

      {/* Desktop area */}
      <div style={{
        position: 'absolute',
        top: TITLE_H, bottom: TASK_H,
        left: 0, right: 0,
        overflow: 'hidden',
      }}>
        <Wallpaper />

        {/* Icon grid — 2 columns, top-left */}
        <div style={{
          position: 'absolute',
          top: 16 * s, left: 16 * s,
          display: 'grid',
          gridTemplateColumns: `repeat(2, ${80 * s}px)`,
          gap: `${12 * s}px ${8 * s}px`,
          zIndex: 10,
        }}>
          {visibleProjects.map(project => (
            <DesktopIcon
              key={project.id}
              project={project}
              scale={s}
              isActive={activeId === project.id}
              isTouchDevice={isTouchDevice}
              onOpen={() => openProject(project)}
            />
          ))}
        </div>

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
      />
    </div>
  )
}
