import { useState, useCallback } from 'react'

// ── Change this to set the correct combination ────────────────────────────────
const CORRECT_CODE = [1, 8, 2, 4]

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM = `
@keyframes lock-in {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1);    }
}
@keyframes lock-shake {
  0%,100% { transform: translateX(0);   }
  15%     { transform: translateX(-8px); }
  30%     { transform: translateX(8px);  }
  50%     { transform: translateX(-6px); }
  70%     { transform: translateX(5px);  }
  85%     { transform: translateX(-3px); }
}
@keyframes lock-unlock {
  0%   { box-shadow: 0 0 0px rgba(80,220,80,0);   }
  50%  { box-shadow: 0 0 28px rgba(80,220,80,0.6); }
  100% { box-shadow: 0 0 8px rgba(80,220,80,0.2);  }
}
`

// ── Single digit drum ─────────────────────────────────────────────────────────
function DigitWheel({ value, onChange, error, unlocked }) {
  const prev = (value + 9) % 10
  const next = (value + 1) % 10

  const onWheel = useCallback((e) => {
    e.preventDefault()
    onChange(e.deltaY < 0 ? 1 : -1)
  }, [onChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>

      {/* Up arrow */}
      <button
        onClick={() => onChange(1)}
        style={{
          background: 'none',
          border: 'none',
          color: unlocked ? '#55dd55' : '#888',
          fontSize: 13,
          cursor: 'pointer',
          padding: '2px 10px',
          transition: 'color 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => { if (!unlocked) e.currentTarget.style.color = '#ccc' }}
        onMouseLeave={e => { if (!unlocked) e.currentTarget.style.color = '#888' }}
      >▲</button>

      {/* Drum window */}
      <div
        onWheel={onWheel}
        style={{
          width: 54, height: 90,
          background: 'linear-gradient(180deg, #0e0e0e 0%, #1a1a1a 40%, #1a1a1a 60%, #0e0e0e 100%)',
          border: `2px solid ${unlocked ? '#44bb44' : error ? '#cc3333' : '#3a3a3a'}`,
          borderRadius: 5,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: unlocked
            ? 'inset 0 0 12px rgba(60,200,60,0.15), 0 0 12px rgba(60,200,60,0.2)'
            : 'inset 0 3px 10px rgba(0,0,0,0.7)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          cursor: 'ns-resize',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {/* Highlight line top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        {/* Next digit above — dim (higher number) */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 18,
          color: unlocked ? 'rgba(80,200,80,0.25)' : 'rgba(255,255,255,0.12)',
          lineHeight: 1,
          marginBottom: 4,
          transition: 'color 0.2s',
        }}>{next}</div>

        {/* Current digit — bright */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 26,
          color: unlocked ? '#66ee66' : error ? '#ff5555' : '#e8e8e8',
          lineHeight: 1,
          textShadow: unlocked
            ? '0 0 12px rgba(80,220,80,0.8)'
            : error
              ? '0 0 8px rgba(255,80,80,0.6)'
              : '0 0 6px rgba(220,220,220,0.4)',
          transition: 'color 0.15s, text-shadow 0.15s',
        }}>{value}</div>

        {/* Previous digit below — dim (lower number) */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 18,
          color: unlocked ? 'rgba(80,200,80,0.25)' : 'rgba(255,255,255,0.12)',
          lineHeight: 1,
          marginTop: 4,
          transition: 'color 0.2s',
        }}>{prev}</div>

        {/* Centre selector lines */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          transform: 'translateY(-18px)',
          height: 36, borderTop: `1px solid ${unlocked ? 'rgba(80,200,80,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderBottom: `1px solid ${unlocked ? 'rgba(80,200,80,0.3)' : 'rgba(255,255,255,0.08)'}`,
          pointerEvents: 'none', transition: 'border-color 0.2s',
        }} />
      </div>

      {/* Down arrow */}
      <button
        onClick={() => onChange(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: unlocked ? '#55dd55' : '#888',
          fontSize: 13,
          cursor: 'pointer',
          padding: '2px 10px',
          transition: 'color 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => { if (!unlocked) e.currentTarget.style.color = '#ccc' }}
        onMouseLeave={e => { if (!unlocked) e.currentTarget.style.color = '#888' }}
      >▼</button>
    </div>
  )
}

// ── Safe lock overlay ─────────────────────────────────────────────────────────
export default function SafeLock({ onClose, onUnlock }) {
  const [digits,   setDigits]   = useState([0, 0, 0, 0])
  const [error,    setError]    = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [shaking,  setShaking]  = useState(false)

  const changeDigit = useCallback((index, dir) => {
    if (unlocked) return
    setDigits(d => {
      const next = [...d]
      next[index] = (next[index] + dir + 10) % 10
      return next
    })
  }, [unlocked])

  const tryUnlock = () => {
    if (unlocked) return
    const correct = digits.every((d, i) => d === CORRECT_CODE[i])
    if (correct) {
      setUnlocked(true)
      onUnlock?.()
      setTimeout(onClose, 2200)
    } else {
      setError(true)
      setShaking(true)
      setTimeout(() => { setError(false); setShaking(false) }, 550)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      <style>{ANIM}</style>

      {/* ── Lock panel ──────────────────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          cursor: 'default',
          background: 'linear-gradient(160deg, #232323 0%, #1a1a1a 60%, #202020 100%)',
          border: `2px solid ${unlocked ? '#44aa44' : '#3a3a3a'}`,
          borderRadius: 10,
          padding: '28px 32px 24px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          animation: shaking
            ? 'lock-shake 0.55s ease-in-out'
            : 'lock-in 0.28s ease-out both',
          transition: 'border-color 0.3s',
          minWidth: 280,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: unlocked ? '#55dd55' : '#666',
          transition: 'color 0.3s',
        }}>
          <span style={{ fontSize: 16 }}>{unlocked ? '🔓' : '🔒'}</span>
          {unlocked ? 'UNLOCKED' : 'ENTER CODE'}
        </div>

        {/* Digit wheels */}
        <div style={{ display: 'flex', gap: 10 }}>
          {digits.map((d, i) => (
            <DigitWheel
              key={i}
              value={d}
              onChange={(dir) => changeDigit(i, dir)}
              error={error}
              unlocked={unlocked}
            />
          ))}
        </div>

        {/* Submit / status */}
        {!unlocked ? (
          <button
            onClick={tryUnlock}
            style={{
              marginTop: 4,
              background: 'linear-gradient(180deg, #2e2e2e, #1e1e1e)',
              border: `1px solid ${error ? '#883333' : '#484848'}`,
              borderRadius: 4,
              color: error ? '#ff6666' : '#aaa',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.25em',
              padding: '8px 28px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #383838, #282828)'
              e.currentTarget.style.color = '#ddd'
              e.currentTarget.style.borderColor = '#666'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #2e2e2e, #1e1e1e)'
              e.currentTarget.style.color = error ? '#ff6666' : '#aaa'
              e.currentTarget.style.borderColor = error ? '#883333' : '#484848'
            }}
          >
            {error ? 'WRONG CODE' : 'OPEN'}
          </button>
        ) : (
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11, letterSpacing: '0.25em',
            color: '#55dd55',
            textShadow: '0 0 10px rgba(80,220,80,0.6)',
            animation: 'lock-unlock 1s ease-out',
          }}>✓ ACCESS GRANTED</div>
        )}

        {/* Hint */}
        {!unlocked && (
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 8, color: '#3a3a3a',
            letterSpacing: '0.15em',
          }}>SCROLL OR CLICK ▲▼ TO CHANGE</div>
        )}
      </div>
    </div>
  )
}
