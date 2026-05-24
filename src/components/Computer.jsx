import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Pixel art CRT computer. All measurements in px — sharp edges, no border-radius.
// Styled to look like a mid-80s home computer sitting on a desk.

export default function Computer({ onClick }) {
  const [hovered, setHovered] = useState(false)
  const [flickerOn, setFlickerOn] = useState(true)
  const flickerRef = useRef(null)

  // Idle screen flicker — subtle, like old phosphor
  useEffect(() => {
    const flicker = () => {
      setFlickerOn(v => !v)
      flickerRef.current = setTimeout(flicker, 80 + Math.random() * 4000)
    }
    flickerRef.current = setTimeout(flicker, 2000 + Math.random() * 3000)
    return () => clearTimeout(flickerRef.current)
  }, [])

  const screenGlow = hovered
    ? '0 0 32px #00ff41, 0 0 8px #00ff41, inset 0 0 18px rgba(0,255,65,0.18)'
    : flickerOn
      ? '0 0 8px rgba(0,255,65,0.35), inset 0 0 6px rgba(0,255,65,0.08)'
      : '0 0 4px rgba(0,255,65,0.12), inset 0 0 3px rgba(0,255,65,0.04)'

  const screenBg = hovered ? '#081a0a' : '#060c06'

  return (
    <motion.div
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* ── Monitor body ─────────────────────────────────────────── */}
      <div style={{
        width: 200,
        background: '#28231a',
        border: '4px solid #181410',
        boxShadow: `
          inset 2px 2px 0 #38322a,
          inset -2px -2px 0 #100d09,
          0 8px 32px rgba(0,0,0,0.7)
        `,
        position: 'relative',
        imageRendering: 'pixelated',
      }}>
        {/* Top bezel */}
        <div style={{ height: 14, background: '#2e2820' }} />

        {/* Side bezels + screen area */}
        <div style={{ display: 'flex', padding: '0 14px' }}>
          {/* Screen */}
          <div style={{
            flex: 1,
            height: 130,
            background: screenBg,
            border: '3px solid #0e0b08',
            boxShadow: screenGlow,
            transition: 'box-shadow 0.15s ease, background 0.15s ease',
            position: 'relative',
            overflow: 'hidden',
            imageRendering: 'pixelated',
          }}>
            {/* Scanlines overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px)',
              pointerEvents: 'none',
              zIndex: 2,
            }} />

            {/* Screen content — blinking cursor idle, "CLICK" on hover */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, zIndex: 1,
            }}>
              {hovered ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: '#00ff41',
                    textShadow: '0 0 8px #00ff41',
                    textAlign: 'center',
                    lineHeight: 2,
                  }}
                >
                  CLICK TO<br />VIEW WORK
                </motion.div>
              ) : (
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                  color: '#33cc44',
                  textShadow: '0 0 4px rgba(0,255,65,0.5)',
                  opacity: flickerOn ? 0.85 : 0.55,
                  transition: 'opacity 0.08s',
                }}>
                  C:\&gt;_
                </div>
              )}
            </div>

            {/* CRT curve vignette */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)',
              pointerEvents: 'none',
              zIndex: 3,
            }} />
          </div>
        </div>

        {/* Bottom bezel with controls */}
        <div style={{
          height: 28,
          background: '#2a2520',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
        }}>
          {/* Power LED */}
          <div style={{
            width: 6, height: 6,
            background: hovered ? '#00ff41' : '#1a6025',
            boxShadow: hovered ? '0 0 6px #00ff41' : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }} />
          {/* Disk slot */}
          <div style={{
            flex: 1,
            height: 4,
            background: '#181410',
            border: '1px solid #0a0806',
            marginLeft: 8,
          }} />
          {/* Vent slots */}
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 3, height: 12,
              background: '#181410',
              border: '1px solid #0a0806',
            }} />
          ))}
        </div>
      </div>

      {/* ── Monitor neck ─────────────────────────────────────────── */}
      <div style={{
        width: 48, height: 10,
        background: '#201c14',
        border: '2px solid #141008',
        margin: '0 auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }} />

      {/* ── Monitor stand ────────────────────────────────────────── */}
      <div style={{
        width: 88, height: 8,
        background: '#1c1810',
        border: '2px solid #0f0c08',
        margin: '0 auto',
        boxShadow: '0 3px 8px rgba(0,0,0,0.6)',
      }} />

      {/* ── Desk surface below stand ─────────────────────────────── */}
      <div style={{
        width: 110, height: 4,
        background: '#141008',
        margin: '2px auto 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
      }} />
    </motion.div>
  )
}
