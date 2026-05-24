import Computer from './Computer'

// Pixel art color palette — dark, dingy, prison/dungeon
const C = {
  ceiling:     '#0b0907',
  ceilingJoin: '#201a10',
  floor:       '#0c0a06',
  floorJoin:   '#1c1610',
  sideWall:    '#0e0c08',
  backWall:    '#1c1812',
  brick:       'rgba(0,0,0,0.20)',
  brickLight:  'rgba(255,240,180,0.015)',
  desk:        '#2a1e0e',
  deskShade:   '#1a1208',
  deskHighlight:'#3a2a14',
  deskLeg:     '#1e1508',
  mug:         '#2e2e2e',
  mugRim:      '#3a3a3a',
  book:        '#1a3a1a',
  bookPage:    '#c8b878',
  luckSign:    '#d0d0b0',
  ventGrate:   '#1a1a1a',
}

// Offset brick pattern using CSS gradients
const BRICK_BG = `
  repeating-linear-gradient(90deg,
    transparent 0px, transparent 47px,
    ${C.brick} 47px, ${C.brick} 49px),
  repeating-linear-gradient(0deg,
    transparent 0px, transparent 23px,
    ${C.brick} 23px, ${C.brick} 25px),
  linear-gradient(180deg, ${C.backWall} 0%, #181410 100%)
`.trim()

// ── Decorative elements ───────────────────────────────────────────────────────

function LuckSign({ scale, offset = { x: 0, y: 0 } }) {
  const s = scale
  return (
    <div style={{
      position: 'absolute',
      left: `calc(8% + ${offset.x * s}px)`,
      top: `calc(22% + ${offset.y * s}px)`,
      width: 52 * s, height: 60 * s,
      background: C.luckSign,
      border: `${2 * s}px solid #a0a080`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 4 * s,
      boxShadow: `${2 * s}px ${3 * s}px ${8 * s}px rgba(0,0,0,0.6)`,
      imageRendering: 'pixelated',
    }}>
      {/* Shamrock */}
      <div style={{
        fontSize: 18 * s, lineHeight: 1,
        filter: 'saturate(0.6) brightness(0.7)',
      }}>🍀</div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 5 * s, color: '#404030',
        letterSpacing: 0,
      }}>LUCK</div>
    </div>
  )
}

function AirVent({ scale, offset = { x: 0, y: 0 }, onEasterEgg }) {
  const s = scale
  const slots = 5
  return (
    <div
      onClick={onEasterEgg}
      title="..."
      style={{
        position: 'absolute',
        right: `calc(4% + ${-offset.x * s}px)`,
        top: `calc(14% + ${offset.y * s}px)`,
        width: 44 * s, height: 28 * s,
        background: '#141412',
        border: `${2 * s}px solid #282820`,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-around',
        padding: `${3 * s}px ${4 * s}px`,
        boxShadow: `inset 0 0 ${6 * s}px rgba(0,0,0,0.8)`,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: slots }).map((_, i) => (
        <div key={i} style={{
          height: 2 * s,
          background: C.ventGrate,
          borderTop: `${1 * s}px solid #2a2a28`,
        }} />
      ))}
    </div>
  )
}

function Desk({ scale, showMug, showBook }) {
  const s = scale
  const deskW = 72   // % of back wall width
  const deskH = 10   // % of total height
  return (
    <>
      {/* Desk surface */}
      <div style={{
        position: 'absolute',
        left: '14%', right: '14%',
        bottom: `${14 + 3}%`,
        height: `${deskH}%`,
        background: `linear-gradient(180deg, ${C.deskHighlight} 0%, ${C.desk} 30%, ${C.deskShade} 100%)`,
        boxShadow: `0 ${4 * s}px ${16 * s}px rgba(0,0,0,0.7)`,
        zIndex: 4,
      }}>
        {/* Desk grain lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg,
            transparent 0px, transparent ${31 * s}px,
            rgba(0,0,0,0.12) ${31 * s}px, rgba(0,0,0,0.12) ${32 * s}px)`,
        }} />
        {/* Front edge highlight */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3 * s,
          background: '#1a1208',
        }} />
      </div>

      {/* Desk legs */}
      {[18, 78].map((pct, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(14% + (72% * ${pct / 100}))`,
          bottom: '14%',
          width: 4 * s,
          height: `${deskH * 0.8}%`,
          background: C.deskLeg,
          zIndex: 3,
        }} />
      ))}

      {/* Mug on desk */}
      {showMug && (
        <div style={{
          position: 'absolute',
          right: 'calc(14% + 6%)',
          bottom: `${14 + 3 + deskH}%`,
          zIndex: 5,
        }}>
          <div style={{
            width: 14 * s, height: 16 * s,
            background: C.mug,
            borderTop: `${2 * s}px solid ${C.mugRim}`,
            boxShadow: `${1 * s}px ${2 * s}px ${4 * s}px rgba(0,0,0,0.5)`,
          }} />
          {/* Handle */}
          <div style={{
            position: 'absolute',
            right: -4 * s, top: 4 * s,
            width: 5 * s, height: 8 * s,
            border: `${2 * s}px solid ${C.mugRim}`,
            borderLeft: 'none',
          }} />
        </div>
      )}

      {/* Book on desk */}
      {showBook && (
        <div style={{
          position: 'absolute',
          left: 'calc(14% + 5%)',
          bottom: `${14 + 3 + deskH}%`,
          zIndex: 5,
        }}>
          {/* Book body */}
          <div style={{
            width: 18 * s, height: 22 * s,
            background: C.book,
            boxShadow: `${2 * s}px ${2 * s}px ${6 * s}px rgba(0,0,0,0.6)`,
            position: 'relative',
          }}>
            {/* Pages visible from side */}
            <div style={{
              position: 'absolute', top: 2 * s, right: -2 * s,
              width: 3 * s, height: `calc(100% - ${4 * s}px)`,
              background: C.bookPage,
              backgroundImage: `repeating-linear-gradient(0deg,
                transparent, transparent ${2 * s}px,
                rgba(0,0,0,0.1) ${2 * s}px, rgba(0,0,0,0.1) ${2.5 * s}px)`,
            }} />
          </div>
        </div>
      )}
    </>
  )
}

// ── Main Room component ───────────────────────────────────────────────────────

export default function Room({ onComputerClick, scale = 1, settings }) {
  const dec = settings?.decorations || {}
  const showAirVent  = dec.airVent?.show  !== false
  const showLuckSign = dec.luckSign?.show !== false
  const showMug      = dec.deskMug?.show  !== false
  const showBook     = dec.deskBook?.show !== false

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: C.backWall,
      overflow: 'hidden',
      imageRendering: 'pixelated',
    }}>
      {/* Ceiling */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '11%',
        background: `linear-gradient(180deg, ${C.ceiling} 0%, #130f0a 100%)`,
        borderBottom: `${3}px solid ${C.ceilingJoin}`,
        zIndex: 3,
      }} />
      <div style={{
        position: 'absolute', top: '11%', left: 0, right: 0, height: 20 * scale,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />

      {/* Floor */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '14%',
        background: `linear-gradient(0deg, ${C.floor} 0%, #15120c 100%)`,
        borderTop: `3px solid ${C.floorJoin}`,
        zIndex: 3,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg,
            transparent 0px, transparent 119px,
            rgba(0,0,0,0.18) 119px, rgba(0,0,0,0.18) 121px)`,
        }} />
      </div>
      <div style={{
        position: 'absolute', bottom: '14%', left: 0, right: 0, height: 24 * scale,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />

      {/* Left side wall */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '16%',
        background: `linear-gradient(to right, ${C.sideWall} 0%, #161410 60%, transparent 100%)`,
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', top: '11%', bottom: '14%', right: 0,
          width: 3, background: C.ceilingJoin,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, transparent 100%)',
        }} />
      </div>

      {/* Right side wall */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '16%',
        background: `linear-gradient(to left, ${C.sideWall} 0%, #161410 60%, transparent 100%)`,
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute', top: '11%', bottom: '14%', left: 0,
          width: 3, background: C.ceilingJoin,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to left, rgba(0,0,0,0.65) 0%, transparent 100%)',
        }} />
      </div>

      {/* Back wall with brick texture */}
      <div style={{
        position: 'absolute',
        top: '11%', bottom: '14%', left: '16%', right: '16%',
        backgroundImage: BRICK_BG,
        zIndex: 1,
      }}>
        {/* Crack stains — atmospheric details */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 8px 60px at 30% 35%, rgba(0,0,0,0.35) 0%, transparent 100%),
            radial-gradient(ellipse 6px 40px at 65% 55%, rgba(0,0,0,0.25) 0%, transparent 100%),
            radial-gradient(ellipse 10px 80px at 80% 25%, rgba(0,0,0,0.2) 0%, transparent 100%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Corner vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Decorations on back wall */}
        {showLuckSign && (
          <LuckSign scale={scale} offset={dec.luckSign || {}} />
        )}
        {showAirVent && (
          <AirVent scale={scale} offset={dec.airVent || {}} onEasterEgg={() => {}} />
        )}

        {/* Desk + desk objects */}
        <Desk scale={scale} showMug={showMug} showBook={showBook} />

        {/* Computer on the desk */}
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: `${14 + 3 + 10 + 0.5}%`,
          transform: 'translateX(-50%)',
          zIndex: 6,
        }}>
          <Computer onClick={onComputerClick} scale={scale} />
        </div>

        {/* Monitor glow on desk */}
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: `${14 + 3 + 10}%`,
          transform: 'translateX(-50%)',
          width: 200 * scale, height: 60 * scale,
          background: 'radial-gradient(ellipse at center top, rgba(0,255,65,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 5,
        }} />
      </div>

      {/* Overall vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 35%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none', zIndex: 10,
      }} />
    </div>
  )
}
