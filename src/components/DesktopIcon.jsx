import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

// Cover image glob — resolved at build time
const coverGlob = import.meta.glob(
  '../assets/images/projects/*/cover.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: true }
)
function getCoverUrl(id) {
  const entry = Object.entries(coverGlob).find(([p]) => p.includes(`/${id}/cover`))
  return entry ? entry[1].default : null
}

// ── Default pixel art icons (SVG, drawn at 16×16 logical pixels) ──────────────
function DefaultIcon({ color = '#4a9eff', size }) {
  // Folder shape
  return (
    <svg width={size} height={size} viewBox="0 0 16 14"
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      {/* Folder back */}
      <rect x="0" y="3" width="16" height="11" fill={color} />
      {/* Tab */}
      <rect x="0" y="1" width="6" height="3" fill={color} />
      {/* Shade */}
      <rect x="0" y="13" width="16" height="1" fill="rgba(0,0,0,0.35)" />
      <rect x="0"  y="3" width="1"  height="10" fill="rgba(255,255,255,0.18)" />
      <rect x="0"  y="3" width="16" height="1"  fill="rgba(255,255,255,0.12)" />
    </svg>
  )
}

// ── DesktopIcon ───────────────────────────────────────────────────────────────

export default function DesktopIcon({ project, scale, isActive, isTouchDevice, onOpen, adminMode, xPct, yPct, desktopSize, onPositionSave }) {
  const s = scale
  const [hovered,  setHovered]  = useState(false)
  const [dragPos,  setDragPos]  = useState(null) // {x,y} px during active drag
  const coverUrl = getCoverUrl(project.id)
  const dragRef  = useRef({ active: false, moved: false, startPtrX: 0, startPtrY: 0, startXPct: 0, startYPct: 0 })

  const ICON_SIZE  = 78 * s
  const LABEL_SIZE = 10.5 * s
  const ICON_W_PCT = desktopSize?.w ? (112 * s / desktopSize.w) * 100 : 0
  const ICON_H_PCT = desktopSize?.h ? (124 * s / desktopSize.h) * 100 : 0

  const handlePointerDown = useCallback((e) => {
    if (!adminMode) return
    e.preventDefault()
    const dr = dragRef.current
    dr.active    = true
    dr.moved     = false
    dr.startPtrX = e.clientX
    dr.startPtrY = e.clientY
    dr.startXPct = xPct
    dr.startYPct = yPct
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [adminMode, xPct, yPct])

  const handlePointerMove = useCallback((e) => {
    const dr = dragRef.current
    if (!dr.active) return
    e.preventDefault()
    const dx = e.clientX - dr.startPtrX
    const dy = e.clientY - dr.startPtrY
    if (!dr.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) dr.moved = true
    if (!dr.moved) return
    const dw = desktopSize?.w || 1280
    const dh = desktopSize?.h || 720
    const newX = Math.max(0, Math.min(100 - ICON_W_PCT, dr.startXPct + (dx / dw) * 100))
    const newY = Math.max(0, Math.min(100 - ICON_H_PCT, dr.startYPct + (dy / dh) * 100))
    setDragPos({ x: (newX / 100) * dw, y: (newY / 100) * dh })
  }, [desktopSize, ICON_W_PCT, ICON_H_PCT])

  const handlePointerUp = useCallback(() => {
    const dr = dragRef.current
    if (!dr.active) return
    dr.active = false
    if (dr.moved && dragPos) {
      const dw = desktopSize?.w || 1280
      const dh = desktopSize?.h || 720
      onPositionSave?.((dragPos.x / dw) * 100, (dragPos.y / dh) * 100)
    }
    setDragPos(null)
  }, [dragPos, desktopSize, onPositionSave])

  const handleClick = useCallback((e) => {
    if (dragRef.current.moved) { dragRef.current.moved = false; return }
    onOpen()
  }, [onOpen])

  // Display position: drag overrides saved %
  const dw = desktopSize?.w || 1280
  const dh = desktopSize?.h || 720
  const displayX = dragPos ? (dragPos.x / dw) * 100 : (xPct ?? 0)
  const displayY = dragPos ? (dragPos.y / dh) * 100 : (yPct ?? 0)

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: `${displayX}%`,
        top:  `${displayY}%`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6 * s,
        cursor: adminMode ? (dragPos ? 'grabbing' : 'grab') : 'pointer',
        userSelect: 'none',
        padding: `${5 * s}px ${4 * s}px`,
        background: (hovered || isActive)
          ? 'rgba(80,80,200,0.35)'
          : adminMode ? 'rgba(50,50,120,0.12)' : 'transparent',
        outline: (hovered || isActive)
          ? `${1 * s}px dashed rgba(180,180,255,0.5)`
          : adminMode ? `${1 * s}px dashed rgba(100,100,220,0.28)` : 'none',
        width: 112 * s,
        zIndex: dragPos ? 50 : 10,
        touchAction: 'none',
        transition: dragPos ? 'none' : 'background 0.1s',
      }}
      whileTap={!adminMode ? { scale: 0.9 } : undefined}
    >
      {/* Icon image or default */}
      <div style={{
        width: ICON_SIZE, height: ICON_SIZE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        imageRendering: 'pixelated',
        filter: (hovered || isActive) ? 'brightness(1.2)' : 'brightness(0.85)',
        transition: 'filter 0.1s',
      }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
          />
        ) : (
          <DefaultIcon color={project.colour || '#4a9eff'} size={ICON_SIZE} />
        )}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: Math.max(7, Math.min(LABEL_SIZE, 13)),
        color: '#e0e0f0',
        textAlign: 'center',
        lineHeight: 1.4,
        width: '100%',
        textShadow: '1px 1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9)',
        wordBreak: 'break-word',
        hyphens: 'auto',
        maxWidth: 112 * s,
      }}>
        {project.title}
      </div>
    </motion.div>
  )
}
