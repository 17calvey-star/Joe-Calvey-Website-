import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function Computer({ onClick, scale = 1 }) {
  const [hovered,   setHovered]   = useState(false)
  const [flickerOn, setFlickerOn] = useState(true)
  const flickerRef = useRef(null)
  const s = scale

  // Idle phosphor flicker
  useEffect(() => {
    const tick = () => {
      setFlickerOn(v => !v)
      flickerRef.current = setTimeout(tick, 80 + Math.random() * 4000)
    }
    flickerRef.current = setTimeout(tick, 2000 + Math.random() * 3000)
    return () => clearTimeout(flickerRef.current)
  }, [])

  const screenGlow = hovered
    ? `0 0 ${32 * s}px #00ff41, 0 0 ${8 * s}px #00ff41, inset 0 0 ${18 * s}px rgba(0,255,65,0.18)`
    : flickerOn
      ? `0 0 ${8 * s}px rgba(0,255,65,0.35), inset 0 0 ${6 * s}px rgba(0,255,65,0.08)`
      : `0 0 ${4 * s}px rgba(0,255,65,0.12)`

  return (
    <motion.div
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Monitor body */}
      <div style={{
        width: 200 * s,
        background: '#2c271c',
        border: `${4 * s}px solid #181410`,
        boxShadow: `inset ${2 * s}px ${2 * s}px 0 #3c352a, inset -${2 * s}px -${2 * s}px 0 #100d08, 0 ${8 * s}px ${32 * s}px rgba(0,0,0,0.8)`,
        imageRendering: 'pixelated',
      }}>
        {/* Top bezel */}
        <div style={{ height: 14 * s, background: '#322c20' }} />

        {/* Screen area */}
        <div style={{ padding: `0 ${14 * s}px` }}>
          <div style={{
            height: 130 * s,
            background: hovered ? '#081a0a' : '#060c06',
            border: `${3 * s}px solid #0e0b08`,
            boxShadow: screenGlow,
            transition: 'box-shadow 0.15s ease, background 0.15s ease',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Scanlines */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px)',
              pointerEvents: 'none', zIndex: 2,
            }} />
            {/* Screen text */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1,
            }}>
              {hovered ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9 * s, color: '#00ff41',
                    textShadow: `0 0 ${8 * s}px #00ff41`,
                    textAlign: 'center', lineHeight: 2,
                  }}
                >
                  CLICK TO<br />ENTER
                </motion.div>
              ) : (
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11 * s, color: '#33cc44',
                  textShadow: `0 0 ${4 * s}px rgba(0,255,65,0.5)`,
                  opacity: flickerOn ? 0.85 : 0.55,
                  transition: 'opacity 0.08s',
                }}>C:\&gt;_</div>
              )}
            </div>
            {/* CRT vignette */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)',
              pointerEvents: 'none', zIndex: 3,
            }} />
          </div>
        </div>

        {/* Bottom bezel */}
        <div style={{
          height: 28 * s, background: '#2a2418',
          display: 'flex', alignItems: 'center',
          padding: `0 ${16 * s}px`, gap: 8 * s,
        }}>
          {/* Power LED */}
          <div style={{
            width: 6 * s, height: 6 * s,
            background: hovered ? '#00ff41' : '#1a6025',
            boxShadow: hovered ? `0 0 ${6 * s}px #00ff41` : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }} />
          <div style={{ flex: 1, height: 4 * s, background: '#181410', border: `${1 * s}px solid #0a0806` }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 3 * s, height: 12 * s, background: '#181410', border: `${1 * s}px solid #0a0806` }} />
          ))}
        </div>
      </div>

      {/* Keyboard */}
      <div style={{
        width: 220 * s, height: 20 * s,
        background: '#28221a',
        border: `${2 * s}px solid #181410`,
        margin: `${2 * s}px auto 0`,
        boxShadow: `0 ${2 * s}px ${6 * s}px rgba(0,0,0,0.6)`,
        backgroundImage: `repeating-linear-gradient(90deg,
          transparent 0px, transparent ${8 * s}px,
          rgba(0,0,0,0.15) ${8 * s}px, rgba(0,0,0,0.15) ${9 * s}px)`,
      }} />
    </motion.div>
  )
}
