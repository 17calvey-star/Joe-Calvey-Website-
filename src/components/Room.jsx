import Computer from './Computer'

// Pixel art color palette — dark, dingy, prison-like
const C = {
  ceiling:       '#0b0907',
  ceilingEdge:   '#1e1a12',
  floor:         '#0e0b07',
  floorEdge:     '#1e1a12',
  sideWall:      '#111009',
  backWall:      '#1c1812',
  brickDark:     'rgba(0,0,0,0.22)',
  brickLight:    'rgba(255,255,200,0.025)',
  cornerShadow:  '#08060400',
  ceilingJoin:   '#2a2418',
  floorJoin:     '#241e14',
}

// Brick pattern: offset rows of mortar lines
const BRICK_BG = `
  repeating-linear-gradient(
    90deg,
    transparent 0px, transparent 47px,
    ${C.brickDark} 47px, ${C.brickDark} 49px
  ),
  repeating-linear-gradient(
    0deg,
    transparent 0px, transparent 23px,
    ${C.brickDark} 23px, ${C.brickDark} 25px
  ),
  linear-gradient(180deg, ${C.backWall} 0%, #1a1610 100%)
`.trim()

export default function Room({ onComputerClick }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: C.backWall,
      overflow: 'hidden',
      imageRendering: 'pixelated',
    }}>

      {/* ── Ceiling ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '11%',
        background: `linear-gradient(180deg, ${C.ceiling} 0%, #130f0a 100%)`,
        borderBottom: `3px solid ${C.ceilingJoin}`,
        zIndex: 3,
      }} />

      {/* Ceiling/wall join shadow */}
      <div style={{
        position: 'absolute', top: '11%', left: 0, right: 0,
        height: 20,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* ── Floor ───────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '14%',
        background: `linear-gradient(0deg, ${C.floor} 0%, #15120c 100%)`,
        borderTop: `3px solid ${C.floorJoin}`,
        zIndex: 3,
      }}>
        {/* Floor planks / grunge lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent 0px, transparent 119px,
            rgba(0,0,0,0.18) 119px, rgba(0,0,0,0.18) 121px
          )`,
        }} />
      </div>

      {/* Floor/wall join shadow */}
      <div style={{
        position: 'absolute', bottom: '14%', left: 0, right: 0,
        height: 24,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* ── Left side wall ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '16%',
        background: `linear-gradient(to right, ${C.sideWall} 0%, #161410 60%, transparent 100%)`,
        zIndex: 2,
      }}>
        {/* Perspective edge line */}
        <div style={{
          position: 'absolute', top: '11%', bottom: '14%', right: 0,
          width: 3,
          background: C.ceilingJoin,
        }} />
        {/* Inner shadow for depth */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }} />
      </div>

      {/* ── Right side wall ─────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '16%',
        background: `linear-gradient(to left, ${C.sideWall} 0%, #161410 60%, transparent 100%)`,
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', top: '11%', bottom: '14%', left: 0,
          width: 3,
          background: C.ceilingJoin,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }} />
      </div>

      {/* ── Back wall with brick texture ────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '11%', bottom: '14%', left: '16%', right: '16%',
        backgroundImage: BRICK_BG,
        zIndex: 1,
      }}>
        {/* Subtle vignette on the back wall corners */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)
          `,
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Computer — centered on back wall */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -52%)',
          zIndex: 3,
        }}>
          <Computer onClick={onComputerClick} />
        </div>
      </div>

      {/* ── Overall room vignette — dark corners all around ─────── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)
        `,
        pointerEvents: 'none',
        zIndex: 10,
      }} />
    </div>
  )
}
