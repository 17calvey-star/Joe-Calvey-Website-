import { useState, useEffect, useRef, useCallback } from 'react'
import roomBg        from '../assets/images/RB.png'
import fanImg        from '../assets/images/FAN.png'
import windowImg     from '../assets/images/WindowWS.png'
import tableOverlayImg from '../assets/images/Tableoverlay.png'
import boxesImg      from '../assets/images/Boxes.png'
import rainAmbient   from '../assets/audio/ambient/WebsiteRain.mp3'
import { VOL_RAIN_ROOM, VOL_RAIN_DESKTOP } from '../config'

// ── Project image globs ───────────────────────────────────────────────────────
const workGlob = import.meta.glob(
  '../assets/images/projects/*/work/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: false }
)
async function loadWorkImages(id, imageOrder = []) {
  const entries = Object.entries(workGlob).filter(([p]) => p.includes(`/${id}/work/`))
  const loaded = await Promise.all(entries.map(async ([path, fn]) => {
    const mod = await fn()
    return { url: mod.default, filename: path.split('/').pop() }
  }))
  if (imageOrder.length > 0) {
    loaded.sort((a, b) => {
      const ai = imageOrder.indexOf(a.filename)
      const bi = imageOrder.indexOf(b.filename)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }
  return loaded.map(l => l.url)
}

const coverGlob = import.meta.glob(
  '../assets/images/projects/*/cover.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: true }
)
function getCoverUrl(id) {
  const entry = Object.entries(coverGlob).find(([p]) => p.includes(`/${id}/cover`))
  return entry ? entry[1].default : null
}

// ── Room constants (mirrors Room.jsx) ─────────────────────────────────────────
const IMG_W = 1402
const IMG_H = 1122
const SCR   = { x: 632, y: 550, w: 136, h: 98 }
const FAN_CX = 1046, FAN_CY = 275, FAN_R = 48
const WIN_X  = 347,  WIN_Y  = 203, WIN_W = 320, WIN_H = 310
const TABLE_X = 448,  TABLE_Y = 400
const TABLE_W = IMG_W - 510, TABLE_H = IMG_H - 510

const RAIN_DROPS = Array.from({ length: 32 }, (_, i) => ({
  x:   (i * 113 + 17) % 275,
  dur: 0.50 + (i % 8) * 0.055,
  dly: (i * 0.09) % 0.85,
  len: 8  + (i % 6) * 3,
  dx:  1  + (i % 3),
  op:  0.18 + (i % 5) * 0.09,
}))

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM = `
@keyframes room-breathe {
  0%,100% { transform: scale(1) translateZ(0); }
  50%      { transform: scale(1.006) translateZ(0); }
}
@keyframes crt-flicker {
  0%,100% { opacity:1; } 4% { opacity:0.86; } 5% { opacity:1; }
  49% { opacity:0.80; } 50% { opacity:0.96; }
  83% { opacity:0.90; } 84% { opacity:1; }
}
@keyframes cursor-blink {
  0%,45% { opacity:1; } 50%,95% { opacity:0; } 100% { opacity:1; }
}
@keyframes phosphor-glow {
  0%,100% { opacity:0.8; } 50% { opacity:1; }
}
@keyframes fan-spin { to { transform: rotate(360deg); } }
@keyframes rain-fall {
  from { transform: translateY(-28px); } to { transform: translateY(85px); }
}
@keyframes mob-static {
  0%   { opacity:0; }
  15%  { opacity:1; background:#eee; }
  30%  { opacity:0.5; background:#000; }
  55%  { opacity:1; background:#ddd; }
  75%  { opacity:0.3; background:#000; }
  100% { opacity:1; background:#000; }
}
@keyframes mob-fade-in {
  from { opacity:0; } to { opacity:1; }
}
@keyframes mob-item-in {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
`

// ── Rich text ─────────────────────────────────────────────────────────────────
function RichText({ text, style }) {
  if (!text) return null
  const parts = text.split(/\*\*(.+?)\*\*/gs)
  return (
    <p style={{ ...style, whiteSpace: 'pre-wrap', margin: 0 }}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} style={{ fontWeight: 700, color: 'inherit' }}>{part}</strong>
          : part
      )}
    </p>
  )
}

// ── Image carousel ────────────────────────────────────────────────────────────
function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0)
  const trackRef = useRef(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el || images.length === 0) return
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [images.length])

  const goTo = useCallback((i) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setIdx(i)
  }, [])

  if (images.length === 0) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(200,200,200,0.25)',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 11, letterSpacing: '0.22em',
      }}>NO IMAGES</div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div ref={trackRef} style={{
        display: 'flex', overflowX: 'scroll',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {images.map((src, i) => (
          <div key={i} style={{ flexShrink: 0, width: '100%', scrollSnapAlign: 'start' }}>
            <img src={src} alt="" style={{
              width: '100%', maxHeight: '56vw',
              objectFit: 'contain', background: '#000', display: 'block',
            }}/>
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0} style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.60)', border: '1px solid rgba(255,255,255,0.15)',
            color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
            width: 36, height: 36, cursor: idx === 0 ? 'default' : 'pointer',
            fontFamily: 'monospace', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <button onClick={() => goTo(Math.min(images.length - 1, idx + 1))} disabled={idx === images.length - 1} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.60)', border: '1px solid rgba(255,255,255,0.15)',
            color: idx === images.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
            width: 36, height: 36, cursor: idx === images.length - 1 ? 'default' : 'pointer',
            fontFamily: 'monospace', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? '#00cc44' : 'rgba(255,255,255,0.25)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}/>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Project detail panel ──────────────────────────────────────────────────────
function ProjectPanel({ project, onClose }) {
  const [images, setImages] = useState([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const cover = getCoverUrl(project.id)
    setImages(cover ? [cover] : [])
    loadWorkImages(project.id, project.imageOrder || []).then(imgs => {
      if (imgs.length > 0) setImages(imgs)
    })
  }, [project.id]) // eslint-disable-line

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 260)
  }, [onClose])

  return (
    <div onClick={handleClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      transition: 'opacity 0.26s ease', opacity: visible ? 1 : 0,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        maxHeight: '90%',
        background: '#0e0c10',
        borderTop: '2px solid #00cc44',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        transition: 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px 11px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 0, background: '#0e0c10', zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#fff', letterSpacing: '0.05em', lineHeight: 1.4 }}>{project.title}</div>
            {project.year && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.16em' }}>{project.year}</div>}
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.5)', width: 34, height: 34,
            cursor: 'pointer', fontSize: 15, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✕</button>
        </div>
        <div style={{ height: 2, background: project.colour || '#00cc44' }}/>
        <div style={{ padding: '14px 0 0' }}>
          <ImageCarousel images={images}/>
        </div>
        {project.brief ? (
          <div style={{ padding: '18px 18px 30px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,204,68,0.6)', letterSpacing: '0.30em', textTransform: 'uppercase', marginBottom: 10 }}>brief</div>
            <RichText text={project.brief} style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13, lineHeight: 1.80, color: 'rgba(220,220,220,0.85)' }}/>
          </div>
        ) : (
          <div style={{ padding: '20px 18px 30px', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em' }}>No description yet.</div>
        )}
        {(project.externalLink || project.pdfUrl) && (
          <div style={{ padding: '0 18px 28px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {project.externalLink && (
              <a href={project.externalLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: '#00cc44', border: '1px solid rgba(0,204,68,0.35)', padding: '10px 16px', textDecoration: 'none' }}>↗ VIEW</a>
            )}
            {project.pdfUrl && (
              <a href={project.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: 'rgba(200,200,200,0.6)', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 16px', textDecoration: 'none' }}>↓ PDF</a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Projects tab ──────────────────────────────────────────────────────────────
function ProjectsSection({ projects }) {
  const [selected, setSelected] = useState(null)
  const visible = projects.filter(p => !p.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (visible.length === 0) {
    return <div style={{ padding: '48px 20px', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textAlign: 'center' }}>NO PROJECTS YET</div>
  }

  return (
    <>
      <div style={{ paddingBottom: 20 }}>
        {visible.map((p, i) => {
          const cover = getCoverUrl(p.id)
          return (
            <button key={p.id} onClick={() => setSelected(p)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '12px 18px',
              background: 'none', border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
              animation: `mob-item-in 0.32s ease-out ${i * 40}ms both`,
            }}
              onTouchStart={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onTouchEnd={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 50, height: 50, flexShrink: 0,
                background: cover ? `url(${cover}) center/cover` : (p.colour || '#333'),
                border: '1px solid rgba(255,255,255,0.10)', overflow: 'hidden',
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#e8e8e8', letterSpacing: '0.04em', lineHeight: 1.5, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {p.year && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.12em' }}>{p.year}</span>}
                  {p.module && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,204,68,0.45)', letterSpacing: '0.10em' }}>{p.module}</span>}
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: 18, fontFamily: 'monospace', flexShrink: 0 }}>›</div>
            </button>
          )
        })}
      </div>
      {selected && <ProjectPanel project={selected} onClose={() => setSelected(null)}/>}
    </>
  )
}

// ── About tab ─────────────────────────────────────────────────────────────────
function AboutSection({ settings }) {
  const about = settings?.about || {}
  const { heading = 'About Me', bio = '', skills = '', cvLabel = '↓ Download CV', cvUrl = '' } = about
  const photos = (about.photos || []).filter(p => p?.src)

  return (
    <div style={{ padding: '20px 18px 80px' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#fff', letterSpacing: '0.08em', marginBottom: 22, marginTop: 0 }}>{heading}</h2>
      {bio ? (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,204,68,0.60)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10 }}>bio</div>
          <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13, lineHeight: 1.80, color: 'rgba(220,220,220,0.85)', margin: 0, whiteSpace: 'pre-wrap' }}>{bio}</p>
        </div>
      ) : null}
      {skills ? (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,204,68,0.60)', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10 }}>skills</div>
          <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 12, lineHeight: 1.76, color: 'rgba(200,200,200,0.60)', margin: 0, whiteSpace: 'pre-wrap' }}>{skills}</p>
        </div>
      ) : null}
      {cvUrl ? (
        <div style={{ marginBottom: 22 }}>
          <a href={cvUrl} download style={{ display: 'inline-block', fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(220,220,220,0.65)', border: '1px solid rgba(255,255,255,0.18)', padding: '11px 18px', textDecoration: 'none' }}>{cvLabel}</a>
        </div>
      ) : null}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {photos.map((photo, i) => (
            <div key={i} style={{ aspectRatio: '4/3', background: '#1a1a1a', overflow: 'hidden' }}>
              <img src={photo.src} alt={photo.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            </div>
          ))}
        </div>
      )}
      {!bio && !skills && (
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', lineHeight: 1.8 }}>About content coming soon.</p>
      )}
    </div>
  )
}

// ── Contact tab ───────────────────────────────────────────────────────────────
function ContactSection({ settings }) {
  const c = settings?.contact || {}
  const mailHref = c.email ? `mailto:${c.email}` : null
  const liHref   = c.linkedin  ? (c.linkedin.startsWith('http')  ? c.linkedin  : `https://linkedin.com/in/${c.linkedin.replace(/^.*\/in\//, '')}`) : null
  const igHref   = c.instagram ? (c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@/, '')}`) : null
  const portHref = c.portfolio ? (c.portfolio.startsWith('http') ? c.portfolio : `https://${c.portfolio}`) : null
  const hasDetails = !!(c.name || c.email || c.phone || c.location)
  const hasLinks   = !!(c.linkedin || c.instagram || c.portfolio)

  function Row({ label, value, href }) {
    if (!value) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(0,204,68,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{label}</span>
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#ccc', textDecoration: 'none', wordBreak: 'break-all' }}>{value}</a>
          : <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: '#ccc', wordBreak: 'break-all' }}>{value}</span>
        }
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 18px 80px' }}>
      <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#fff', letterSpacing: '0.08em', marginBottom: 22, marginTop: 0 }}>Contact</h2>
      {c.message && <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13, lineHeight: 1.78, color: 'rgba(220,220,220,0.80)', margin: '0 0 22px' }}>{c.message}</p>}
      {hasDetails && <><Row label="name" value={c.name}/><Row label="email" value={c.email} href={mailHref}/><Row label="phone" value={c.phone} href={c.phone ? `tel:${c.phone}` : null}/><Row label="location" value={c.location}/></>}
      {hasLinks && <><Row label="linkedin" value={c.linkedin} href={liHref}/><Row label="instagram" value={c.instagram} href={igHref}/><Row label="portfolio" value={c.portfolio} href={portHref}/></>}
      {!c.message && !hasDetails && !hasLinks && (
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', lineHeight: 1.8, margin: 0 }}>Contact details coming soon.</p>
      )}
    </div>
  )
}

// ── Mobile desktop OS ─────────────────────────────────────────────────────────
function MobileDesktop({ projects, settings, onExit }) {
  const [tab, setTab] = useState('projects')
  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [tab])

  const TABS = [
    { id: 'projects', label: 'PROJECTS' },
    { id: 'about',    label: 'ABOUT'    },
    { id: 'contact',  label: 'CONTACT'  },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #0a0a1e 0%, #0e1020 55%, #080808 100%)',
      display: 'flex', flexDirection: 'column',
      animation: 'mob-fade-in 0.28s ease both',
    }}>
      {/* Title bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 11px',
        background: 'linear-gradient(180deg, #1e1e38 0%, #14142a 100%)',
        borderBottom: '2px solid #3030a0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 11, height: 11, background: 'linear-gradient(135deg, #4080ff, #8040ff)', border: '1px solid rgba(255,255,255,0.3)' }}/>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#c0c0e0', letterSpacing: 1 }}>Calvey v1.0</span>
        </div>
        <button onClick={onExit} style={{
          background: 'linear-gradient(180deg, #2a2a4a, #1a1a34)',
          border: '2px solid #5050c0',
          color: '#c0c0e0', padding: '4px 10px',
          fontFamily: "'Press Start 2P', monospace", fontSize: 6,
          cursor: 'pointer', letterSpacing: 1,
        }}>▶ HOME</button>
      </div>

      {/* Tab nav */}
      <div style={{
        flexShrink: 0, display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#0b0b1a',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '11px 4px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.16em',
            color: tab === t.id ? '#6060ff' : 'rgba(192,192,224,0.45)',
            borderBottom: tab === t.id ? '2px solid #6060ff' : '2px solid transparent',
            marginBottom: -1,
            transition: 'color 0.15s, border-color 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div ref={contentRef} key={tab} style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        animation: 'mob-fade-in 0.22s ease both',
        color: '#d0d0d0',
      }}>
        {tab === 'projects' && <ProjectsSection projects={projects}/>}
        {tab === 'about'    && <AboutSection    settings={settings}/>}
        {tab === 'contact'  && <ContactSection  settings={settings}/>}
      </div>

      {/* Taskbar */}
      <div style={{
        flexShrink: 0, padding: '9px 14px',
        background: 'rgba(0,0,0,0.55)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.15em', color: 'rgba(200,200,200,0.32)', whiteSpace: 'nowrap' }}>
          For the best experience, use a computer.
        </span>
      </div>
    </div>
  )
}

// ── Simplified mobile room ────────────────────────────────────────────────────
function MobileRoom({ onEnter, entering }) {
  const [hovered,   setHovered]   = useState(false)
  const [flickerOp, setFlickerOp] = useState(1)
  const timerRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      setFlickerOp(0.70 + Math.random() * 0.30)
      setTimeout(() => setFlickerOp(1), 55 + Math.random() * 90)
      timerRef.current = setTimeout(tick, 2000 + Math.random() * 6000)
    }
    timerRef.current = setTimeout(tick, 1400 + Math.random() * 3000)
    return () => clearTimeout(timerRef.current)
  }, [])

  const cx  = SCR.x + SCR.w / 2
  const cy  = SCR.y + SCR.h / 2
  const fs  = Math.round(SCR.w * 0.073)
  const fsB = Math.round(SCR.w * 0.095)
  const wx  = WIN_X + 26, wy = WIN_Y + 78

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#09070a', overflow: 'hidden' }}>
      <style>{ANIM}</style>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'center', paddingTop: '5vw',
        pointerEvents: 'none', animation: 'mob-fade-in 1.2s ease both',
      }}>
        <span style={{
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontWeight: 600, fontSize: 'clamp(12px, 3.5vw, 20px)',
          color: '#fff', letterSpacing: '0.30em', textTransform: 'uppercase',
          textShadow: '0 2px 14px rgba(0,0,0,1)',
          background: 'rgba(0,0,0,0.42)', padding: '6px 22px',
        }}>Joe Calvey Portfolio</span>
      </div>

      {/* Room — breathe animation */}
      <div style={{
        position: 'absolute', inset: '-1.5%',
        transformOrigin: '50% 52%',
        animation: 'room-breathe 9s ease-in-out infinite',
      }}>
        <svg
          viewBox="320 100 760 1000"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Background */}
          <image href={roomBg} x={0} y={0} width={IMG_W} height={IMG_H}/>

          {/* Window rain (atmosphere only, non-interactive) */}
          <clipPath id="mob-win-clip">
            <rect x={wx} y={wy} width={275} height={70}/>
          </clipPath>
          <g clipPath="url(#mob-win-clip)" style={{ pointerEvents: 'none' }}>
            <rect x={wx} y={wy} width={275} height={70} fill="#04060c"/>
            {RAIN_DROPS.map((d, i) => (
              <line key={i}
                x1={wx + d.x} y1={wy} x2={wx + d.x + d.dx} y2={wy + d.len}
                stroke={`rgba(160,185,215,${d.op})`} strokeWidth="0.7" strokeLinecap="round"
                style={{ animation: `rain-fall ${d.dur}s linear ${d.dly}s infinite`, transformBox: 'fill-box', transformOrigin: 'top center' }}
              />
            ))}
          </g>
          <image href={windowImg} x={WIN_X} y={WIN_Y} width={WIN_W} height={WIN_H} preserveAspectRatio="none" style={{ pointerEvents: 'none', filter: 'brightness(0.58) contrast(1.10) saturate(0.80)' }}/>

          {/* Fan (atmospheric only — no click) */}
          <circle cx={FAN_CX} cy={FAN_CY} r={FAN_R - 3} fill="#0c0b07" style={{ pointerEvents: 'none' }}/>
          <image href={fanImg}
            x={FAN_CX - (FAN_R + 49)} y={FAN_CY - (FAN_R + 49)}
            width={(FAN_R + 49) * 2} height={(FAN_R + 49) * 2}
            style={{ pointerEvents: 'none', animation: `fan-spin 5s linear infinite`, transformBox: 'fill-box', transformOrigin: 'center' }}
          />

          {/* Boxes (atmospheric) */}
          <image href={boxesImg} x={0} y={590} width={520} height={500} preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none', filter: 'brightness(0.68)' }}/>

          {/* Table overlay */}
          <image href={tableOverlayImg} x={TABLE_X} y={TABLE_Y} width={TABLE_W} height={TABLE_H} preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }}/>

          {/* ── CRT screen ────────────────────────────────────────────────────── */}
          <defs>
            <pattern id="mob-crt-scan" x="0" y="0" width={SCR.w} height="5"
              patternUnits="userSpaceOnUse" patternTransform={`translate(${SCR.x},${SCR.y})`}>
              <rect width={SCR.w} height="2" fill="rgba(0,0,0,0.16)"/>
            </pattern>
            <radialGradient id="mob-crt-vig" cx="50%" cy="50%" r="62%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="black" stopOpacity="0"/>
              <stop offset="48%"  stopColor="black" stopOpacity="0"/>
              <stop offset="100%" stopColor="black" stopOpacity="0.72"/>
            </radialGradient>
            <linearGradient id="mob-phosphor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#020c03"/>
              <stop offset="50%"  stopColor="#040e06"/>
              <stop offset="100%" stopColor="#020c03"/>
            </linearGradient>
            <radialGradient id="mob-hover-bloom" cx="50%" cy="50%" r="65%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#00ff55" stopOpacity="0.07"/>
              <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
            </radialGradient>
            <filter id="mob-idle-glow" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0   0 1 0 0 0.45   0 0 0 0 0   0 0 0 0.3 0" result="glow"/>
              <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="mob-hover-glow" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0   0 1 0 0 0.72   0 0 0 0 0   0 0 0 0.70 0" result="glow"/>
              <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="mob-chroma" x="-5%" y="-5%" width="110%" height="110%">
              <feOffset in="SourceGraphic" dx="-1" dy="0" result="r"/>
              <feOffset in="SourceGraphic" dx="1"  dy="0" result="b"/>
              <feColorMatrix in="r" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>
              <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>
              <feMerge><feMergeNode in="red"/><feMergeNode in="blue"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <clipPath id="mob-scr-clip">
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx="5" ry="4"/>
            </clipPath>
          </defs>

          <g
            style={{ cursor: 'pointer' }}
            onClick={onEnter}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            filter={hovered ? 'url(#mob-hover-glow)' : 'url(#mob-idle-glow)'}
          >
            <g clipPath="url(#mob-scr-clip)">
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                fill={hovered ? '#050f07' : '#030c04'}
                style={{ animation: 'crt-flicker 11s ease-in-out infinite' }}/>
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} fill="url(#mob-phosphor)" opacity="0.55" style={{ pointerEvents: 'none' }}/>
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} fill="url(#mob-crt-scan)" style={{ pointerEvents: 'none' }}/>
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} fill="url(#mob-crt-vig)"  style={{ pointerEvents: 'none' }}/>
              <g style={{ pointerEvents: 'none' }} opacity={flickerOp}>
                <text x={cx} y={cy - fsB * 0.55} textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Press Start 2P', monospace" fontSize={fsB}
                  fill={hovered ? '#00dd44' : '#009e32'} filter="url(#mob-chroma)"
                  style={{ animation: 'phosphor-glow 2s ease-in-out infinite', transition: 'fill 0.14s ease' }}
                >TAP</text>
                <text x={cx} y={cy + fsB * 0.95} textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Press Start 2P', monospace" fontSize={fsB}
                  fill={hovered ? '#00dd44' : '#009e32'} filter="url(#mob-chroma)"
                  style={{ animation: 'phosphor-glow 2s ease-in-out infinite', transition: 'fill 0.14s ease' }}
                >TO ENTER</text>
                <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                  fill="url(#mob-hover-bloom)" opacity={hovered ? 1 : 0}
                  style={{ pointerEvents: 'none', transition: 'opacity 0.14s ease' }}/>
              </g>
            </g>
            <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx="5" ry="4"
              fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2" style={{ pointerEvents: 'none' }}/>
          </g>

          {/* Larger invisible touch target (finger-friendly) */}
          <rect
            x={SCR.x - 40} y={SCR.y - 40}
            width={SCR.w + 80} height={SCR.h + 80}
            fill="transparent" style={{ cursor: 'pointer' }}
            onClick={onEnter}
          />
        </svg>
      </div>

      {/* Static transition flash */}
      {entering && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: '#000',
          animation: 'mob-static 0.55s ease-out both',
          pointerEvents: 'none',
        }}/>
      )}

      {/* Bottom banner */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '10px 16px', textAlign: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(200,200,200,0.32)', whiteSpace: 'nowrap' }}>
          For the best experience, use a computer.
        </span>
      </div>
    </div>
  )
}

// ── Main MobileApp ────────────────────────────────────────────────────────────
export default function MobileApp({ projects, settings }) {
  const [view,     setView]     = useState('room')
  const [entering, setEntering] = useState(false)
  const rainRef = useRef(null)

  // Rain ambient
  useEffect(() => {
    const audio = new Audio(rainAmbient)
    audio.loop   = true
    audio.volume = 0
    rainRef.current = audio
    let started = false

    const targetVol = () => view === 'desktop' ? VOL_RAIN_DESKTOP : VOL_RAIN_ROOM * 0.75

    const fadeIn = () => {
      let v = 0
      const vol = targetVol()
      const step = () => { v = Math.min(v + 0.008, vol); audio.volume = v; if (v < vol) setTimeout(step, 40) }
      step()
    }

    const removeListeners = () => {
      document.removeEventListener('pointerdown', onGesture) // eslint-disable-line
      document.removeEventListener('touchstart',  onGesture) // eslint-disable-line
    }
    const onGesture = () => {
      if (started) return; started = true; removeListeners()
      audio.play().then(fadeIn).catch(() => { started = false })
    }
    document.addEventListener('pointerdown', onGesture)
    document.addEventListener('touchstart',  onGesture)
    audio.play().then(() => { started = true; removeListeners(); fadeIn() }).catch(() => {})

    const onVis = () => {
      if (document.hidden) audio.pause()
      else if (started) audio.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      removeListeners()
      document.removeEventListener('visibilitychange', onVis)
      audio.pause(); audio.src = ''; rainRef.current = null
    }
  }, []) // eslint-disable-line

  // Fade rain volume on view change
  useEffect(() => {
    const audio = rainRef.current
    if (!audio) return
    const target = view === 'desktop' ? VOL_RAIN_DESKTOP : VOL_RAIN_ROOM * 0.75
    const step = () => {
      const diff = target - audio.volume
      if (Math.abs(diff) < 0.004) { audio.volume = target; return }
      audio.volume = Math.max(0, Math.min(1, audio.volume + diff * 0.10))
      setTimeout(step, 30)
    }
    step()
  }, [view])

  const handleEnter = useCallback(() => {
    if (entering) return
    setEntering(true)
    setTimeout(() => { setView('desktop'); setEntering(false) }, 520)
  }, [entering])

  if (view === 'room') {
    return <MobileRoom onEnter={handleEnter} entering={entering}/>
  }
  return <MobileDesktop projects={projects} settings={settings} onExit={() => setView('room')}/>
}
