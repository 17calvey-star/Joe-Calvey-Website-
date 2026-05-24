import Computer from './Computer'
import HorrorOverlay from './HorrorOverlay'

// ── CSS animations injected once ─────────────────────────────────────────────
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
`

// Room drawn at 320×180 "pixel art" resolution — CSS scales it up with
// imageRendering:pixelated so every SVG pixel becomes a crisp 4×4 screen block.
const W = 320, H = 180

// Perspective corner coords (all in 320×180 space)
// Back wall: x 42–278, y 36–148   Side strips ~13% each
const BL = { x:42,  y:36  }   // Back-wall top-left
const BR = { x:278, y:36  }   // Back-wall top-right
const BLb= { x:42,  y:148 }   // Back-wall bot-left
const BRb= { x:278, y:148 }   // Back-wall bot-right

function poly(pts){ return pts.map(([x,y])=>`${x},${y}`).join(' ') }

// ── SVG filter + gradient definitions ────────────────────────────────────────
function Defs() {
  return (
    <defs>

      {/* ─── BACK WALL: chunky pixel-art dirt/crack/stain ─────────────────── */}
      <filter id="f-back" x="-2%" y="-2%" width="104%" height="104%"
        colorInterpolationFilters="sRGB">

        {/* Layer A – large blotchy mould/water damage (3-tone posterise) */}
        <feTurbulence type="fractalNoise" baseFrequency="0.07 0.055"
          numOctaves="3" seed="6" result="blotch"/>
        <feComponentTransfer in="blotch" result="qB">
          <feFuncR type="discrete" tableValues="0.03 0.06 0.10 0.06 0.03"/>
          <feFuncG type="discrete" tableValues="0.027 0.054 0.09 0.054 0.027"/>
          <feFuncB type="discrete" tableValues="0.01 0.02 0.034 0.02 0.01"/>
        </feComponentTransfer>

        {/* Layer B – chunky surface pixel noise (the main "texture") */}
        <feTurbulence type="fractalNoise" baseFrequency="0.3 0.24"
          numOctaves="4" seed="3" result="surf"/>
        <feComponentTransfer in="surf" result="qS">
          <feFuncR type="discrete" tableValues="0.03 0.055 0.085 0.12 0.085 0.055 0.03"/>
          <feFuncG type="discrete" tableValues="0.026 0.048 0.075 0.106 0.075 0.048 0.026"/>
          <feFuncB type="discrete" tableValues="0.01 0.018 0.028 0.04 0.028 0.018 0.01"/>
        </feComponentTransfer>

        {/* Layer C – thin crack veins */}
        <feTurbulence type="fractalNoise" baseFrequency="0.78 0.58"
          numOctaves="2" seed="11" result="vein"/>
        <feColorMatrix in="vein" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  7 7 7 0 -5.2"
          result="vein-mask"/>
        <feFlood floodColor="#010100" floodOpacity="0.92" result="crack-col"/>
        <feComposite in="crack-col" in2="vein-mask" operator="in" result="cracks"/>

        {/* Layer D – large dark stain blobs */}
        <feTurbulence type="fractalNoise" baseFrequency="0.1 0.075"
          numOctaves="2" seed="17" result="stainN"/>
        <feColorMatrix in="stainN" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 -5 -5 0 3.6"
          result="stain-mask"/>
        <feFlood floodColor="#030201" floodOpacity="0.88" result="stain-col"/>
        <feComposite in="stain-col" in2="stain-mask" operator="in" result="stains"/>

        {/* Layer E – rust / blood smear (barely-there dark red) */}
        <feTurbulence type="turbulence" baseFrequency="0.19 0.13"
          numOctaves="1" seed="29" result="rustN"/>
        <feColorMatrix in="rustN" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 9 9 0 -7"
          result="rust-mask"/>
        <feFlood floodColor="#2e0704" floodOpacity="0.28" result="rust-col"/>
        <feComposite in="rust-col" in2="rust-mask" operator="in" result="rust"/>

        {/* Compose: base × blotch × surf, then add cracks/stains/rust on top */}
        <feBlend in="SourceGraphic" in2="qB" mode="multiply" result="s1"/>
        <feBlend in="s1"            in2="qS" mode="multiply" result="s2"/>
        <feMerge>
          <feMergeNode in="s2"/>
          <feMergeNode in="cracks"/>
          <feMergeNode in="stains"/>
          <feMergeNode in="rust"/>
        </feMerge>
      </filter>

      {/* ─── SIDE WALLS / CEILING (darker, fewer detail passes) ──────────── */}
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
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  7 7 7 0 -5.2"
          result="vein-mask"/>
        <feFlood floodColor="#010100" floodOpacity="0.92" result="cc"/>
        <feComposite in="cc" in2="vein-mask" operator="in" result="cracks"/>
        <feBlend in="SourceGraphic" in2="qS" mode="multiply" result="s1"/>
        <feMerge>
          <feMergeNode in="s1"/>
          <feMergeNode in="cracks"/>
        </feMerge>
      </filter>

      {/* ─── FLOOR: broken tile pattern ───────────────────────────────────── */}
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
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  8 8 8 0 -6.2"
          result="crack-mask"/>
        <feFlood floodColor="#010100" floodOpacity="0.95" result="cc"/>
        <feComposite in="cc" in2="crack-mask" operator="in" result="cracks"/>
        <feBlend in="SourceGraphic" in2="qT" mode="multiply" result="s1"/>
        <feMerge>
          <feMergeNode in="s1"/>
          <feMergeNode in="cracks"/>
        </feMerge>
      </filter>

      {/* ─── LIGHT GRADIENTS ──────────────────────────────────────────────── */}
      {/* Wide amber room glow */}
      <radialGradient id="glow-wide" gradientUnits="userSpaceOnUse"
        cx="160" cy="90" r="170">
        <stop offset="0%"   stopColor="#d4a818" stopOpacity="0.72"/>
        <stop offset="16%"  stopColor="#a07812" stopOpacity="0.44"/>
        <stop offset="40%"  stopColor="#4a3406" stopOpacity="0.2"/>
        <stop offset="70%"  stopColor="#0e0a02" stopOpacity="0.06"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      {/* Tight wall halo (right behind monitor) */}
      <radialGradient id="glow-halo" gradientUnits="userSpaceOnUse"
        cx="160" cy="84" r="72">
        <stop offset="0%"   stopColor="#ecca28" stopOpacity="0.65"/>
        <stop offset="30%"  stopColor="#a07c1a" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      {/* Desk surface glow (green tinge from screen below) */}
      <radialGradient id="glow-desk" gradientUnits="userSpaceOnUse"
        cx="160" cy="126" r="68">
        <stop offset="0%"   stopColor="#6aaa1c" stopOpacity="0.28"/>
        <stop offset="50%"  stopColor="#2a4408" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      {/* Volumetric fog around glow */}
      <radialGradient id="fog" gradientUnits="userSpaceOnUse"
        cx="160" cy="88" r="130">
        <stop offset="0%"   stopColor="#3c2e06" stopOpacity="0.3"/>
        <stop offset="35%"  stopColor="#1c1604" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>

      {/* Deep corner vignette */}
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

// ── Vent grate helper ─────────────────────────────────────────────────────────
function Vent({ x, y, w, h, slots = 4 }) {
  const sh = (h - 4) / slots
  return (
    <g>
      <rect x={x}   y={y}   width={w} height={h} fill="#0c0b07" stroke="#1a1912" strokeWidth="1"/>
      <rect x={x+1} y={y+1} width={w-2} height={h-2} fill="none" stroke="#222018" strokeWidth="1"/>
      {Array.from({length:slots}).map((_,i)=>(
        <rect key={i} x={x+2} y={y+2+i*sh} width={w-4} height={Math.max(1,sh-2)}
          fill="#060504" stroke="#111009" strokeWidth="0.5"/>
      ))}
      {/* rust stain below vent */}
      <rect x={x+1} y={y+h} width={w-2} height={3} fill="#1a0804" opacity="0.35"/>
    </g>
  )
}

// ── Main Room ─────────────────────────────────────────────────────────────────
export default function Room({ onComputerClick, scale = 1, settings }) {
  const showVents = settings?.decorations?.airVent?.show !== false

  return (
    <div style={{ position:'fixed', inset:0, background:'#030201', overflow:'hidden' }}>
      <style>{ANIM}</style>

      {/* ── Slow camera-breathe wrapper ─────────────────────────────────────── */}
      <div style={{
        position:'absolute', inset:'-1.5%',
        transformOrigin:'50% 58%',
        animation:'room-breathe 9s ease-in-out infinite',
      }}>

        {/* ── LOW-RES SVG room — 320×180 → pixelated upscale ──────────────── */}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
          style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            imageRendering:'pixelated',
          }}
        >
          <Defs/>

          {/* CEILING */}
          <polygon
            points={poly([[0,0],[W,0],[BR.x,BL.y],[BL.x,BL.y]])}
            fill="#0d0b06" filter="url(#f-side)"/>

          {/* LEFT WALL */}
          <polygon
            points={poly([[0,0],[BL.x,BL.y],[BLb.x,BLb.y],[0,H]])}
            fill="#0f0d07" filter="url(#f-side)"/>

          {/* RIGHT WALL */}
          <polygon
            points={poly([[BR.x,BR.y],[W,0],[W,H],[BRb.x,BRb.y]])}
            fill="#0f0d07" filter="url(#f-side)"/>

          {/* FLOOR */}
          <polygon
            points={poly([[BLb.x,BLb.y],[BRb.x,BRb.y],[W,H],[0,H]])}
            fill="#100e07" filter="url(#f-floor)"/>

          {/* BACK WALL */}
          <rect x={BL.x} y={BL.y} width={BR.x-BL.x} height={BLb.y-BL.y}
            fill="#1e1b0f" filter="url(#f-back)"/>

          {/* Wall → back-wall seam lines */}
          <line x1={BL.x}  y1={BL.y}  x2={BLb.x} y2={BLb.y} stroke="#282215" strokeWidth="1"/>
          <line x1={BR.x}  y1={BR.y}  x2={BRb.x} y2={BRb.y} stroke="#282215" strokeWidth="1"/>
          <line x1={BL.x}  y1={BL.y}  x2={BR.x}  y2={BR.y}  stroke="#282215" strokeWidth="1"/>
          <line x1={BLb.x} y1={BLb.y} x2={BRb.x} y2={BRb.y} stroke="#282215" strokeWidth="1"/>

          {/* ── GLOW ON BACK WALL ──────────────────────────────────────────── */}
          <rect x={BL.x} y={BL.y} width={BR.x-BL.x} height={BLb.y-BL.y}
            fill="url(#glow-halo)" style={{pointerEvents:'none'}}/>

          {/* ── AMBIENT ROOM GLOW (whole SVG) ────────────────────────────── */}
          <rect x={0} y={0} width={W} height={H}
            fill="url(#glow-wide)" style={{pointerEvents:'none'}}/>

          {/* ── DESK ─────────────────────────────────────────────────────── */}
          {/* surface */}
          <rect x={78} y={124} width={164} height={6} fill="#2c1e0b"/>
          {/* front edge dark */}
          <rect x={78} y={129} width={164} height={2} fill="#160c04"/>
          {/* grain lines */}
          {[100,120,145,170,195,218].map(x=>(
            <line key={x} x1={x} y1={124} x2={x} y2={130}
              stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
          ))}
          {/* desk glow */}
          <rect x={78} y={124} width={164} height={6}
            fill="url(#glow-desk)" style={{pointerEvents:'none'}}/>
          {/* legs */}
          <rect x={84}  y={130} width={5} height={18} fill="#1e1208"/>
          <rect x={231} y={130} width={5} height={18} fill="#1e1208"/>

          {/* ── VENTS ────────────────────────────────────────────────────── */}
          {showVents && <>
            {/* Ceiling vent — top centre */}
            <Vent x={143} y={3}  w={34} h={22} slots={5}/>
            {/* Left wall vent */}
            <Vent x={2}   y={60} w={20} h={28} slots={4}/>
            {/* Right wall vent */}
            <Vent x={298} y={60} w={20} h={28} slots={4}/>
            {/* Back wall vent — upper right */}
            <Vent x={242} y={48} w={26} h={18} slots={3}/>
          </>}

          {/* ── HORROR DETAILS ───────────────────────────────────────────── */}

          {/* Vertical water-damage streaks on back wall */}
          <rect x={92}  y={42} width={2} height={44} fill="#080604" opacity="0.55"/>
          <rect x={93}  y={44} width={1} height={56} fill="#060402" opacity="0.45"/>
          <rect x={220} y={46} width={2} height={50} fill="#080604" opacity="0.5"/>
          <rect x={221} y={60} width={1} height={36} fill="#060402" opacity="0.4"/>

          {/* Mould/damage patches */}
          <ellipse cx={105} cy={75}  rx={9}  ry={6}  fill="#050302" opacity="0.55"/>
          <ellipse cx={210} cy={92}  rx={7}  ry={9}  fill="#050302" opacity="0.5"/>
          <ellipse cx={161} cy={56}  rx={5}  ry={3}  fill="#060403" opacity="0.45"/>
          <ellipse cx={240} cy={108} rx={6}  ry={4}  fill="#050302" opacity="0.4"/>

          {/* Blood/rust smear — upper right corner of back wall */}
          <rect x={260} y={78}  width={10} height={16} fill="#240804" opacity="0.22"/>
          <rect x={262} y={94}  width={6}  height={9}  fill="#1c0602" opacity="0.18"/>
          <rect x={263} y={103} width={3}  height={4}  fill="#1c0602" opacity="0.14"/>

          {/* Floor grime patches */}
          <ellipse cx={110} cy={158} rx={14} ry={5}  fill="#070503" opacity="0.55"/>
          <ellipse cx={205} cy={163} rx={10} ry={4}  fill="#070503" opacity="0.45"/>
          <ellipse cx={155} cy={170} rx={18} ry={4}  fill="#070503" opacity="0.35"/>

          {/* Ceiling corner damage */}
          <ellipse cx={55}  cy={10} rx={8}  ry={5}  fill="#080604" opacity="0.4"/>
          <ellipse cx={265} cy={12} rx={7}  ry={4}  fill="#080604" opacity="0.35"/>

          {/* ── VOLUMETRIC FOG around monitor ────────────────────────────── */}
          <rect x={0} y={0} width={W} height={H}
            fill="url(#fog)" opacity="0.8" style={{pointerEvents:'none'}}/>

          {/* ── DEEP VIGNETTE ────────────────────────────────────────────── */}
          <rect x={0} y={0} width={W} height={H}
            fill="url(#vig)" style={{pointerEvents:'none'}}/>

          {/* ── Floor shadow under desk ───────────────────────────────────── */}
          <ellipse cx={160} cy={147} rx={60} ry={7}
            fill="#000" opacity="0.75"
            style={{animation:'shadow-breathe 4s ease-in-out infinite'}}/>

        </svg>{/* end SVG */}

        {/* ── Monitor glow layer (CSS, flickers in sync with Computer) ───── */}
        <div style={{
          position:'absolute', left:'50%', top:'44%',
          transform:'translate(-50%,-50%)',
          width:'68%', height:'58%',
          background:'radial-gradient(ellipse at 50% 65%, rgba(190,148,16,0.5) 0%, rgba(100,76,8,0.22) 28%, transparent 68%)',
          pointerEvents:'none', zIndex:8,
          animation:'glow-flicker 7s ease-in-out infinite',
        }}/>

        {/* ── Atmospheric fog (CSS, slow pulse) ───────────────────────────── */}
        <div style={{
          position:'absolute', inset:0,
          background:'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(50,38,6,0.22) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:9,
          animation:'fog-pulse 14s ease-in-out infinite',
        }}/>

        {/* ── Computer component ──────────────────────────────────────────── */}
        {/* Desk surface is y=124/180 = 68.9% from top → bottom ≈ 31.1%     */}
        <div style={{
          position:'absolute', left:'50%', bottom:'29%',
          transform:'translateX(-50%)',
          zIndex:10,
        }}>
          <Computer onClick={onComputerClick} scale={scale}/>
        </div>

      </div>{/* end breathe wrapper */}

      {/* ── Post-processing overlay (grain, scanlines, dust) ────────────── */}
      <HorrorOverlay/>
    </div>
  )
}
