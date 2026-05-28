import { useState, useEffect } from 'react'

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM = `
@keyframes contact-paper-in {
  from { opacity: 0; transform: translateY(-14px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)     scale(1);    }
}
@keyframes contact-paper-item-in {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: translateY(0);   }
}
`

// ── Paper section ─────────────────────────────────────────────────────────────
function PaperSection({ label, children, delay = 0 }) {
  return (
    <div style={{
      marginBottom: 26,
      animation: `contact-paper-item-in 0.45s ease-out ${delay}ms both`,
    }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 9,
        color: '#9b6b22',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        marginBottom: 9,
        paddingBottom: 5,
        borderBottom: '1px solid rgba(150,100,30,0.22)',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, href }) {
  const [hov, setHov] = useState(false)
  if (!value) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 12,
      marginBottom: 7,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 12,
    }}>
      <span style={{ color: 'rgba(130,80,20,0.55)', minWidth: 88, fontSize: 10 }}>{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            color: hov ? '#5a2000' : '#7a3800',
            textDecoration: 'none',
            borderBottom: `1px solid rgba(120,55,10,${hov ? 0.55 : 0.25})`,
            transition: 'color 0.15s, border-color 0.15s',
            wordBreak: 'break-all',
          }}
        >{value}</a>
      ) : (
        <span style={{ color: '#5a3018', wordBreak: 'break-all' }}>{value}</span>
      )}
    </div>
  )
}

// ── Contact page (paper panel) ────────────────────────────────────────────────
export default function Contact({ onClose, settings }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const c = settings?.contact || {}

  // While waiting for mount, render nothing (room stays visible through App)
  if (!mounted) return null

  // Derived display flags
  const hasDetails = !!(c.name || c.email || c.phone || c.location)
  const hasLinks   = !!(c.linkedin || c.instagram || c.portfolio)
  const isEmpty    = !c.message && !hasDetails && !hasLinks

  // Staggered delays
  const d0 = 130
  const d1 = c.message ? d0 + 110 : d0
  const d2 = d1 + 110

  // Normalise URLs
  const mailHref = c.email     ? `mailto:${c.email}` : null
  const liHref   = c.linkedin
    ? (c.linkedin.startsWith('http')  ? c.linkedin  : `https://linkedin.com/in/${c.linkedin.replace(/^.*\/in\//, '')}`)
    : null
  const igHref   = c.instagram
    ? (c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@/, '')}`)
    : null
  const portHref = c.portfolio
    ? (c.portfolio.startsWith('http') ? c.portfolio : `https://${c.portfolio}`)
    : null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <style>{ANIM}</style>

      {/* ── Paper panel ───────────────────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(580px, 74vw)',
          maxHeight: '78vh',
          overflowY: 'auto',
          background: 'linear-gradient(155deg, #f7efdc 0%, #f1e5cc 40%, #ede0c5 80%, #f3e9d4 100%)',
          boxShadow: '0 28px 90px rgba(0,0,0,0.72), 0 6px 24px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.55)',
          border: '1px solid rgba(160,110,40,0.22)',
          padding: '38px 44px 36px',
          animation: 'contact-paper-in 0.32s ease-out both',
          cursor: 'default',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(160,110,40,0.28) transparent',
        }}
      >
        {/* Subtle ruled lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(150,100,30,0.07) 27px, rgba(150,100,30,0.07) 28px)',
          backgroundPositionY: '66px',
        }} />

        {/* Left margin rule */}
        <div style={{
          position: 'absolute', left: 44, top: 0, bottom: 0,
          width: 1,
          background: 'rgba(200,80,70,0.13)',
          pointerEvents: 'none',
        }} />

        {/* ── Close button ────────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none',
            border: '1px solid rgba(140,90,20,0.28)',
            color: 'rgba(110,60,10,0.55)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            zIndex: 2,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#5a2000'
            e.currentTarget.style.borderColor = 'rgba(140,90,20,0.55)'
            e.currentTarget.style.background = 'rgba(140,90,20,0.07)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(110,60,10,0.55)'
            e.currentTarget.style.borderColor = 'rgba(140,90,20,0.28)'
            e.currentTarget.style.background = 'none'
          }}
        >✕ close</button>

        {/* ── Paper title ─────────────────────────────────────────────────────── */}
        <div style={{
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: '#2a1a08',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 26,
          paddingBottom: 14,
          borderBottom: '2px solid rgba(140,90,20,0.2)',
          animation: 'contact-paper-item-in 0.4s ease-out 60ms both',
          position: 'relative', zIndex: 1,
        }}>Contact</div>

        {/* ── Intro message ───────────────────────────────────────────────────── */}
        {c.message && (
          <PaperSection label="message" delay={d0}>
            <p style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 14, lineHeight: 1.76,
              color: '#3a2510', margin: 0,
              position: 'relative', zIndex: 1,
            }}>{c.message}</p>
          </PaperSection>
        )}

        {/* ── Contact details ─────────────────────────────────────────────────── */}
        {hasDetails && (
          <PaperSection label="get in touch" delay={d1}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <InfoRow label="name"     value={c.name}     />
              <InfoRow label="email"    value={c.email}    href={mailHref} />
              <InfoRow label="phone"    value={c.phone}    href={c.phone ? `tel:${c.phone}` : null} />
              <InfoRow label="location" value={c.location} />
            </div>
          </PaperSection>
        )}

        {/* ── Social links ────────────────────────────────────────────────────── */}
        {hasLinks && (
          <PaperSection label="links" delay={d2}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <InfoRow label="linkedin"  value={c.linkedin}  href={liHref}  />
              <InfoRow label="instagram" value={c.instagram} href={igHref}  />
              <InfoRow label="portfolio" value={c.portfolio} href={portHref}/>
            </div>
          </PaperSection>
        )}

        {/* ── Fallback ────────────────────────────────────────────────────────── */}
        {isEmpty && (
          <PaperSection label="get in touch" delay={d0}>
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 12, lineHeight: 1.8,
              color: 'rgba(90,55,14,0.5)', margin: 0,
              position: 'relative', zIndex: 1,
            }}>
              Contact details coming soon.<br />
              Edit via the admin panel (Ctrl+Shift+A).
            </p>
          </PaperSection>
        )}
      </div>
    </div>
  )
}
