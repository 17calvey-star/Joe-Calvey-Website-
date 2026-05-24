import Computer from './Computer'

// ── SVG filter / gradient defs ─────────────────────────────────────────────────
function Defs() {
  return (
    <defs>
      {/* ── Cracked plaster — back wall ─────────────────────────────────────── */}
      <filter id="plaster-back" x="-2%" y="-2%" width="104%" height="104%"
        colorInterpolationFilters="sRGB">
        {/* Coarse surface mottling */}
        <feTurbulence type="fractalNoise" baseFrequency="0.048 0.038"
          numOctaves="6" seed="4" result="base" />
        {/* Quantise into pixel-art steps (5 tones) */}
        <feComponentTransfer in="base" result="stepped">
          <feFuncR type="discrete" tableValues="0.03 0.065 0.10 0.14 0.09" />
          <feFuncG type="discrete" tableValues="0.027 0.058 0.09 0.125 0.08" />
          <feFuncB type="discrete" tableValues="0.012 0.026 0.04 0.056 0.035" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="stepped" mode="multiply" result="blended" />
        {/* Dark crack veins */}
        <feTurbulence type="fractalNoise" baseFrequency="0.024 0.018"
          numOctaves="3" seed="11" result="vein-noise" />
        <feColorMatrix in="vein-noise" type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  5 5 5 0 -3.8" result="vein-mask" />
        <feFlood floodColor="#000000" floodOpacity="0.6" result="crack-dark" />
        <feComposite in="crack-dark" in2="vein-mask" operator="in" result="cracks" />
        <feMerge>
          <feMergeNode in="blended" />
          <feMergeNode in="cracks" />
        </feMerge>
      </filter>

      {/* ── Cracked plaster — side walls (darker base, different seed) ──────── */}
      <filter id="plaster-side" x="-2%" y="-2%" width="104%" height="104%"
        colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.048 0.038"
          numOctaves="6" seed="7" result="base" />
        <feComponentTransfer in="base" result="stepped">
          <feFuncR type="discrete" tableValues="0.02 0.042 0.065 0.09 0.055" />
          <feFuncG type="discrete" tableValues="0.018 0.038 0.058 0.08 0.05" />
          <feFuncB type="discrete" tableValues="0.008 0.017 0.026 0.036 0.022" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="stepped" mode="multiply" result="blended" />
        <feTurbulence type="fractalNoise" baseFrequency="0.024 0.018"
          numOctaves="3" seed="5" result="vein-noise" />
        <feColorMatrix in="vein-noise" type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  5 5 5 0 -3.8" result="vein-mask" />
        <feFlood floodColor="#000000" floodOpacity="0.55" result="crack-dark" />
        <feComposite in="crack-dark" in2="vein-mask" operator="in" result="cracks" />
        <feMerge>
          <feMergeNode in="blended" />
          <feMergeNode in="cracks" />
        </feMerge>
      </filter>

      {/* ── Floor texture ───────────────────────────────────────────────────── */}
      <filter id="floor-tex" x="-2%" y="-2%" width="104%" height="104%"
        colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.06 0.02"
          numOctaves="3" seed="2" result="base" />
        <feComponentTransfer in="base" result="stepped">
          <feFuncR type="discrete" tableValues="0.025 0.05 0.075 0.05" />
          <feFuncG type="discrete" tableValues="0.022 0.044 0.066 0.044" />
          <feFuncB type="discrete" tableValues="0.01 0.02 0.03 0.02" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="stepped" mode="multiply" />
      </filter>

      {/* ── Screen glow — warm amber light from computer ────────────────────── */}
      {/* userSpaceOnUse coords match the 1280×720 viewBox */}
      <radialGradient id="screen-glow" gradientUnits="userSpaceOnUse"
        cx="640" cy="400" r="640">
        <stop offset="0%"   stopColor="#c8a820" stopOpacity="0.72" />
        <stop offset="12%"  stopColor="#a88a18" stopOpacity="0.50" />
        <stop offset="32%"  stopColor="#604e08" stopOpacity="0.25" />
        <stop offset="62%"  stopColor="#1a1504" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0"    />
      </radialGradient>

      {/* ── Tight halo — right behind the monitor ───────────────────────────── */}
      <radialGradient id="monitor-halo" gradientUnits="userSpaceOnUse"
        cx="640" cy="370" r="220">
        <stop offset="0%"   stopColor="#e0c030" stopOpacity="0.55" />
        <stop offset="40%"  stopColor="#9a7c14" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0"    />
      </radialGradient>

      {/* ── Desk surface glow (green tint from screen below) ────────────────── */}
      <radialGradient id="desk-glow" gradientUnits="userSpaceOnUse"
        cx="640" cy="510" r="260">
        <stop offset="0%"   stopColor="#80c830" stopOpacity="0.22" />
        <stop offset="55%"  stopColor="#304810" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0"    />
      </radialGradient>

      {/* ── Deep corner vignette ────────────────────────────────────────────── */}
      <radialGradient id="vignette" gradientUnits="objectBoundingBox"
        cx="50%" cy="50%" r="70%">
        <stop offset="0%"   stopColor="#000" stopOpacity="0"    />
        <stop offset="52%"  stopColor="#000" stopOpacity="0.05" />
        <stop offset="78%"  stopColor="#000" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.97" />
      </radialGradient>
    </defs>
  )
}

// ── Air vent grate (reusable) ─────────────────────────────────────────────────
function VentGrate({ x, y, w, h, slotCount = 5, onClick }) {
  const slotH = (h - 6) / slotCount
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x} y={y} width={w} height={h} fill="#0e0d0a" stroke="#1e1c16" strokeWidth="2" />
      {Array.from({ length: slotCount }).map((_, i) => (
        <rect key={i}
          x={x + 3} y={y + 3 + i * slotH}
          width={w - 6} height={Math.max(2, slotH - 3)}
          fill="#080806" stroke="#252318" strokeWidth="1" />
      ))}
      {/* inner shadow */}
      <rect x={x} y={y} width={w} height={h}
        fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="3"
        style={{ pointerEvents: 'none' }} />
    </g>
  )
}

// ── Main Room component ────────────────────────────────────────────────────────
export default function Room({ onComputerClick, scale = 1, settings }) {
  const dec = settings?.decorations || {}
  const showAirVent  = dec.airVent?.show  !== false
  const showLuckSign = dec.luckSign?.show !== false
  const showMug      = dec.deskMug?.show  !== false
  const showBook     = dec.deskBook?.show !== false

  const s = scale

  // Design space: 1280 × 720
  // Room corners (back wall edges in perspective):
  //   Back wall TL (192, 58)  TR (1088, 58)  BR (1088, 612)  BL (192, 612)
  // Everything derived from these four points.

  // Desk: sits against back wall bottom, centred
  const deskL = 272, deskR = 1008   // x extents on back wall
  const deskTop = 494, deskBot = 530 // y in SVG space
  const deskMidX = 640

  // Luck sign: on back wall, left of centre (x=350 stays visible at 800px viewport)
  const lsX = 350, lsY = 155, lsW = 62, lsH = 80

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#060504',
      overflow: 'hidden',
      imageRendering: 'pixelated',
    }}>
      <svg
        viewBox="0 0 1280 720"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Defs />

        {/* ── CEILING ───────────────────────────────────────────────────────── */}
        <polygon points="0,0 1280,0 1088,58 192,58" fill="#0b0907" filter="url(#plaster-side)" />
        {/* ceiling/wall join line */}
        <line x1="192" y1="58" x2="1088" y2="58" stroke="#252018" strokeWidth="2" />

        {/* ── LEFT WALL ─────────────────────────────────────────────────────── */}
        <polygon points="0,0 192,58 192,612 0,720" fill="#131009" filter="url(#plaster-side)" />
        {/* edge seam */}
        <line x1="192" y1="58" x2="192" y2="612" stroke="#201c10" strokeWidth="2" />

        {/* ── RIGHT WALL ────────────────────────────────────────────────────── */}
        <polygon points="1088,58 1280,0 1280,720 1088,612" fill="#131009" filter="url(#plaster-side)" />
        <line x1="1088" y1="58" x2="1088" y2="612" stroke="#201c10" strokeWidth="2" />

        {/* ── FLOOR ─────────────────────────────────────────────────────────── */}
        <polygon points="192,612 1088,612 1280,720 0,720" fill="#0f0d08" filter="url(#floor-tex)" />
        {/* floor/wall join */}
        <line x1="192" y1="612" x2="1088" y2="612" stroke="#1e1a0e" strokeWidth="2" />
        {/* floor tile lines (faint) */}
        {[320, 448, 576, 704, 832, 960].map(x => (
          <line key={x} x1={x} y1={612} x2={x} y2={720} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        ))}

        {/* ── BACK WALL ─────────────────────────────────────────────────────── */}
        <rect x="192" y="58" width="896" height="554" fill="#201c12" filter="url(#plaster-back)" />

        {/* ── SCREEN GLOW on wall ────────────────────────────────────────────── */}
        <rect x="192" y="58" width="896" height="554"
          fill="url(#monitor-halo)" style={{ pointerEvents: 'none' }} />
        <rect x="0" y="0" width="1280" height="720"
          fill="url(#screen-glow)" style={{ pointerEvents: 'none' }} />

        {/* ── DESK ──────────────────────────────────────────────────────────── */}
        {/* Desk top surface */}
        <rect x={deskL} y={deskTop} width={deskR - deskL} height={deskBot - deskTop}
          fill="#2e2010" />
        {/* highlight on front edge */}
        <rect x={deskL} y={deskBot - 3} width={deskR - deskL} height={3}
          fill="#1a1208" />
        {/* desk glow from monitor below */}
        <rect x={deskL} y={deskTop} width={deskR - deskL} height={deskBot - deskTop}
          fill="url(#desk-glow)" style={{ pointerEvents: 'none' }} />
        {/* wood grain lines */}
        {[310, 360, 430, 510, 580, 660, 740, 810, 880, 940].map(x => (
          <line key={x} x1={x} y1={deskTop} x2={x} y2={deskBot}
            stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        ))}
        {/* Desk legs */}
        <rect x={deskL + 18} y={deskBot} width={8} height={72} fill="#1e1408" />
        <rect x={deskR - 26} y={deskBot} width={8} height={72} fill="#1e1408" />

        {/* Desk objects */}
        {/* Mug */}
        {showMug && (
          <g transform={`translate(${deskR - 80}, ${deskTop - 28})`}>
            <rect x="0" y="6" width="20" height="22" fill="#2a2a2a" />
            <rect x="0" y="6" width="20" height="3" fill="#3a3a3a" />
            {/* handle */}
            <path d="M20,10 Q29,10 29,17 Q29,24 20,24" fill="none" stroke="#3a3a3a" strokeWidth="3" />
          </g>
        )}
        {/* Book */}
        {showBook && (
          <g transform={`translate(${deskL + 40}, ${deskTop - 34})`}>
            <rect x="0" y="0" width="26" height="34" fill="#1a381a" />
            <rect x="23" y="2" width="4" height="30" fill="#c0a860" />
            {[4, 8, 12, 16, 20, 24, 28].map(y => (
              <line key={y} x1="23" y1={y} x2="27" y2={y}
                stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
            ))}
          </g>
        )}

        {/* ── CEILING VENT (top center) ──────────────────────────────────────── */}
        {showAirVent && (
          <VentGrate x={590} y={8} w={100} h={38} slotCount={4} />
        )}

        {/* ── RIGHT WALL VENT ────────────────────────────────────────────────── */}
        {showAirVent && (
          <VentGrate x={1000} y={100} w={56} h={38} slotCount={5} />
        )}

        {/* ── LUCK SIGN on back wall ─────────────────────────────────────────── */}
        {showLuckSign && (
          <g>
            <rect x={lsX} y={lsY} width={lsW} height={lsH}
              fill="#cccca8" stroke="#909070" strokeWidth="2" />
            {/* inner border */}
            <rect x={lsX + 4} y={lsY + 4} width={lsW - 8} height={lsH - 8}
              fill="none" stroke="#a0a080" strokeWidth="1" />
            {/* shamrock placeholder — 3 circles */}
            <circle cx={lsX + lsW / 2}      cy={lsY + 26} r={7} fill="#2a5a22" opacity="0.7" />
            <circle cx={lsX + lsW / 2 - 8}  cy={lsY + 34} r={7} fill="#2a5a22" opacity="0.7" />
            <circle cx={lsX + lsW / 2 + 8}  cy={lsY + 34} r={7} fill="#2a5a22" opacity="0.7" />
            <rect   cx={lsX + lsW / 2}       cy={lsY + 36} x={lsX + lsW / 2 - 2} y={lsY + 38} width="4" height="8" fill="#1e4018" />
            {/* text */}
            <text x={lsX + lsW / 2} y={lsY + 66}
              textAnchor="middle" fontFamily="'Press Start 2P',monospace"
              fontSize="7" fill="#383828" letterSpacing="1">LUCK</text>
          </g>
        )}

        {/* ── DEEP VIGNETTE (corners go near-black) ─────────────────────────── */}
        <rect x="0" y="0" width="1280" height="720"
          fill="url(#vignette)" style={{ pointerEvents: 'none' }} />

        {/* ── Ambient darkness overlay — top and bottom edges ───────────────── */}
        <rect x="0" y="0"   width="1280" height="80"
          fill="url(#top-fade)" style={{ pointerEvents: 'none' }}
          fillOpacity="0.6" />

      </svg>

      {/* ── Computer — React component layered over SVG ───────────────────── */}
      {/* Position: centred, sitting on desk surface                          */}
      {/* Desk surface is at ~68.6% from top (494/720) of design height       */}
      {/* We use bottom % so it scales with viewport                          */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: '26%',             // ≈ desk surface in the SVG (720-494)/720 = 31.4%, minus desk depth ≈ 26%
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
        <Computer onClick={onComputerClick} scale={s} />
      </div>
    </div>
  )
}
