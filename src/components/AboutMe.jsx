import { useState, useEffect } from 'react'

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM = `
@keyframes book-backdrop {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes book-open {
  0%   { opacity: 0; transform: scale(0.92) translateY(16px); filter: blur(3px); }
  100% { opacity: 1; transform: scale(1)    translateY(0px);  filter: blur(0px); }
}
@keyframes right-page-unfold {
  0%   { transform: scaleX(0.04); opacity: 0; }
  35%  { opacity: 1;              }
  100% { transform: scaleX(1);    opacity: 1; }
}
@keyframes page-item {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: translateY(0);   }
}
`

// ── Right-page photos ─────────────────────────────────────────────────────────
// src: null  → placeholder polaroid frame
// src: '/path/to/img.jpg' → real photo
// rotate: tilt angle in degrees
// Future: wire these to settings.aboutPhotos via Admin panel
const PHOTOS = [
  { src: null, caption: '', rotate: -3.0 },
  { src: null, caption: '', rotate:  2.5 },
  { src: null, caption: '', rotate: -1.5 },
  { src: null, caption: '', rotate:  2.0 },
]

// ── Section label + content ───────────────────────────────────────────────────
function Section({ label, children, delay = 0 }) {
  return (
    <div style={{
      marginBottom: 20,
      animation: `page-item 0.4s ease-out ${delay}ms both`,
    }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 8,
        color: 'rgba(130,78,22,0.62)',
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        marginBottom: 7,
        paddingBottom: 4,
        borderBottom: '1px solid rgba(130,78,22,0.13)',
      }}>{label}</div>
      {children}
    </div>
  )
}

// ── Inline link row ───────────────────────────────────────────────────────────
function LinkRow({ label, value, href }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'baseline',
      marginBottom: 6,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 11,
    }}>
      <span style={{ color: 'rgba(110,65,18,0.42)', minWidth: 76, fontSize: 9 }}>
        {label}
      </span>
      {href ? (
        <a
          href={href} target="_blank" rel="noopener noreferrer"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            color: hov ? '#3e1400' : '#622c0e',
            textDecoration: 'none',
            borderBottom: `1px solid rgba(90,38,10,${hov ? 0.48 : 0.18})`,
            transition: 'color 0.12s, border-color 0.12s',
          }}
        >{value}</a>
      ) : (
        <span style={{ color: '#552a10' }}>{value || '—'}</span>
      )}
    </div>
  )
}

// ── Polaroid card ─────────────────────────────────────────────────────────────
function Polaroid({ photo, delay }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#f9f5ef',
        padding: '7px 7px 28px',
        boxShadow: hov
          ? '0 8px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.14)'
          : '0 3px 12px rgba(0,0,0,0.20), 0 1px 3px rgba(0,0,0,0.10)',
        transform: `rotate(${hov ? 0 : photo.rotate}deg) ${hov ? 'translateY(-3px)' : ''}`,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        animation: `page-item 0.4s ease-out ${delay}ms both`,
        flexShrink: 0,
        cursor: 'default',
      }}
    >
      {/* Image / placeholder */}
      <div style={{
        width: 136, height: 104,
        background: photo.src ? undefined : '#c4bab0',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {photo.src ? (
          <img src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, color: 'rgba(60,48,38,0.35)', letterSpacing: '0.22em',
          }}>PHOTO</span>
        )}
      </div>
      {/* Caption */}
      {photo.caption && (
        <div style={{
          paddingTop: 5, textAlign: 'center',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 8, color: 'rgba(55,38,18,0.42)', letterSpacing: '0.12em',
        }}>{photo.caption}</div>
      )}
    </div>
  )
}

// ── About Me — open book ──────────────────────────────────────────────────────
export default function AboutMe({ onClose, settings }) {
  const [mounted,   setMounted]   = useState(false)
  const [closeHov, setCloseHov] = useState(false)

  const about = settings?.about || {}
  const heading       = about.heading       || 'About Me'
  const photosHeading = about.photosHeading || 'Photos'
  const bio           = about.bio           || "Hi, I'm Joe Calvey — a creative designer and developer."
  const skills        = about.skills        || ''
  const cvLabel       = about.cvLabel       || '↓ download cv.pdf'
  const cvUrl         = about.cvUrl         || ''
  const photos        = (about.photos && about.photos.length > 0) ? about.photos : PHOTOS

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mounted) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'book-backdrop 0.35s ease both',
        cursor: 'pointer',
      }}
    >
      <style>{ANIM}</style>

      {/* ════════════════════════════════════════════════════════════════════════
          Open book
      ════════════════════════════════════════════════════════════════════════ */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          display: 'flex',
          width:  'min(92vw, 1080px)',
          height: 'min(80vh,  650px)',
          animation: 'book-open 0.48s cubic-bezier(0.22, 1, 0.36, 1) both',
          boxShadow: '0 48px 140px rgba(0,0,0,0.90), 0 18px 55px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.35)',
          cursor: 'default',
        }}
      >

        {/* ── Left cover edge (purple book spine folded back) ─────────────── */}
        <div style={{
          width: 7, flexShrink: 0,
          background: 'linear-gradient(to right, #1e1032 0%, #3d2268 60%, #4a2a82 100%)',
          boxShadow: '-1px 0 10px rgba(0,0,0,0.6)',
        }} />

        {/* ════════════════════════════════════════════════════════════════════
            LEFT PAGE — text content
        ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '0 0 calc(50% - 18px)',
          position: 'relative',
          background: 'linear-gradient(158deg, #f6eddc 0%, #f0e5ca 48%, #ece0c4 82%, #f3e9d3 100%)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '34px 30px 30px 40px',
          boxShadow: 'inset -12px 0 28px rgba(0,0,0,0.07)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(120,82,25,0.22) transparent',
        }}>
          {/* Ruled lines */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 26px, rgba(125,80,22,0.055) 26px, rgba(125,80,22,0.055) 27px)',
            backgroundPositionY: '62px',
          }} />
          {/* Red margin rule */}
          <div style={{
            position: 'absolute', left: 40, top: 0, bottom: 0,
            width: 1, background: 'rgba(195,62,52,0.14)', pointerEvents: 'none',
          }} />
          {/* Worn left edge */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: 16,
            background: 'linear-gradient(to right, rgba(0,0,0,0.10), transparent)',
            pointerEvents: 'none',
          }} />

          {/* ── Content ───────────────────────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1 }}>

            <div style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontWeight: 800, fontSize: 21,
              color: '#281606',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: 20,
              paddingBottom: 10,
              borderBottom: '2px solid rgba(105,60,15,0.16)',
              animation: 'page-item 0.38s ease-out 200ms both',
            }}>{heading}</div>

            <Section label="bio" delay={280}>
              <p style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: 13, lineHeight: 1.80, color: '#362210', margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {bio}
              </p>
            </Section>

            {cvUrl && (
              <Section label="cv / download" delay={360}>
                <a
                  href={cvUrl} download
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10, letterSpacing: '0.14em',
                    color: 'rgba(95,48,10,0.68)',
                    border: '1px solid rgba(130,80,16,0.24)',
                    padding: '6px 16px', textDecoration: 'none',
                    transition: 'all 0.14s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#3e1400'
                    e.currentTarget.style.borderColor = 'rgba(130,80,16,0.52)'
                    e.currentTarget.style.background = 'rgba(130,80,16,0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(95,48,10,0.68)'
                    e.currentTarget.style.borderColor = 'rgba(130,80,16,0.24)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >{cvLabel}</a>
              </Section>
            )}

            {skills && (
              <Section label="skills" delay={520}>
                <p style={{
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontSize: 12, lineHeight: 1.76,
                  color: 'rgba(52,32,12,0.60)', margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {skills}
                </p>
              </Section>
            )}

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SPINE / GUTTER
        ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          width: 36, flexShrink: 0,
          background: 'linear-gradient(to right, rgba(12,6,2,0.28) 0%, rgba(12,6,2,0.08) 38%, rgba(12,6,2,0.08) 62%, rgba(12,6,2,0.28) 100%)',
          position: 'relative',
        }}>
          {/* Centre fold thread */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%',
            width: 1, background: 'rgba(0,0,0,0.09)',
          }} />
          {/* Subtle stitch dots */}
          {[12, 24, 36, 48, 60, 72, 85, 97].map(pct => (
            <div key={pct} style={{
              position: 'absolute', left: '50%', top: `${pct}%`,
              width: 3, height: 3, borderRadius: '50%',
              background: 'rgba(0,0,0,0.12)',
              transform: 'translate(-50%, -50%)',
            }} />
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT PAGE — photos
            transformOrigin: left → scaleX unfold plays from the spine outward
        ════════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: '1 0 0',
          position: 'relative',
          background: 'linear-gradient(158deg, #ede5cf 0%, #e8dcc6 48%, #e3d8c0 82%, #ece2cb 100%)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '34px 34px 30px 28px',
          boxShadow: 'inset 12px 0 28px rgba(0,0,0,0.05)',
          transformOrigin: 'left center',
          animation: 'right-page-unfold 0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.20s both',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(120,82,25,0.22) transparent',
        }}>
          {/* Worn right edge */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: 16,
            background: 'linear-gradient(to left, rgba(0,0,0,0.10), transparent)',
            pointerEvents: 'none',
          }} />

          {/* Photos heading */}
          <div style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontWeight: 800, fontSize: 14,
            color: '#281606',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 22,
            paddingBottom: 9,
            borderBottom: '1px solid rgba(105,60,15,0.14)',
            animation: 'page-item 0.38s ease-out 400ms both',
          }}>{photosHeading}</div>

          {/* Polaroid grid */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            alignContent: 'flex-start',
          }}>
            {photos.map((p, i) => (
              <Polaroid key={i} photo={p} delay={460 + i * 65} />
            ))}
          </div>
        </div>

        {/* ── Right cover edge (purple book spine folded back) ────────────── */}
        <div style={{
          width: 7, flexShrink: 0,
          background: 'linear-gradient(to left, #1e1032 0%, #3d2268 60%, #4a2a82 100%)',
          boxShadow: '1px 0 10px rgba(0,0,0,0.6)',
        }} />

        {/* ── Close button ────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          onMouseEnter={() => setCloseHov(true)}
          onMouseLeave={() => setCloseHov(false)}
          style={{
            position: 'absolute', bottom: 12, left: '50%',
            transform: 'translateX(-50%)',
            background: closeHov ? 'rgba(40,20,6,0.08)' : 'transparent',
            border: `1px solid rgba(120,75,18,${closeHov ? 0.42 : 0.20})`,
            color: closeHov ? '#3a1600' : 'rgba(95,55,16,0.46)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, letterSpacing: '0.16em',
            padding: '5px 18px',
            cursor: 'pointer',
            transition: 'all 0.14s',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >✕ close book</button>

      </div>
    </div>
  )
}
