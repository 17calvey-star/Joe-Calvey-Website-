import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import projectsData from './data/projects.json'
import settingsData from './data/settings.json'
import contentData from './content.json'
import Room      from './components/Room'
import Desktop   from './components/Desktop'
import AboutMe   from './components/AboutMe'
import Contact   from './components/Contact'
import VentPage  from './components/VentPage'
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
  const [view, setView]           = useState(() => {
    const p = window.location.pathname
    if (p.startsWith('/portfolio') || p.startsWith('/desktop')) return 'desktop'
    if (p.startsWith('/about')) return 'about'
    if (p.startsWith('/contact')) return 'contact'
    if (p.startsWith('/vent')) return 'vent'
    return 'room'
  })   // 'room' | 'desktop' | 'about' | 'contact' | 'vent'
  const [transitioning, setTrans] = useState(false)
  const [transDir, setTransDir]   = useState('in')     // 'in' | 'out'
  const [adminOpen, setAdminOpen] = useState(false)
  const [hasVisitedVent, setHasVisitedVent] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

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
        if (d.settings) setSettings(s => ({ ...d.settings, previewMonth: s.previewMonth }))
        if (d.content)  setContent(d.content)
      })
      .catch(() => setProjects(projectsData))
  }, [])

  // Load admin season preview month from localStorage
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const saved = localStorage.getItem('admin-preview-month')
    if (saved !== null) setSettings(s => ({ ...s, previewMonth: parseInt(saved) }))
  }, [])

  // ── Sync view from URL — handles browser back / forward ──────────────────────
  useEffect(() => {
    const p = location.pathname
    if (p.startsWith('/portfolio') || p.startsWith('/desktop')) {
      setView('desktop'); setTrans(false)
    } else if (p.startsWith('/about')) {
      setView('about'); setTrans(false)
    } else if (p.startsWith('/contact')) {
      setView('contact'); setTrans(false)
    } else if (p.startsWith('/vent')) {
      setView('vent'); setTrans(false)
    } else {
      setView('room'); setTrans(false)
    }
  }, [location.pathname]) // eslint-disable-line

  // ── Block Ctrl/Cmd + scroll zoom (desktop browser zoom) ─────────────────────
  useEffect(() => {
    const onWheel = (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
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
    if (transDir === 'in') {
      setView('desktop')
      navigate('/portfolio')
    } else if (transDir === 'out') {
      setView('room')
      navigate('/')
    }
    setTrans(false)
  }, [transDir, navigate])

  const handleExitDesktop = useCallback(() => {
    if (transitioning) return
    setTransDir('out'); setTrans(true)
  }, [transitioning])

  // About uses a simple CSS fade — no static transition
  const handleAboutClick = useCallback(() => {
    if (transitioning) return
    setView('about')
    navigate('/about')
  }, [transitioning, navigate])

  const handleContactClick = useCallback(() => {
    if (transitioning) return
    setView('contact')
    navigate('/contact')
  }, [transitioning, navigate])

  // Vent — zoom completes inside Room before this fires
  const handleVentClick = useCallback(() => {
    setHasVisitedVent(true)
    setView('vent')
    navigate('/vent')
  }, [navigate])

  // Shared exit handler — About, Contact and Vent all fade back to room
  const handleExitToRoom = useCallback(() => {
    setView('room')
    navigate('/')
  }, [navigate])

  const handleAdminChange = useCallback(({ projects: p, settings: s, content: c }) => {
    if (p) setProjects(p)
    if (s) setSettings(s)
    if (c) setContent(c)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0 }}>
      {/* Room — stays visible as backdrop when About / Contact / Vent panels open */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        opacity: view === 'room' || view === 'about' || view === 'contact' || view === 'vent' ? 1 : 0,
        pointerEvents: view === 'room' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <Room
          onComputerClick={handleComputerClick}
          onAboutClick={handleAboutClick}
          onContactClick={handleContactClick}
          onVentClick={handleVentClick}
          hasVisitedVent={hasVisitedVent}
          scale={scale}
          settings={settings}
          isActive={view === 'room' || view === 'about' || view === 'contact'}
        />
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
          adminMode={adminOpen}
          onProjectsChange={handleAdminChange}
        />
      </div>

      {/* About Me */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        opacity: view === 'about' && !transitioning ? 1 : 0,
        pointerEvents: view === 'about' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <AboutMe onClose={handleExitToRoom} settings={settings} />
      </div>

      {/* Contact */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        opacity: view === 'contact' && !transitioning ? 1 : 0,
        pointerEvents: view === 'contact' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <Contact onClose={handleExitToRoom} settings={settings} />
      </div>

      {/* Vent — no opacity wrapper; VentPage handles its own fade */}
      {view === 'vent' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
          <VentPage onClose={handleExitToRoom} />
        </div>
      )}

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
