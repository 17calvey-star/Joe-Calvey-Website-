import { useState } from 'react'
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

export default function DesktopIcon({ project, scale, isActive, isTouchDevice, onOpen }) {
  const s = scale
  const [hovered, setHovered] = useState(false)
  const coverUrl = getCoverUrl(project.id)

  const ICON_SIZE  = 78 * s   // image area
  const LABEL_SIZE = 10.5 * s // font size

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onOpen}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6 * s,
        cursor: 'pointer',
        userSelect: 'none',
        padding: `${5 * s}px ${4 * s}px`,
        background: (hovered || isActive) ? 'rgba(80,80,200,0.35)' : 'transparent',
        outline: (hovered || isActive) ? `${1 * s}px dashed rgba(180,180,255,0.5)` : 'none',
        width: 112 * s,
      }}
      whileTap={{ scale: 0.9 }}
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
