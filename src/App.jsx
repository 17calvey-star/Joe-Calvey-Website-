import { useState, useEffect, useRef, useCallback } from 'react'
import projectsData from './data/projects.json'
import settingsData from './data/settings.json'
import contentData from './content.json'
import Room      from './components/Room'
import Desktop   from './components/Desktop'
import StaticTransition from './components/StaticTransition'
import Admin     from './components/Admin'

// ── Scale system ──────────────────────────────────────────────────────────────
// All components receive a `scale` prop derived from container width vs design
// width. Never hardcode pixel values in components — always multiply by scale.
export const DESIGN_WIDTH = 1280

export default function App() {
  const containerRef  = useRef(null)
  const [scale, setScale]           = useState(1)
  const [isTouchDevice, setTouch]   = useState(false)

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / DESIGN_WIDTH)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ── View state ───────────────────────────────────────────────────────────────
  const [view, setView]           = useState('room')   // 'room' | 'desktop'
  const [transitioning, setTrans] = useState(false)
  const [transDir, setTransDir]   = useState('in')     // 'in' = room→desktop
  const [adminOpen, setAdminOpen] = useState(false)

  // ── Content state ────────────────────────────────────────────────────────────
  const [projects,  setProjects]  = useState(() => import.meta.env.DEV ? [] : projectsData)
  const [settings,  setSettings]  = useState(settingsData)
  const [content,   setContent]   = useState(contentData)

  // In dev: hydrate from disk via API to bypass Vite module-cache staleness
  useEffect(() => {
    if (!import.meta.env.DEV) return
    fetch('/api/admin-data')
      .then(r => r.json())
      .then(d => {
        if (d.projects) setProjects(d.projects)
        if (d.settings) setSettings(d.settings)
        if (d.content)  setContent(d.content)
      })
      .catch(() => setProjects(projectsData))
  }, [])

  // ── Admin keyboard shortcut (dev only) ───────────────────────────────────────
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') setAdminOpen(o => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── GoatCounter ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const code = settings?.analytics?.goatcounterSiteCode?.trim()
    if (!code || document.getElementById('goatcounter-script')) return
    const s = document.createElement('script')
    s.id = 'goatcounter-script'; s.async = true
    s.setAttribute('data-goatcounter', `https://${code}.goatcounter.com/count`)
    s.src = '//gc.zgo.at/count.js'
    document.head.appendChild(s)
  }, [settings?.analytics?.goatcounterSiteCode]) // eslint-disable-line

  // ── ntfy visitor notification (live site only) ───────────────────────────────
  const _notifiedRef = useRef(false)
  useEffect(() => {
    if (_notifiedRef.current || import.meta.env.DEV) return
    const topic = (settingsData?.notifications?.ntfyTopic || '').trim()
    if (!topic) return
    _notifiedRef.current = true

    const sessionTag = Math.random().toString(36).slice(2, 6).toUpperCase()

    const send = (loc) => {
      const city    = loc?.city         || ''
      const region  = loc?.region       || ''
      const country = loc?.country_name || ''
      const flag    = loc?.country_code
        ? String.fromCodePoint(...[...loc.country_code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
        : '🌍'
      const where   = [city, region, country].filter(Boolean).join(', ') || 'Unknown'
      const org     = loc?.org || ''
      const isUni   = /jisc|janet|university|college|ac\.uk/i.test(org)
      const isMob   = /mobile|cellular|t-mobile|o2|vodafone|three\b|ee\b/i.test(org)
      const isWork  = !isUni && !isMob && org && !/residential|broadband|bt |sky |virgin/i.test(org)
      const netType = isUni ? '🎓 University' : isMob ? '📱 Mobile' : isWork ? '🏢 Work' : '🏠 Home'
      const ref     = document.referrer
      const refLabel = !ref ? 'Direct' :
        /linkedin/i.test(ref) ? 'LinkedIn' : /google/i.test(ref) ? 'Google' :
        /instagram/i.test(ref) ? 'Instagram' : new URL(ref).hostname
      const device = /iphone|ipad/i.test(navigator.userAgent) ? 'iPhone/iPad' :
        /android/i.test(navigator.userAgent) ? 'Android' :
        /mac/i.test(navigator.userAgent) ? 'Mac' :
        /win/i.test(navigator.userAgent) ? 'Windows' : 'Other'
      const postcode = loc?.postal || ''
      const mapsUrl     = `https://www.google.com/maps/search/${encodeURIComponent(postcode || where)}`
      const agenciesUrl = `https://www.google.com/search?q=advertising+agencies+${encodeURIComponent(postcode || city)}`
      const body = [
        `Someone is viewing your portfolio  [${sessionTag}]`,
        `${flag} ${where}`,
        `${netType}${org ? ` — ${org}` : ''}`,
        `🔗 ${refLabel}  |  💻 ${device}`,
      ].join('\n')
      fetch(`https://ntfy.sh/${topic}?${new URLSearchParams({
        title: '👁 Joe Calvey Portfolio', priority: 'default', tags: 'eyes',
        actions: `view, 📍 Map, ${mapsUrl}; view, 🏢 Agencies, ${agenciesUrl}`,
      })}`, { method: 'POST', body }).catch(() => {})
    }

    try {
      fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(loc => send(loc)).catch(() => send(null))
    } catch (_) { send(null) }

    // sendBeacon on leave with time-on-site
    const startTime = Date.now()
    const onLeave = () => {
      const secs = Math.round((Date.now() - startTime) / 1000)
      const mins = Math.floor(secs / 60), s = secs % 60
      const dur  = mins > 0 ? `${mins}m ${s}s` : `${s}s`
      navigator.sendBeacon?.(`https://ntfy.sh/${topic}`,
        JSON.stringify({ topic, title: `⏱ Left after ${dur}  [${sessionTag}]`, message: 'Session ended', priority: 'min' })
      )
    }
    window.addEventListener('pagehide', onLeave)
    return () => window.removeEventListener('pagehide', onLeave)
  }, []) // eslint-disable-line

  // ── Transition handlers ───────────────────────────────────────────────────────
  const handleComputerClick = useCallback(() => {
    if (transitioning) return
    setTransDir('in'); setTrans(true)
  }, [transitioning])

  const handleTransitionComplete = useCallback(() => {
    setView(transDir === 'in' ? 'desktop' : 'room')
    setTrans(false)
  }, [transDir])

  const handleExitDesktop = useCallback(() => {
    if (transitioning) return
    setTransDir('out'); setTrans(true)
  }, [transitioning])

  const handleAdminChange = useCallback(({ projects: p, settings: s, content: c }) => {
    if (p) setProjects(p)
    if (s) setSettings(s)
    if (c) setContent(c)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0 }}>
      {/* Room */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        opacity: view === 'room' ? 1 : 0,
        pointerEvents: view === 'room' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <Room onComputerClick={handleComputerClick} scale={scale} settings={settings} />
      </div>

      {/* OS Desktop */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        opacity: view === 'desktop' && !transitioning ? 1 : 0,
        pointerEvents: view === 'desktop' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <Desktop
          projects={projects}
          content={content}
          settings={settings}
          scale={scale}
          isTouchDevice={isTouchDevice}
          onExit={handleExitDesktop}
        />
      </div>

      {/* TV static transition */}
      <StaticTransition active={transitioning} onComplete={handleTransitionComplete} />

      {/* Admin panel — dev only */}
      {import.meta.env.DEV && adminOpen && (
        <Admin
          projects={projects}
          settings={settings}
          content={content}
          onClose={() => setAdminOpen(false)}
          onChange={handleAdminChange}
        />
      )}
    </div>
  )
}
