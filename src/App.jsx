import { useState, useEffect, useRef, useCallback } from 'react'
import projectsData from './data/projects.json'
import settingsData from './data/settings.json'
import contentData from './content.json'
import Room from './components/Room'
import Portfolio from './components/Portfolio'
import StaticTransition from './components/StaticTransition'
import Admin from './components/Admin'

export default function App() {
  const [view, setView]             = useState('room')   // 'room' | 'portfolio'
  const [transitioning, setTransitioning] = useState(false)
  const [transitionDir, setTransitionDir] = useState('in') // 'in' = room→portfolio, 'out' = portfolio→room
  const [activeProject, setActiveProject] = useState(null)
  const [adminOpen, setAdminOpen]   = useState(false)

  const [projects, setProjects]     = useState(() =>
    import.meta.env.DEV ? [] : projectsData
  )
  const [settings, setSettings]     = useState(settingsData)
  const [content, setContent]       = useState(contentData)

  // In dev: hydrate from disk via API to avoid Vite module cache staleness
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

  // Ctrl+Shift+A → toggle admin panel (dev only — no-op on live site)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setAdminOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // GoatCounter injection
  useEffect(() => {
    const code = settings?.analytics?.goatcounterSiteCode?.trim()
    if (!code || document.getElementById('goatcounter-script')) return
    const s = document.createElement('script')
    s.id = 'goatcounter-script'
    s.async = true
    s.setAttribute('data-goatcounter', `https://${code}.goatcounter.com/count`)
    s.src = '//gc.zgo.at/count.js'
    document.head.appendChild(s)
  }, [settings?.analytics?.goatcounterSiteCode]) // eslint-disable-line

  // ntfy visitor notification — fires once on load, only on the live site
  const _notifiedRef = useRef(false)
  useEffect(() => {
    if (_notifiedRef.current) return
    const topic = (settingsData?.notifications?.ntfyTopic || '').trim()
    if (!topic) return
    // Only fire on the deployed site, not locally
    if (import.meta.env.DEV) return
    _notifiedRef.current = true

    const send = (loc) => {
      const city    = loc?.city         || ''
      const region  = loc?.region       || ''
      const country = loc?.country_name || ''
      const flag    = loc?.country_code
        ? String.fromCodePoint(...[...loc.country_code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
        : '🌍'
      const where = [city, region, country].filter(Boolean).join(', ') || 'Unknown location'

      const org     = loc?.org          || ''
      const isUni   = /jisc|janet|university|college|ac\.uk/i.test(org)
      const isMob   = /mobile|cellular|t-mobile|o2|vodafone|three\b|ee\b/i.test(org)
      const isWork  = !isUni && !isMob && org && !/residential|broadband|bt |sky |virgin/i.test(org)
      const netType = isUni ? '🎓 University' : isMob ? '📱 Mobile' : isWork ? '🏢 Work/Office' : '🏠 Home'

      const ref = document.referrer
      const refLabel = !ref ? 'Direct' :
        /linkedin/i.test(ref) ? 'LinkedIn' :
        /google/i.test(ref)   ? 'Google'   :
        /instagram/i.test(ref)? 'Instagram':
        new URL(ref).hostname

      const postcode = loc?.postal || ''
      const mapsUrl  = postcode
        ? `https://www.google.com/maps/search/${encodeURIComponent(postcode)}`
        : `https://www.google.com/maps/search/${encodeURIComponent(where)}`
      const agenciesUrl = `https://www.google.com/search?q=advertising+agencies+${encodeURIComponent(postcode || city)}`

      const body = [
        `Someone is viewing your portfolio`,
        `${flag} ${where}`,
        `${netType}${org ? ` — ${org}` : ''}`,
        `🔗 From: ${refLabel}`,
        `💻 ${navigator.userAgent.includes('Mac') ? 'Mac' : navigator.userAgent.includes('Win') ? 'Windows' : 'Other'}`,
      ].join('\n')

      const qs = new URLSearchParams({
        title: '👁 Joe Calvey Portfolio',
        priority: 'default',
        tags: 'eyes',
        actions: `view, 📍 Map, ${mapsUrl}; view, 🏢 Agencies, ${agenciesUrl}`,
      })

      fetch(`https://ntfy.sh/${topic}?${qs}`, {
        method: 'POST',
        body,
      }).catch(() => {})
    }

    try {
      fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(loc => send(loc))
        .catch(() => send(null))
    } catch (_) {
      send(null)
    }
  }, []) // eslint-disable-line

  const handleComputerClick = useCallback(() => {
    if (transitioning) return
    setTransitionDir('in')
    setTransitioning(true)
  }, [transitioning])

  const handleTransitionComplete = useCallback(() => {
    if (transitionDir === 'in') {
      setView('portfolio')
    } else {
      setView('room')
    }
    setTransitioning(false)
  }, [transitionDir])

  const handleBackToRoom = useCallback(() => {
    if (transitioning) return
    setActiveProject(null)
    setTransitionDir('out')
    setTransitioning(true)
  }, [transitioning])

  const handleAdminChange = useCallback(({ projects: p, settings: s, content: c }) => {
    if (p) setProjects(p)
    if (s) setSettings(s)
    if (c) setContent(c)
  }, [])

  return (
    <>
      {/* Room is always mounted; hidden behind portfolio when in portfolio view */}
      <div style={{
        position: 'fixed', inset: 0,
        opacity: view === 'room' && !transitioning ? 1 : view === 'room' ? 1 : 0,
        pointerEvents: view === 'room' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 1,
      }}>
        <Room onComputerClick={handleComputerClick} />
      </div>

      {/* Portfolio view */}
      <div style={{
        position: 'fixed', inset: 0,
        opacity: view === 'portfolio' && !transitioning ? 1 : 0,
        pointerEvents: view === 'portfolio' && !transitioning ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 2,
      }}>
        <Portfolio
          projects={projects}
          content={content}
          activeProject={activeProject}
          onProjectClick={setActiveProject}
          onCloseProject={() => setActiveProject(null)}
          onBack={handleBackToRoom}
        />
      </div>

      {/* TV static transition overlay */}
      <StaticTransition
        active={transitioning}
        onComplete={handleTransitionComplete}
      />

      {/* Admin panel — Ctrl+Shift+A, dev only. Never rendered in production. */}
      {import.meta.env.DEV && adminOpen && (
        <Admin
          projects={projects}
          settings={settings}
          content={content}
          onClose={() => setAdminOpen(false)}
          onChange={handleAdminChange}
        />
      )}
    </>
  )
}
