import { useState, useEffect } from 'react'
import ventsImg from '../assets/images/VentsWB.png'

// ── Clue number position — adjust these until it lines up with the image ──────
const CLUE_RIGHT  = 'calc(18% - 20px)'   // distance from right edge
const CLUE_TOP    = '45%'   // distance from top
const CLUE_SIZE   = 50      // font size in px
const CLUE_COLOR  = 'rgba(140, 140, 140, 0.28)' // worn grey — scratched into the metal

const ANIM = `
@keyframes fan-shadow-cw {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}
@keyframes vent-in {
  0%   { opacity: 0; filter: brightness(0); }
  60%  { opacity: 1; filter: brightness(0.8); }
  100% { opacity: 1; filter: brightness(1); }
}
@keyframes vent-btn-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes room-pulse {
  0%,100% { opacity: 1.00; }
  18%      { opacity: 0.88; }
  44%      { opacity: 1.00; }
  71%      { opacity: 0.92; }
}
`

export default function VentPage({ onClose }) {
  const [mounted, setMounted] = useState(false)
  const [btnHov,  setBtnHov]  = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 55)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mounted) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      overflow: 'hidden',
      animation: 'vent-in 0.7s cubic-bezier(0.2, 0, 0.3, 1) both',
    }}>
      <style>{ANIM}</style>

      {/* ── 1. Vent image — moderate brightness so lit areas show detail ─────── */}
      <img
        src={ventsImg}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
          filter: 'brightness(0.65) contrast(1.08)',
          animation: 'room-pulse 5.5s ease-in-out infinite',
        }}
      />

      {/* ── 2. Clue number — right wall, sits BELOW the fan shadow ─────────── */}
      {/* Rendered before the shadow overlay so blade darkness covers it,       */}
      {/* making it only visible when the light gap sweeps past.               */}
      <div style={{
        position: 'absolute',
        right: CLUE_RIGHT,
        top:   CLUE_TOP,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: CLUE_SIZE,
        color: CLUE_COLOR,
        fontWeight: 700,
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        textShadow: '0 0 6px rgba(160, 160, 160, 0.15)',
      }}>4</div>

      {/* ── 3. Rotating 4-blade shadow ──────────────────────────────────────── */}
      {/*                                                                        */}
      {/* Using vmax so the div is always a SQUARE regardless of screen ratio.  */}
      {/* With % inset the div inherits the viewport aspect ratio → horizontal  */}
      {/* blades extend further than vertical ones → two blades appear to stop  */}
      {/* short. A square 220vmax div gives equal reach in all four directions. */}
      {/*                                                                        */}
      {/* Donut mask: hides the pointed tips near centre so each gap sweeps as  */}
      {/* a curved arc band rather than a pie-slice wedge.                      */}
      <div style={{
        position: 'absolute',
        width: '220vmax', height: '220vmax',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `conic-gradient(
            from 0deg at 50% 50%,

            /* Blade 1 — 28° */
            rgba(0,0,0,0.70)  0deg,
            rgba(0,0,0,0.70) 22deg,
            rgba(0,0,0,0.28) 28deg,
            /* Gap 1 — 62° */
            rgba(0,0,0,0.03) 33deg,
            rgba(0,0,0,0.00) 37deg,
            rgba(0,0,0,0.00) 78deg,
            rgba(0,0,0,0.03) 82deg,
            rgba(0,0,0,0.28) 87deg,

            /* Blade 2 — 28° */
            rgba(0,0,0,0.70) 92deg,
            rgba(0,0,0,0.70) 112deg,
            rgba(0,0,0,0.28) 118deg,
            /* Gap 2 — 62° */
            rgba(0,0,0,0.03) 123deg,
            rgba(0,0,0,0.00) 127deg,
            rgba(0,0,0,0.00) 168deg,
            rgba(0,0,0,0.03) 172deg,
            rgba(0,0,0,0.28) 177deg,

            /* Blade 3 — 28° */
            rgba(0,0,0,0.70) 182deg,
            rgba(0,0,0,0.70) 202deg,
            rgba(0,0,0,0.28) 208deg,
            /* Gap 3 — 62° */
            rgba(0,0,0,0.03) 213deg,
            rgba(0,0,0,0.00) 217deg,
            rgba(0,0,0,0.00) 258deg,
            rgba(0,0,0,0.03) 262deg,
            rgba(0,0,0,0.28) 267deg,

            /* Blade 4 — 28° */
            rgba(0,0,0,0.70) 272deg,
            rgba(0,0,0,0.70) 292deg,
            rgba(0,0,0,0.28) 298deg,
            /* Gap 4 — 62° */
            rgba(0,0,0,0.03) 303deg,
            rgba(0,0,0,0.00) 307deg,
            rgba(0,0,0,0.00) 348deg,
            rgba(0,0,0,0.03) 352deg,
            rgba(0,0,0,0.28) 357deg,
            rgba(0,0,0,0.70) 360deg
          )`,
          animation: 'fan-shadow-cw 5s linear infinite',
          transformOrigin: '50% 50%',
          maskImage:
            'radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 16%, black 100%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 16%, black 100%)',
        }} />
      </div>

      {/* ── 3. Fixed centre darkener — covers the donut hole + adds tunnel depth ─ */}
      {/* Fades to transparent before it reaches the screen edge so the fan         */}
      {/* effect dominates in the outer region.                                     */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.50) 16%, transparent 34%)',
        pointerEvents: 'none',
      }} />

      {/* ── 5. Back button — bottom right ───────────────────────────────────── */}
      <button
        onClick={onClose}
        onMouseEnter={() => setBtnHov(true)}
        onMouseLeave={() => setBtnHov(false)}
        style={{
          position: 'absolute', bottom: 28, right: 28,
          background:    btnHov ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.55)',
          border:        `1px solid ${btnHov ? 'rgba(180,180,180,0.5)' : 'rgba(100,100,100,0.35)'}`,
          color:         btnHov ? 'rgba(220,220,220,0.92)' : 'rgba(160,160,160,0.55)',
          fontFamily:    "'Share Tech Mono', monospace",
          fontSize:      11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding:       '9px 22px',
          cursor:        'pointer',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition:    'all 0.18s ease',
          animation:     'vent-btn-in 0.4s ease-out 600ms both',
        }}
      >← back</button>
    </div>
  )
}
