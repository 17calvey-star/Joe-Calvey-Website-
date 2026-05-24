import Computer from './Computer'
import HorrorOverlay from './HorrorOverlay'

const ANIM = `
@keyframes room-breathe {
  0%,100% { transform: scale(1) translateZ(0); }
  50%      { transform: scale(1.006) translateZ(0); }
}
@keyframes glow-flicker {
  0%,100% { opacity:1;    }
  5%      { opacity:0.82; }
  6%      { opacity:1;    }
  38%     { opacity:1;    }
  39%     { opacity:0.88; }
  40%     { opacity:1;    }
  71%     { opacity:1;    }
  72%     { opacity:0.78; }
  73%     { opacity:0.95; }
  74%     { opacity:1;    }
}
@keyframes fog-pulse {
  0%,100% { opacity:0.6; }
  50%     { opacity:1;   }
}
@keyframes shadow-breathe {
  0%,100% { opacity:0.8; transform:scaleX(1);   }
  50%     { opacity:0.55; transform:scaleX(0.88); }
}
@keyframes fan-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`

const W = 320, H = 180
const BL  = { x:42,  y:36  }
const BR  = { x:278, y:36  }
const BLb = { x:42,  y:148 }
const BRb = { x:278, y:148 }

function poly(pts) { return pts.map(([x,y])=>`${x},${y}`).join(' ') }

// ── Tiny seeded LCG — deterministic noise for brick layout ───────────────────
function makeLCG(seed) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0xffffffff }
}

// ── Procedural pixel-art stone-block back wall ───────────────────────────────
function BackWall({ x, y, w, h }) {
  const rng = makeLCG(7331)

  // Block dimensions (SVG units — 1 unit = ~4 screen px at 1280 wide)
  const BW = 28, BH = 14, GAP = 1

  const bricks   = []
  const details  = []   // cracks, highlights, dark patches
  const drips    = []

  const rows = Math.ceil(h / (BH + GAP)) + 1
  const cols = Math.ceil(w / (BW + GAP)) + 2

  for (let row = 0; row < rows; row++) {
    const stagger = row % 2 === 1 ? (BW + GAP) / 2 : 0

    for (let col = 0; col < cols; col++) {
      const bx = x + col * (BW + GAP) - stagger
      const by = y + row * (BH + GAP)

      // Clip to wall bounds
      const cx = Math.max(bx, x),       cy = Math.max(by, y)
      const cx2= Math.min(bx+BW, x+w),  cy2= Math.min(by+BH, y+h)
      const cw = cx2-cx,                 ch = cy2-cy
      if (cw < 1 || ch < 1) continue

      // Slight per-brick shade variation
      const v   = rng()
      const bri = 28 + Math.round(v * 10)  // 28–38
      const key = `${row}-${col}`

      bricks.push(
        <rect key={`bk-${key}`} x={cx} y={cy} width={cw} height={ch}
          fill={`rgb(${bri},${bri+3},${bri-6})`}/>
      )

      // Top-edge highlight (simulates light catch on stone)
      details.push(
        <rect key={`ht-${key}`} x={cx} y={cy} width={cw} height={1}
          fill={`rgba(90,90,60,0.35)`}/>
      )
      // Left-edge subtle highlight
      details.push(
        <rect key={`hl-${key}`} x={cx} y={cy} width={1} height={ch}
          fill={`rgba(80,80,52,0.2)`}/>
      )

      // Cracks on ~40% of fully visible bricks
      if (rng() < 0.40 && cw >= BW * 0.6 && ch >= BH * 0.6) {
        const n = rng() > 0.6 ? 2 : 1   // 1 or 2 crack lines
        for (let ci = 0; ci < n; ci++) {
          const sx = cx + 2 + rng() * (cw - 4)
          const sy = cy + rng() * ch * 0.35
          // Jagged crack: 3-point path
          const mx = sx + (rng()-0.5)*4
          const my = cy + ch * (0.35 + rng()*0.3)
          const ex = sx + (rng()-0.5)*6
          const ey = cy + ch * (0.72 + rng()*0.28)
          const bright = rng() > 0.4   // lighter = exposed stone, darker = shadow crack

          details.push(
            <path key={`cr-${key}-${ci}`}
              d={`M${sx},${sy} L${mx},${my} L${ex},${ey}`}
              stroke={bright ? '#a09060' : '#181408'}
              strokeWidth={bright ? '0.6' : '0.5'}
              fill="none" opacity={bright ? 0.75 : 0.85}/>
          )
          // Paired shadow line next to light crack
          if (bright) details.push(
            <path key={`cs-${key}-${ci}`}
              d={`M${sx+1},${sy} L${mx+1},${my} L${ex+1},${ey}`}
              stroke="#0e0c06" strokeWidth="0.5" fill="none" opacity="0.6"/>
          )
        }
      }

      // Rust / blood drips from bottom mortar joint (~28%)
      if (rng() < 0.28 && cy2 < y + h - 2) {
        const dx   = cx + 3 + rng() * (cw - 6)
        const dlen = 2 + rng() * 12
        const wide = rng() > 0.6
        drips.push(
          <line key={`dp-${key}`}
            x1={dx} y1={cy2+GAP}
            x2={dx + (wide ? (rng()-0.5)*1.5 : 0)} y2={cy2+GAP+dlen}
            stroke="#3c1c08" strokeWidth={wide ? 1 : 0.5} opacity="0.72"/>
        )
        // Widen drip near bottom (pooling effect)
        if (dlen > 6) drips.push(
          <ellipse key={`dl-${key}`}
            cx={dx} cy={cy2+GAP+dlen}
            rx={wide ? 1.5 : 0.8} ry={0.6}
            fill="#2a1006" opacity="0.55"/>
        )
      }
    }
  }

  return (
    <g>
      {/* Mortar base */}
      <rect x={x} y={y} width={w} height={h} fill="#141612"/>
      {bricks}
      {details}
      {drips}
      {/* Subtle overall grime multiply overlay */}
      <rect x={x} y={y} width={w} height={h}
        fill="none"
        style={{
          background:'transparent',
          filter:'url(#f-grime)',
        }}/>
    </g>
  )
}

// ── Pipes (upper-left of back wall, like the reference) ──────────────────────
function Pipes({ x, y }) {
  // x,y = back-wall top-left
  const BODY  = '#3a3018'
  const HIGH  = '#544428'
  const DARK  = '#1e1810'
  const JOINT = '#2a2212'

  return (
    <g>
      {/* Horizontal pipe (near ceiling of back wall) */}
      <rect x={x}    y={y+5} width={64} height={4} fill={DARK}/>   {/* shadow */}
      <rect x={x}    y={y+4} width={64} height={4} fill={BODY}/>
      <rect x={x}    y={y+4} width={64} height={1} fill={HIGH}/>   {/* top highlight */}

      {/* Second horizontal pipe below */}
      <rect x={x}    y={y+14} width={46} height={3} fill={DARK}/>
      <rect x={x}    y={y+13} width={46} height={3} fill={BODY}/>
      <rect x={x}    y={y+13} width={46} height={1} fill={HIGH}/>

      {/* Vertical pipe dropping from first horizontal */}
      <rect x={x+18} y={y+4}  width={4} height={55} fill={DARK}/>
      <rect x={x+17} y={y+4}  width={4} height={55} fill={BODY}/>
      <rect x={x+17} y={y+4}  width={1} height={55} fill={HIGH}/>

      {/* Vertical pipe from second horizontal (shorter) */}
      <rect x={x+38} y={y+13} width={3} height={22} fill={DARK}/>
      <rect x={x+37} y={y+13} width={3} height={22} fill={BODY}/>
      <rect x={x+37} y={y+13} width={1} height={22} fill={HIGH}/>

      {/* Pipe junction box where horizontal meets vertical */}
      <rect x={x+14} y={y+11} width={10} height={8} fill={JOINT}/>
      <rect x={x+14} y={y+11} width={10} height={8} fill="none"
        stroke={HIGH} strokeWidth="0.5"/>
      {/* Rivets */}
      {[[x+15.5,y+12.5],[x+22.5,y+12.5],[x+15.5,y+17.5],[x+22.5,y+17.5]].map(([rx,ry],i)=>(
        <circle key={i} cx={rx} cy={ry} r={0.8} fill={HIGH} opacity="0.7"/>
      ))}

      {/* Rust stains dripping from pipe joints */}
      <line x1={x+19} y1={y+8} x2={x+19} y2={y+22}
        stroke="#3c1c08" strokeWidth="0.8" opacity="0.6"/>
      <line x1={x+39} y1={y+16} x2={x+39} y2={y+26}
        stroke="#3c1c08" strokeWidth="0.5" opacity="0.5"/>
    </g>
  )
}

// ── Fan vent (upper-right, like the reference) ────────────────────────────────
function FanVent({ cx, cy, r = 14 }) {
  const outerR = r
  const innerR = r * 0.22
  const bladeR = r * 0.72

  // 4 blades as path arcs
  const blades = [0,1,2,3].map(i => {
    const a  = (i / 4) * Math.PI * 2
    const a2 = a + Math.PI * 0.55
    const bx1 = cx + Math.cos(a)  * innerR * 1.5
    const by1 = cy + Math.sin(a)  * innerR * 1.5
    const bx2 = cx + Math.cos(a)  * bladeR
    const by2 = cy + Math.sin(a)  * bladeR
    const bx3 = cx + Math.cos(a2) * bladeR * 0.5
    const by3 = cy + Math.sin(a2) * bladeR * 0.5
    return `M${bx1},${by1} Q${bx2},${by2} ${bx3},${by3} Z`
  })

  return (
    <g>
      {/* Housing square */}
      <rect x={cx-outerR-3} y={cy-outerR-3} width={(outerR+3)*2} height={(outerR+3)*2}
        fill="#181610" stroke="#26221a" strokeWidth="1"/>
      {/* Mounting screws */}
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy],i)=>(
        <circle key={i}
          cx={cx+(outerR+1)*sx*0.85} cy={cy+(outerR+1)*sy*0.85}
          r={1.2} fill="#141210" stroke="#302a1c" strokeWidth="0.5"/>
      ))}
      {/* Fan ring */}
      <circle cx={cx} cy={cy} r={outerR}
        fill="#141210" stroke="#222018" strokeWidth="1"/>
      <circle cx={cx} cy={cy} r={outerR-1}
        fill="none" stroke="#1e1c14" strokeWidth="0.5"/>
      {/* Blades */}
      {blades.map((d,i)=>(
        <path key={i} d={d} fill="#242018" stroke="#181410" strokeWidth="0.4"/>
      ))}
      {/* Centre hub */}
      <circle cx={cx} cy={cy} r={innerR*1.4} fill="#1e1c12" stroke="#2e2a1a" strokeWidth="0.5"/>
      <circle cx={cx} cy={cy} r={innerR*0.6} fill="#2a2618"/>
      {/* Rust drip from housing bottom */}
      <line x1={cx} y1={cy+outerR+3} x2={cx} y2={cy+outerR+9}
        stroke="#3c1c08" strokeWidth="0.8" opacity="0.55"/>
    </g>
  )
}

// ── SVG gradient/filter defs ──────────────────────────────────────────────────
function Defs() {
  return (
    <defs>
      {/* Side wall / ceiling texture filter */}
      <filter id="f-side" x="-2%" y="-2%" width="104%" height="104%"
        colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.3 0.24"
          numOctaves="4" seed="8" result="surf"/>
        <feComponentTransfer in="surf" result="qS">
          <feFuncR type="discrete" tableValues="0.02 0.04 0.065 0.09 0.065 0.04 0.02"/>
          <feFuncG type="discrete" tableValues="0.017 0.035 0.057 0.079 0.057 0.035 0.017"/>
          <feFuncB type="discrete" tableValues="0.006 0.013 0.021 0.03 0.021 0.013 0.006"/>
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.78 0.58"
          numOctaves="2" seed="5" result="vein"/>
        <feColorMatrix in="vein" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  7 7 7 0 -5.2" result="vm"/>
        <feFlood floodColor="#010100" floodOpacity="0.92" result="cc"/>
        <feComposite in="cc" in2="vm" operator="in" result="cracks"/>
        <feBlend in="SourceGraphic" in2="qS" mode="multiply" result="s1"/>
        <feMerge><feMergeNode in="s1"/><feMergeNode in="cracks"/></feMerge>
      </filter>

      {/* Floor broken-tile filter */}
      <filter id="f-floor" x="-2%" y="-2%" width="104%" height="104%"
        colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.38 0.28"
          numOctaves="2" seed="14" result="tile"/>
        <feComponentTransfer in="tile" result="qT">
          <feFuncR type="discrete" tableValues="0.028 0.055 0.085 0.055 0.028"/>
          <feFuncG type="discrete" tableValues="0.024 0.048 0.074 0.048 0.024"/>
          <feFuncB type="discrete" tableValues="0.009 0.018 0.028 0.018 0.009"/>
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.68 0.42"
          numOctaves="1" seed="19" result="crackN"/>
        <feColorMatrix in="crackN" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  8 8 8 0 -6.2" result="cm"/>
        <feFlood floodColor="#010100" floodOpacity="0.95" result="cc"/>
        <feComposite in="cc" in2="cm" operator="in" result="cracks"/>
        <feBlend in="SourceGraphic" in2="qT" mode="multiply" result="s1"/>
        <feMerge><feMergeNode in="s1"/><feMergeNode in="cracks"/></feMerge>
      </filter>

      {/* Very subtle grime multiply for back wall overlay */}
      <filter id="f-grime" x="0%" y="0%" width="100%" height="100%"
        colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.08 0.06"
          numOctaves="3" seed="22" result="g"/>
        <feColorMatrix in="g" type="matrix"
          values="0 0 0 0 0.03  0 0 0 0 0.025  0 0 0 0 0.01  0 0 0 6 -4"
          result="gm"/>
        <feFlood floodColor="#030201" floodOpacity="0.55" result="gc"/>
        <feComposite in="gc" in2="gm" operator="in" result="gr"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gr"/></feMerge>
      </filter>

      {/* ── Light gradients ─────────────────────────────────────────────────── */}
      <radialGradient id="glow-wide" gradientUnits="userSpaceOnUse"
        cx="160" cy="90" r="170">
        <stop offset="0%"   stopColor="#d4a818" stopOpacity="0.72"/>
        <stop offset="16%"  stopColor="#a07812" stopOpacity="0.44"/>
        <stop offset="40%"  stopColor="#4a3406" stopOpacity="0.2"/>
        <stop offset="70%"  stopColor="#0e0a02" stopOpacity="0.06"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      <radialGradient id="glow-halo" gradientUnits="userSpaceOnUse"
        cx="160" cy="84" r="72">
        <stop offset="0%"   stopColor="#ecca28" stopOpacity="0.65"/>
        <stop offset="30%"  stopColor="#a07c1a" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      <radialGradient id="glow-desk" gradientUnits="userSpaceOnUse"
        cx="160" cy="126" r="68">
        <stop offset="0%"   stopColor="#6aaa1c" stopOpacity="0.28"/>
        <stop offset="50%"  stopColor="#2a4408" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      <radialGradient id="fog" gradientUnits="userSpaceOnUse"
        cx="160" cy="88" r="130">
        <stop offset="0%"   stopColor="#3c2e06" stopOpacity="0.3"/>
        <stop offset="35%"  stopColor="#1c1604" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      <radialGradient id="vig" gradientUnits="objectBoundingBox"
        cx="50%" cy="50%" r="68%">
        <stop offset="0%"   stopColor="#000" stopOpacity="0"/>
        <stop offset="44%"  stopColor="#000" stopOpacity="0.08"/>
        <stop offset="68%"  stopColor="#000" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="#000" stopOpacity="0.98"/>
      </radialGradient>
    </defs>
  )
}

// ── Side-wall vent grate ──────────────────────────────────────────────────────
function Vent({ x, y, w, h, slots = 4 }) {
  const sh = (h - 4) / slots
  return (
    <g>
      <rect x={x} y={y} width={w} height={h}
        fill="#0c0b07" stroke="#1a1912" strokeWidth="1"/>
      <rect x={x+1} y={y+1} width={w-2} height={h-2}
        fill="none" stroke="#222018" strokeWidth="1"/>
      {Array.from({length:slots}).map((_,i)=>(
        <rect key={i} x={x+2} y={y+2+i*sh} width={w-4}
          height={Math.max(1,sh-2)} fill="#060504" stroke="#111009" strokeWidth="0.5"/>
      ))}
      <rect x={x+1} y={y+h} width={w-2} height={3}
        fill="#1a0804" opacity="0.35"/>
    </g>
  )
}

// ── Main Room ─────────────────────────────────────────────────────────────────
export default function Room({ onComputerClick, scale = 1, settings }) {
  const showVents = settings?.decorations?.airVent?.show !== false

  return (
    <div style={{ position:'fixed', inset:0, background:'#030201', overflow:'hidden' }}>
      <style>{ANIM}</style>

      <div style={{
        position:'absolute', inset:'-1.5%',
        transformOrigin:'50% 58%',
        animation:'room-breathe 9s ease-in-out infinite',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
          style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            imageRendering:'pixelated',
          }}
        >
          <Defs/>

          {/* CEILING */}
          <polygon points={poly([[0,0],[W,0],[BR.x,BL.y],[BL.x,BL.y]])}
            fill="#0d0b06" filter="url(#f-side)"/>

          {/* LEFT WALL */}
          <polygon points={poly([[0,0],[BL.x,BL.y],[BLb.x,BLb.y],[0,H]])}
            fill="#0f0d07" filter="url(#f-side)"/>

          {/* RIGHT WALL */}
          <polygon points={poly([[BR.x,BR.y],[W,0],[W,H],[BRb.x,BRb.y]])}
            fill="#0f0d07" filter="url(#f-side)"/>

          {/* FLOOR */}
          <polygon points={poly([[BLb.x,BLb.y],[BRb.x,BRb.y],[W,H],[0,H]])}
            fill="#100e07" filter="url(#f-floor)"/>

          {/* ── BACK WALL: procedural stone blocks ──────────────────────── */}
          <BackWall x={BL.x} y={BL.y} w={BR.x-BL.x} h={BLb.y-BL.y}/>

          {/* ── PIPES (upper-left of back wall) ────────────────────────── */}
          <Pipes x={BL.x} y={BL.y}/>

          {/* ── FAN VENT (upper-right, matching reference) ─────────────── */}
          {showVents && <FanVent cx={256} cy={56}/>}

          {/* ── SIDE WALL VENTS ────────────────────────────────────────── */}
          {showVents && <>
            <Vent x={2}   y={60} w={20} h={28} slots={4}/>
            <Vent x={298} y={60} w={20} h={28} slots={4}/>
            {/* Ceiling vent */}
            <Vent x={143} y={3}  w={34} h={22} slots={5}/>
          </>}

          {/* ── WALL SEAM LINES ────────────────────────────────────────── */}
          <line x1={BL.x}  y1={BL.y}  x2={BLb.x} y2={BLb.y} stroke="#1e1c10" strokeWidth="1"/>
          <line x1={BR.x}  y1={BR.y}  x2={BRb.x} y2={BRb.y} stroke="#1e1c10" strokeWidth="1"/>
          <line x1={BL.x}  y1={BL.y}  x2={BR.x}  y2={BR.y}  stroke="#1e1c10" strokeWidth="1"/>
          <line x1={BLb.x} y1={BLb.y} x2={BRb.x} y2={BRb.y} stroke="#1e1c10" strokeWidth="1"/>

          {/* ── GLOW OVERLAYS ──────────────────────────────────────────── */}
          <rect x={BL.x} y={BL.y} width={BR.x-BL.x} height={BLb.y-BL.y}
            fill="url(#glow-halo)" style={{pointerEvents:'none'}}/>
          <rect x={0} y={0} width={W} height={H}
            fill="url(#glow-wide)" style={{pointerEvents:'none'}}/>

          {/* ── DESK ───────────────────────────────────────────────────── */}
          <rect x={78} y={124} width={164} height={6} fill="#2c1e0b"/>
          <rect x={78} y={129} width={164} height={2} fill="#160c04"/>
          {[100,120,145,170,195,218].map(x=>(
            <line key={x} x1={x} y1={124} x2={x} y2={130}
              stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
          ))}
          <rect x={78} y={124} width={164} height={6}
            fill="url(#glow-desk)" style={{pointerEvents:'none'}}/>
          <rect x={84}  y={130} width={5} height={18} fill="#1e1208"/>
          <rect x={231} y={130} width={5} height={18} fill="#1e1208"/>

          {/* ── FLOOR GRIME ────────────────────────────────────────────── */}
          <ellipse cx={110} cy={158} rx={14} ry={5} fill="#070503" opacity="0.55"/>
          <ellipse cx={205} cy={163} rx={10} ry={4} fill="#070503" opacity="0.45"/>
          <ellipse cx={155} cy={170} rx={18} ry={4} fill="#070503" opacity="0.35"/>

          {/* ── FOG ────────────────────────────────────────────────────── */}
          <rect x={0} y={0} width={W} height={H}
            fill="url(#fog)" opacity="0.8" style={{pointerEvents:'none'}}/>

          {/* ── VIGNETTE ───────────────────────────────────────────────── */}
          <rect x={0} y={0} width={W} height={H}
            fill="url(#vig)" style={{pointerEvents:'none'}}/>

          {/* ── FLOOR SHADOW UNDER DESK ────────────────────────────────── */}
          <ellipse cx={160} cy={147} rx={60} ry={7}
            fill="#000" opacity="0.75"
            style={{animation:'shadow-breathe 4s ease-in-out infinite'}}/>
        </svg>

        {/* Monitor CSS glow (flickers) */}
        <div style={{
          position:'absolute', left:'50%', top:'44%',
          transform:'translate(-50%,-50%)',
          width:'68%', height:'58%',
          background:'radial-gradient(ellipse at 50% 65%, rgba(190,148,16,0.5) 0%, rgba(100,76,8,0.22) 28%, transparent 68%)',
          pointerEvents:'none', zIndex:8,
          animation:'glow-flicker 7s ease-in-out infinite',
        }}/>

        {/* Fog pulse */}
        <div style={{
          position:'absolute', inset:0,
          background:'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(50,38,6,0.22) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:9,
          animation:'fog-pulse 14s ease-in-out infinite',
        }}/>

        {/* Computer */}
        <div style={{
          position:'absolute', left:'50%', bottom:'29%',
          transform:'translateX(-50%)',
          zIndex:10,
        }}>
          <Computer onClick={onComputerClick} scale={scale}/>
        </div>
      </div>

      <HorrorOverlay/>
    </div>
  )
}
