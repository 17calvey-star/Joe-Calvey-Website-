import { useState, useEffect, useRef, useCallback } from 'react'
import HorrorOverlay from './HorrorOverlay'
import SafeLock from './SafeLock'
import roomBg    from '../assets/images/RB.png'
import fanImg    from '../assets/images/FAN.png'
import amBookImg       from '../assets/images/AMmug.png'
import boxesImg        from '../assets/images/Boxes.png'
import safeWebImg      from '../assets/images/SafeWeb1.png'
import safeOpenedImg  from '../assets/images/SafeOpened1.png'
import tableOverlayImg from '../assets/images/Tableoverlay.png'
import contactPhoneImg from '../assets/images/ContactPhone.png'
import windowImg       from '../assets/images/WindowWS.png'
import buntingImg      from '../assets/images/SummerBunting.png'
import autumnBuntingImg from '../assets/images/AutumnBunting.png'
import outsideImg      from '../assets/images/icontp.png'
import fridgeAmbient from '../assets/audio/ambient/fridge.mp3'

// ── Ambient audio ─────────────────────────────────────────────────────────────
// Volume for the fridge hum loop. Adjust here to taste (0 = silent, 1 = full).
const AMBIENT_VOLUME = 0.25

// ── Animations ────────────────────────────────────────────────────────────────
const ANIM = `
@keyframes room-breathe {
  0%,100% { transform: scale(1) translateZ(0);     }
  50%      { transform: scale(1.006) translateZ(0); }
}
@keyframes crt-flicker {
  0%,100% { opacity:1;    }
  4%      { opacity:0.86; }
  5%      { opacity:1;    }
  49%     { opacity:0.80; }
  50%     { opacity:0.96; }
  83%     { opacity:0.90; }
  84%     { opacity:1;    }
}
@keyframes cursor-blink {
  0%,45%  { opacity:1; }
  50%,95% { opacity:0; }
  100%    { opacity:1; }
}
@keyframes phosphor-glow {
  0%,100% { opacity:0.8; }
  50%     { opacity:1;   }
}
@keyframes screen-ambient {
  0%,100% { opacity:0.35; }
  50%     { opacity:0.65; }
}
@keyframes title-fade {
  0%   { opacity:0; transform:translateY(-4px); }
  100% { opacity:1; transform:translateY(0); }
}
@keyframes fan-spin {
  to { transform: rotate(360deg); }
}
@keyframes vent-zoom {
  0%   { transform: scale(1)   translateZ(0); filter: brightness(1);    }
  65%  { transform: scale(4.5) translateZ(0); filter: brightness(0.35); }
  100% { transform: scale(7)   translateZ(0); filter: brightness(0);    }
}
@keyframes leaf-drift {
  0%   { transform: translate(0px,  0px);  opacity: 0;    }
  6%   { opacity: 0.80; }
  25%  { transform: translate( 5px,  18px); opacity: 0.72; }
  50%  { transform: translate(-4px,  38px); opacity: 0.55; }
  75%  { transform: translate( 6px,  57px); opacity: 0.30; }
  92%  { opacity: 0.08; }
  100% { transform: translate(-3px,  75px); opacity: 0;   }
}
@keyframes leaf-drift-fast {
  0%   { transform: translate(0px,  0px);  opacity: 0;    }
  5%   { opacity: 0.85; }
  30%  { transform: translate(-4px,  22px); opacity: 0.70; }
  65%  { transform: translate( 5px,  50px); opacity: 0.40; }
  90%  { opacity: 0.08; }
  100% { transform: translate(-2px,  75px); opacity: 0;   }
}
@keyframes leaf-spin {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}
@keyframes rain-fall {
  from { transform: translateY(-28px); }
  to   { transform: translateY(85px);  }
}
@keyframes cat-blink {
  0%,  88%,  100% { transform: scaleY(1);    }
  91%             { transform: scaleY(0.05); }
  94%             { transform: scaleY(1);    }
}
@keyframes cat-glow-pulse {
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.70; }
}
@keyframes cat-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes steam-wisp {
  0%   { transform: translateY(0px)   translateX(0px);   opacity: 0.35; }
  20%  { transform: translateY(-11px) translateX(3px);   opacity: 0.42; }
  40%  { transform: translateY(-23px) translateX(-2px);  opacity: 0.35; }
  60%  { transform: translateY(-35px) translateX(2.5px); opacity: 0.20; }
  80%  { transform: translateY(-46px) translateX(-1px);  opacity: 0.08; }
  100% { transform: translateY(-56px) translateX(1px);   opacity: 0;    }
}
@keyframes vent-fade-black {
  0%   { opacity: 0; }
  35%  { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes phone-ring {
  0%,100% { transform: rotate(0deg); }
  10%     { transform: rotate(-8deg); }
  20%     { transform: rotate(8deg); }
  30%     { transform: rotate(-6deg); }
  40%     { transform: rotate(6deg); }
  50%     { transform: rotate(-4deg); }
  60%     { transform: rotate(4deg); }
  70%     { transform: rotate(0deg); }
}
`

// ── Image dimensions (1402 × 1122) ─────────────────────────────────────────────
const IMG_W = 1402
const IMG_H = 1122


// ── CRT screen glass bounds — pixel-sampled from RB.png ───────────────────────
// Left edge: x≈633, right: x≈767 (w=134). Top: y≈555, bottom: y≈633 (h=78).
// Trimmed to stay well inside the glass — avoids bezel overlap top/bottom.
const SCR = { x: 632, y: 550, w: 136, h: 98 }

// ── Fan overlay — position & speed ───────────────────────────────────────────
// FAN_CX/CY: center of the blade area in SVG image coordinates
// FAN_R:     spinning image half-size (controls visual scale of blades)
// FAN_SPEED: CSS animation duration — lower = faster (e.g. '4s', '8s')
// To swap the fan image: change the fanImg import at the top of this file
const FAN_CX    = 1046   // SVG x center of fan (pixel-sampled from RB.png)
const FAN_CY    = 275    // SVG y center of fan
const FAN_R     = 48     // blade radius in SVG units (housing ≈52 so blades fit inside)
const FAN_SPEED = '5s'   // full rotation duration

// ── About Me book — position ──────────────────────────────────────────────────
// Sits on the RIGHT side of the desk — larger and clearly readable
// To reposition: adjust BOOK_X / BOOK_Y / BOOK_W / BOOK_H
// To swap the image: change the amBookImg import at the top of this file
const BOOK_X = 784    // SVG x (left edge of book) — far right of desk
const BOOK_Y = 668    // SVG y (top edge of book) — sits on desk surface
const BOOK_W = 173    // SVG width  — noticeably larger for readability
const BOOK_H = 85     // SVG height

// ── Boxes — bottom-left corner of room, next to desk ─────────────────────────
const BOXES_X = 0     // SVG x (left edge)
const BOXES_Y = 590   // SVG y (top edge) — bottom sits on floor
const BOXES_W = 520   // SVG width
const BOXES_H = 500   // SVG height

// ── Table corner overlay — sits in front of safe/boxes ────────────────────────
// 🔧 Adjust TABLE_X/Y/W/H to reposition; image imported as tableOverlayImg
const TABLE_X = 448           // SVG x offset
const TABLE_Y = 400           // SVG y offset
const TABLE_W = IMG_W - 510   // SVG width  (892)
const TABLE_H = IMG_H - 510   // SVG height (612)

// ── SafeWeb — right side of room, against the far wall ────────────────────────
// 🔧 Adjust SAFEWEB_X/Y/W/H to reposition; image imported as safeWebImg
const SAFEWEB_X = 813   // SVG x — right wall area
const SAFEWEB_Y = 485   // SVG y — sits on floor
const SAFEWEB_W = 560   // SVG width
const SAFEWEB_H = 540   // SVG height

// ── Contact phone — position on LEFT side of desk ─────────────────────────────
// 🔧 To reposition: adjust PHONE_X / PHONE_Y / PHONE_W / PHONE_H
// 🔧 To swap image: change the contactPhoneImg import at the top of this file
const PHONE_X  = 452   // SVG x (left edge) — left desk area
const PHONE_Y  = 640   // SVG y — so bottom (660+70=730) sits on desk surface
const PHONE_W  = 160   // SVG width
const PHONE_H  = 140   // SVG height

// ── Barred window — upper-left back wall ──────────────────────────────────────
// 🔧 Adjust WIN_X / WIN_Y / WIN_W / WIN_H to reposition
const WIN_X = 347   // SVG x (left edge)
const WIN_Y = 203   // SVG y (top edge)
const WIN_W = 320   // SVG width
const WIN_H = 310   // SVG height

// ── Autumn leaves — pre-calculated, fall vertically down through the window ──────
const AUTUMN_LEAVES = Array.from({ length: 22 }, (_, i) => ({
  x:     4 + (i * 13) % 260,                     // spread across window width
  y:     -12 - (i * 7) % 20,                     // start above window top
  rx:    1.6 + (i % 4) * 0.6,                    // leaf width
  ry:    2.8 + (i % 5) * 0.7,                    // leaf height
  rot:   (i * 53) % 360,                          // initial rotation
  fast:  i % 3 === 0,                             // every 3rd leaf falls fast
  dur:   i % 3 === 0 ? 2.8 + (i % 4) * 0.4       // fast: 2.8 – 4.0s
                      : 5.0 + (i % 5) * 0.7,      // slow: 5.0 – 8.0s
  dly:   (i * 0.45) % 4.5,
  color: ['rgba(195,80,15', 'rgba(165,55,8', 'rgba(210,115,22', 'rgba(145,45,5', 'rgba(180,95,20', 'rgba(220,140,30'][i % 6],
}))

// ── Rain drops — pre-calculated so they don't change on re-render ─────────────
const RAIN_DROPS = Array.from({ length: 32 }, (_, i) => ({
  x:   (i * 113 + 17) % 275,          // spread across window width
  dur: 0.50 + (i % 8) * 0.055,        // 0.50 – 0.885s
  dly: (i * 0.09) % 0.85,             // stagger
  len: 8  + (i % 6) * 3,             // 8 – 23px streak length
  dx:  1  + (i % 3),                  // 1–3px horizontal angle
  op:  0.18 + (i % 5) * 0.09,         // 0.18 – 0.54 opacity
}))

// ── Window outside scene ──────────────────────────────────────────────────────
// 🔧 To add an outside image: set OUTSIDE_IMG = outsideImg (imported above)
const OUTSIDE_IMG = null

// ── Cat eyes — hidden under the table after visiting the vent ─────────────────
// 🔧 Adjust CAT_X / CAT_Y to reposition; CAT_GAP = distance between eye centres
const CAT_X   = 545   // SVG x midpoint between eyes
const CAT_Y   = 848   // SVG y — shadow under the desk
const CAT_GAP = 26    // px between eye centres

// ── SVG defs ──────────────────────────────────────────────────────────────────
function Defs() {
  return (
    <defs>
      {/* Scanline tiling pattern */}
      <pattern id="crt-scan" x="0" y="0" width={SCR.w} height="5"
        patternUnits="userSpaceOnUse" patternTransform={`translate(${SCR.x},${SCR.y})`}>
        <rect width={SCR.w} height="2" fill="rgba(0,0,0,0.16)"/>
      </pattern>

      {/* CRT corner vignette */}
      <radialGradient id="crt-vig" cx="50%" cy="50%" r="62%"
        gradientUnits="objectBoundingBox">
        <stop offset="0%"   stopColor="black" stopOpacity="0"/>
        <stop offset="48%"  stopColor="black" stopOpacity="0"/>
        <stop offset="100%" stopColor="black" stopOpacity="0.72"/>
      </radialGradient>

      {/* Green phosphor base tint */}
      <linearGradient id="phosphor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#020c03"/>
        <stop offset="50%"  stopColor="#040e06"/>
        <stop offset="100%" stopColor="#020c03"/>
      </linearGradient>

      {/* Autumn fog — warm amber-brown haze at window base */}
      <linearGradient id="autumn-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
        <stop offset="100%" stopColor="rgba(35,18,4,0.80)"/>
      </linearGradient>

      {/* Outside window — edge vignette for depth */}
      <radialGradient id="outside-vignette" cx="50%" cy="50%" r="70%"
        gradientUnits="objectBoundingBox">
        <stop offset="0%"   stopColor="black" stopOpacity="0"/>
        <stop offset="70%"  stopColor="black" stopOpacity="0.15"/>
        <stop offset="100%" stopColor="black" stopOpacity="0.55"/>
      </radialGradient>

      {/* Hover green bloom */}
      <radialGradient id="hover-bloom" cx="50%" cy="50%" r="65%"
        gradientUnits="objectBoundingBox">
        <stop offset="0%"   stopColor="#00ff55" stopOpacity="0.07"/>
        <stop offset="55%"  stopColor="#00cc44" stopOpacity="0.03"/>
        <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
      </radialGradient>

      {/* Phosphor glow filter — idle (softer) */}
      <filter id="idle-glow" x="-20%" y="-20%" width="140%" height="140%"
        colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0   0 1 0 0 0.45   0 0 0 0 0   0 0 0 0.3 0"
          result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>

      {/* Hover bloom — cinematic, not overpowering */}
      <filter id="hover-glow" x="-30%" y="-30%" width="160%" height="160%"
        colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0   0 1 0 0 0.72   0 0 0 0 0   0 0 0 0.70 0"
          result="glow"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="innerBlur"/>
        <feColorMatrix in="innerBlur" type="matrix"
          values="0 0 0 0 0   0 1 0 0 0.50   0 0 0 0 0   0 0 0 0.55 0"
          result="innerGlow"/>
        <feMerge>
          <feMergeNode in="glow"/>
          <feMergeNode in="innerGlow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      {/* Subtle chromatic aberration on hover text */}
      <filter id="chroma" x="-5%" y="-5%" width="110%" height="110%">
        <feOffset in="SourceGraphic" dx="-1" dy="0" result="r"/>
        <feOffset in="SourceGraphic" dx="1"  dy="0" result="b"/>
        <feColorMatrix in="r" type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>
        <feColorMatrix in="b" type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>
        <feMerge>
          <feMergeNode in="red"/>
          <feMergeNode in="blue"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      {/* Clip screen content to rounded CRT corners */}
      <clipPath id="scr-clip">
        <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx="5" ry="4"/>
      </clipPath>

      {/* Mug hover — warm amber/orange glow matching the phone */}
      <filter id="mug-glow" x="-40%" y="-40%" width="180%" height="180%"
        colorInterpolationFilters="sRGB">
        <feComponentTransfer in="SourceGraphic" result="bright">
          <feFuncR type="linear" slope="1.40"/>
          <feFuncG type="linear" slope="1.20"/>
          <feFuncB type="linear" slope="0.90"/>
        </feComponentTransfer>
        <feGaussianBlur in="bright" stdDeviation="9" result="halo"/>
        <feColorMatrix in="halo" type="matrix"
          values="0 0 0 0 0.90  0 0 0 0 0.50  0 0 0 0 0.00  0 0 0 0.50 0"
          result="amberHalo"/>
        <feGaussianBlur in="bright" stdDeviation="2.5" result="innerBlur"/>
        <feColorMatrix in="innerBlur" type="matrix"
          values="0 0 0 0 1.00  0 0 0 0 0.65  0 0 0 0 0.05  0 0 0 0.60 0"
          result="innerGlow"/>
        <feMerge>
          <feMergeNode in="amberHalo"/>
          <feMergeNode in="innerGlow"/>
          <feMergeNode in="bright"/>
        </feMerge>
      </filter>

      {/* Book idle — always-on soft purple shimmer */}
      <filter id="book-idle" x="-35%" y="-35%" width="170%" height="170%"
        colorInterpolationFilters="sRGB">
        <feComponentTransfer in="SourceGraphic" result="bright">
          <feFuncR type="linear" slope="1.15"/>
          <feFuncG type="linear" slope="1.05"/>
          <feFuncB type="linear" slope="1.25"/>
        </feComponentTransfer>
        <feGaussianBlur in="bright" stdDeviation="5" result="halo"/>
        <feColorMatrix in="halo" type="matrix"
          values="0 0 0 0 0.30  0 0 0 0 0.05  0 0 0 0 0.65  0 0 0 0.45 0"
          result="idleHalo"/>
        <feMerge>
          <feMergeNode in="idleHalo"/>
          <feMergeNode in="bright"/>
        </feMerge>
      </filter>

      {/* Book hover — bright glow that makes cover text shine */}
      <filter id="book-glow" x="-40%" y="-40%" width="180%" height="180%"
        colorInterpolationFilters="sRGB">
        {/* Brightness pass — lifts the whole image so text pops */}
        <feComponentTransfer in="SourceGraphic" result="bright">
          <feFuncR type="linear" slope="1.45"/>
          <feFuncG type="linear" slope="1.25"/>
          <feFuncB type="linear" slope="1.70"/>
        </feComponentTransfer>
        {/* Wide soft halo */}
        <feGaussianBlur in="bright" stdDeviation="10" result="halo"/>
        <feColorMatrix in="halo" type="matrix"
          values="0 0 0 0 0.50  0 0 0 0 0.12  0 0 0 0 1.00  0 0 0 0.85 0"
          result="purpleHalo"/>
        {/* Tight inner glow — hugs the text/edges */}
        <feGaussianBlur in="bright" stdDeviation="3" result="innerBlur"/>
        <feColorMatrix in="innerBlur" type="matrix"
          values="0 0 0 0 0.85  0 0 0 0 0.60  0 0 0 0 1.00  0 0 0 1.00 0"
          result="innerGlow"/>
        <feMerge>
          <feMergeNode in="purpleHalo"/>
          <feMergeNode in="innerGlow"/>
          <feMergeNode in="bright"/>
        </feMerge>
      </filter>

      {/* Phone hover — warm amber glow */}
      <filter id="phone-glow" x="-30%" y="-30%" width="160%" height="160%"
        colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0 0 0 0 0.8  0 0 0 0 0.45  0 0 0 0 0.0  0 0 0 0.5 0"
          result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>

      {/* Cat eye glow */}
      <filter id="cat-eye-glow" x="-400%" y="-400%" width="900%" height="900%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="outerBlur"/>
        <feColorMatrix in="outerBlur" type="matrix"
          values="0 0 0 0 0.50  0 0 0 0 0.85  0 0 0 0 0.05  0 0 0 1.00 0"
          result="outerGlow"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="innerBlur"/>
        <feColorMatrix in="innerBlur" type="matrix"
          values="0 0 0 0 0.70  0 0 0 0 1.00  0 0 0 0 0.10  0 0 0 0.90 0"
          result="innerGlow"/>
        <feMerge>
          <feMergeNode in="outerGlow"/>
          <feMergeNode in="innerGlow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      {/* Steam softener */}
      <filter id="steam-blur" x="-60%" y="-20%" width="220%" height="140%">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>

      {/* Vent hover — very faint cold-white shimmer, barely visible */}
      <filter id="vent-hover" x="-40%" y="-40%" width="180%" height="180%"
        colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur"/>
        <feColorMatrix in="blur" type="matrix"
          values="0.6 0 0 0 0.1  0.6 0 0 0 0.1  0.6 0 0 0 0.15  0 0 0 0.28 0"
          result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
  )
}

// ── Main Room ─────────────────────────────────────────────────────────────────
export default function Room({ onComputerClick, onAboutClick, onContactClick, onVentClick, hasVisitedVent, settings, isActive }) {
  const [hovered,        setHovered]        = useState(false)
  const [aboutHovered,   setAboutHovered]   = useState(false)
  const [contactHovered, setContactHovered] = useState(false)
  const [safeHovered,    setSafeHovered]    = useState(false)
  const [safeOpen,       setSafeOpen]       = useState(false)
  const [safeUnlocked,   setSafeUnlocked]   = useState(false)
  const [flickerOp,      setFlickerOp]      = useState(1)
  const [ventHovered,    setVentHovered]    = useState(false)
  const [ventZooming,    setVentZooming]    = useState(false)
  const [soundReady,     setSoundReady]     = useState(false)
  const [catEyesVisible, setCatEyesVisible] = useState(false)
  const [catEyesClicked, setCatEyesClicked] = useState(false)
  const timerRef    = useRef(null)
  const ambientRef  = useRef(null)
  const ventTimerRef = useRef(null)

  // Reset zoom state when room becomes active again (returning from vent)
  useEffect(() => {
    if (isActive) setVentZooming(false)
  }, [isActive])

  // Reveal cat eyes 1.5s after returning to the room post-vent
  useEffect(() => {
    if (!hasVisitedVent || !isActive || catEyesVisible) return
    const t = setTimeout(() => setCatEyesVisible(true), 1500)
    return () => clearTimeout(t)
  }, [hasVisitedVent, isActive]) // eslint-disable-line

  // Random brightness dip — simulates failing CRT tube
  useEffect(() => {
    const tick = () => {
      setFlickerOp(0.70 + Math.random() * 0.30)
      setTimeout(() => setFlickerOp(1), 55 + Math.random() * 90)
      timerRef.current = setTimeout(tick, 2000 + Math.random() * 6000)
    }
    timerRef.current = setTimeout(tick, 1400 + Math.random() * 3000)
    return () => clearTimeout(timerRef.current)
  }, [])

  // ── Fade ambient volume when switching views ──────────────────────────────
  useEffect(() => {
    const audio = ambientRef.current
    if (!audio) return
    const target = isActive ? AMBIENT_VOLUME : 0.08
    const step = () => {
      const diff = target - audio.volume
      if (Math.abs(diff) < 0.005) { audio.volume = target; return }
      audio.volume = Math.max(0, Math.min(1, audio.volume + diff * 0.12))
      setTimeout(step, 30)
    }
    step()
  }, [isActive])

  // ── Ambient fridge hum ────────────────────────────────────────────────────
  // React StrictMode fires the effect twice (mount → cleanup → mount).
  // The pattern here lets the cleanup fully destroy the first instance so
  // the second (real) mount creates a fresh one that actually plays.
  useEffect(() => {
    const audio = new Audio(fridgeAmbient)
    audio.loop   = true
    audio.volume = 0
    ambientRef.current = audio

    let started = false

    const fadeIn = () => {
      setSoundReady(true)
      let v = 0
      const step = () => {
        v = Math.min(v + 0.01, AMBIENT_VOLUME)
        audio.volume = v
        if (v < AMBIENT_VOLUME) setTimeout(step, 40)
      }
      step()
    }

    const removeListeners = () => {
      document.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('touchstart',  onGesture)
      document.removeEventListener('keydown',     onGesture)
    }

    // Safari: play() must be called synchronously inside the gesture handler.
    // Chrome/Edge: pointerdown fires before click, giving fastest response.
    // Guard with `started` set synchronously so double-events (touchstart+click
    // on mobile Chrome) never call play() twice.
    const onGesture = () => {
      if (started) return
      started = true
      removeListeners()
      audio.play().then(fadeIn).catch(() => { started = false })
    }

    document.addEventListener('pointerdown', onGesture)
    document.addEventListener('touchstart',  onGesture)   // Safari fallback
    document.addEventListener('keydown',     onGesture)

    // Also try immediate autoplay (works in dev / return visitors with high MEI)
    audio.play().then(() => { started = true; removeListeners(); fadeIn() }).catch(() => {})

    return () => {
      removeListeners()
      audio.pause()
      audio.src = ''
      ambientRef.current = null
    }
  }, [])

  // Clean up vent timer on unmount
  useEffect(() => () => clearTimeout(ventTimerRef.current), [])

  const handleVentClick = useCallback(() => {
    if (ventZooming) return
    setVentZooming(true)
    ventTimerRef.current = setTimeout(() => {
      onVentClick?.()
      // Reset happens when isActive returns to true
    }, 820)
  }, [ventZooming, onVentClick])

  const cx = SCR.x + SCR.w / 2
  const cy = SCR.y + SCR.h / 2

  // Font sizes relative to screen width
  const fs  = Math.round(SCR.w * 0.073)   // ~10 — terminal lines
  const fsB = Math.round(SCR.w * 0.095)   // ~13 — CLICK TO ENTER

  return (
    <div style={{ position:'fixed', inset:0, background:'#09070400', overflow:'hidden' }}>
      <style>{ANIM}</style>

      {/* ── Page title ──────────────────────────────────────────────────────── */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:10,
        display:'flex', justifyContent:'center',
        paddingTop:'2.6%',
        pointerEvents:'none',
        animation:'title-fade 1.8s ease-out both',
        animationDelay:'0.4s',
      }}>
        <span style={{
          fontFamily:"'Inter', -apple-system, sans-serif",
          fontWeight:600,
          fontSize:'clamp(16px, 1.8vw, 26px)',
          color:'#ffffff',
          letterSpacing:'0.32em',
          textTransform:'uppercase',
          textShadow:'0 2px 14px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.9)',
          background:'rgba(0,0,0,0.42)',
          padding:'8px 28px',
        }}>Joe Calvey Portfolio</span>
      </div>

      {/* ── Gentle camera breathe / vent zoom ───────────────────────────────── */}
      {/* transform-origin for vent-zoom aims at fan position (≈74% x, 16% y)  */}
      <div style={{
        position:'absolute', inset:'-1.5%',
        transformOrigin: ventZooming ? '74% 16%' : '50% 52%',
        animation: ventZooming
          ? 'vent-zoom 0.85s cubic-bezier(0.4, 0, 1, 1) both'
          : 'room-breathe 9s ease-in-out infinite',
      }}>
        <svg
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
        >
          <Defs/>

          {/* ── Background room image ─────────────────────────────────────────── */}
          <image href={roomBg} x={0} y={0} width={IMG_W} height={IMG_H}/>

          {/* ── Barred window — upper-left back wall ────────────────────────── */}
          {/* 🔧 Position: WIN_X / WIN_Y / WIN_W / WIN_H constants above        */}

          {/* Outside view — clipped to window bounds, sits BEHIND the PNG      */}
          {/* The transparent glass areas of WindowWS.png reveal this layer     */}
          {/* 🔧 Swap background: set OUTSIDE_IMG constant above                */}
          <clipPath id="window-outside-clip">
            <rect x={WIN_X + 26} y={WIN_Y + 78} width={275} height={70}/>
          </clipPath>
          {(() => {
            const activeMonth = settings?.previewMonth ?? new Date().getMonth()
            const isAutumn    = [8, 9, 10].includes(activeMonth)
            const wx = WIN_X + 26, wy = WIN_Y + 78
            return (
              <g clipPath="url(#window-outside-clip)" style={{ pointerEvents: 'none' }}>
                {OUTSIDE_IMG ? (
                  <image href={OUTSIDE_IMG} x={wx} y={wy} width={275} height={70} preserveAspectRatio="xMidYMid slice"/>
                ) : isAutumn ? (
                  /* ── Autumn outside ─────────────────────────────────────── */
                  <>
                    {/* Clear daytime autumn sky */}
                    <rect x={wx} y={wy} width={275} height={70} fill="#7ab8d4"/>
                    {/* Lighter sky near top */}
                    <rect x={wx} y={wy} width={275} height={25} fill="rgba(180,220,245,0.45)"/>
                    {/* Distant treeline — dark green silhouette */}
                    <rect x={wx} y={wy + 44} width={275} height={26} fill="#2d4a28"/>
                    {/* Ground — earthy brown */}
                    <rect x={wx} y={wy + 58} width={275} height={12} fill="#5a3d1a"/>
                    {/* Leaves blowing in wind — outer g drifts left, inner ellipse spins */}
                    {AUTUMN_LEAVES.map((l, i) => (
                      <g
                        key={i}
                        style={{
                          animation: `${l.fast ? 'leaf-drift-fast' : 'leaf-drift'} ${l.dur}s linear ${l.dly}s infinite`,
                          transform: `translate(${wx + l.x}px, ${wy + l.y}px)`,
                        }}
                      >
                        <ellipse
                          cx={0} cy={0}
                          rx={l.rx} ry={l.ry}
                          fill={`${l.color},${0.65 + (i % 4) * 0.08})`}
                          style={{
                            animation: `leaf-spin ${l.dur * 0.35}s linear ${l.dly}s infinite`,
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                          }}
                        />
                      </g>
                    ))}
                    {/* Edge vignette */}
                    <rect x={wx} y={wy} width={275} height={70} fill="url(#outside-vignette)"/>
                  </>
                ) : (
                  /* ── Rainy outside (default) ────────────────────────────── */
                  <>
                    <rect x={wx} y={wy} width={275} height={70} fill="#04060c"/>
                    {RAIN_DROPS.map((d, i) => {
                      const x1 = wx + d.x
                      const y1 = wy
                      return (
                        <line key={i}
                          x1={x1} y1={y1} x2={x1 + d.dx} y2={y1 + d.len}
                          stroke={`rgba(160,185,215,${d.op})`}
                          strokeWidth="0.7" strokeLinecap="round"
                          style={{ animation: `rain-fall ${d.dur}s linear ${d.dly}s infinite`, transformBox:'fill-box', transformOrigin:'top center' }}
                        />
                      )
                    })}
                    <rect x={wx} y={wy} width={275} height={70} fill="url(#outside-vignette)"/>
                  </>
                )}
              </g>
            )
          })()}

          {/* WindowWS.png — sits on the wall surface in front of outside scene */}
          <image
            href={windowImg}
            x={WIN_X} y={WIN_Y}
            width={WIN_W} height={WIN_H}
            preserveAspectRatio="none"
            style={{ pointerEvents: 'none', filter: 'brightness(0.58) contrast(1.10) saturate(0.80)' }}
          />
          {/* Ledge shadow — cast downward from the window sill onto the wall */}
          <defs>
            <linearGradient id="win-shadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(0,0,0,0.68)"/>
              <stop offset="60%"  stopColor="rgba(0,0,0,0.22)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </linearGradient>
          </defs>
          <rect
            x={WIN_X - 14} y={WIN_Y + WIN_H - 147}
            width={322} height={60}
            fill="url(#win-shadow)"
            style={{ pointerEvents: 'none' }}
          />

          {/* ── SafeWeb — right wall, rendered early so desk/items sit in front ── */}
          {/* 🔧 Position: SAFEWEB_X / SAFEWEB_Y / SAFEWEB_W / SAFEWEB_H above    */}
          <ellipse
            cx={SAFEWEB_X + SAFEWEB_W * 0.5} cy={SAFEWEB_Y + SAFEWEB_H + 8}
            rx={SAFEWEB_W * 0.38} ry={12}
            fill="rgba(0,0,0,0.38)"
            style={{ pointerEvents: 'none' }}
          />
          <clipPath id="safeweb-clip">
            <rect x={SAFEWEB_X + 2} y={SAFEWEB_Y + 2} width={SAFEWEB_W - 4} height={SAFEWEB_H - 4}/>
          </clipPath>
          <image
            href={safeUnlocked ? safeOpenedImg : safeWebImg}
            x={SAFEWEB_X} y={SAFEWEB_Y}
            width={SAFEWEB_W} height={SAFEWEB_H}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.82}
            clipPath="url(#safeweb-clip)"
            style={{ pointerEvents: 'none', filter: 'brightness(0.72)', transition: 'opacity 0.4s ease' }}
          />

          {/* ── Fan: dark cover hides original static blades ─────────────────── */}
          {/* Covers only the blade area; the outer housing ring remains visible  */}
          <circle
            cx={FAN_CX} cy={FAN_CY} r={FAN_R - 3}
            fill="#0c0b07"
            style={{ pointerEvents:'none' }}
          />

          {/* ── Fan: spinning blade overlay ───────────────────────────────────── */}
          {/* Speed: FAN_SPEED constant above · Image: fanImg import at top       */}
          <image
            href={fanImg}
            x={FAN_CX - (FAN_R + 49)} y={FAN_CY - (FAN_R + 49)}
            width={(FAN_R + 49) * 2} height={(FAN_R + 49) * 2}
            filter={ventHovered && !ventZooming ? 'url(#vent-hover)' : undefined}
            style={{
              pointerEvents:'none',
              animation:`fan-spin ${FAN_SPEED} linear infinite`,
              transformBox:'fill-box',
              transformOrigin:'center',
              transition:'filter 0.3s ease',
            }}
          />

          {/* ── Vent hit area — invisible, covers the housing ring ───────────── */}
          {/* Does NOT affect fan spin; cursor hints subtly on hover             */}
          <circle
            cx={FAN_CX} cy={FAN_CY}
            r={FAN_R + 14}
            fill="transparent"
            style={{ cursor: ventZooming ? 'default' : 'pointer' }}
            onMouseEnter={() => setVentHovered(true)}
            onMouseLeave={() => setVentHovered(false)}
            onClick={handleVentClick}
          />

          {/* ── CRT screen overlay ────────────────────────────────────────────── */}
          <g
            style={{ cursor:'pointer' }}
            onClick={onComputerClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            filter={hovered ? 'url(#hover-glow)' : 'url(#idle-glow)'}
          >
            {/* Screen content clipped to rounded rect */}
            <g clipPath="url(#scr-clip)">

              {/* Dark CRT glass base */}
              <rect
                x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                fill={hovered ? '#050f07' : '#030c04'}
                style={{ animation:'crt-flicker 11s ease-in-out infinite' }}
              />

              {/* Phosphor tint */}
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                fill="url(#phosphor)" opacity="0.55"
                style={{ pointerEvents:'none' }}/>

              {/* Scanlines */}
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                fill="url(#crt-scan)"
                style={{ pointerEvents:'none' }}/>

              {/* CRT corner vignette */}
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                fill="url(#crt-vig)"
                style={{ pointerEvents:'none' }}/>

              {/* ── CLICK TO ENTER — always visible, brighter on hover ───────── */}
              <g style={{ pointerEvents:'none' }} opacity={flickerOp}>
                <text
                  x={cx} y={cy - fsB * 0.55}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Press Start 2P', monospace"
                  fontSize={fsB}
                  fill={hovered ? '#00dd44' : '#009e32'}
                  filter="url(#chroma)"
                  style={{
                    animation: 'phosphor-glow 2s ease-in-out infinite',
                    transition: 'fill 0.14s ease',
                  }}
                >CLICK</text>
                <text
                  x={cx} y={cy + fsB * 0.95}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Press Start 2P', monospace"
                  fontSize={fsB}
                  fill={hovered ? '#00dd44' : '#009e32'}
                  filter="url(#chroma)"
                  style={{
                    animation: 'phosphor-glow 2s ease-in-out infinite',
                    transition: 'fill 0.14s ease',
                  }}
                >TO ENTER</text>
                <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
                  fill="url(#hover-bloom)"
                  opacity={hovered ? 1 : 0}
                  style={{ pointerEvents:'none', transition:'opacity 0.14s ease' }}
                />
              </g>

              {/* Dust specs */}
              {[
                [SCR.x + SCR.w*0.14, SCR.y + SCR.h*0.19],
                [SCR.x + SCR.w*0.71, SCR.y + SCR.h*0.54],
                [SCR.x + SCR.w*0.43, SCR.y + SCR.h*0.81],
                [SCR.x + SCR.w*0.87, SCR.y + SCR.h*0.32],
              ].map(([px,py], i) => (
                <rect key={i} x={px} y={py} width={1.5} height={1.5}
                  fill="rgba(150,130,55,0.35)" style={{ pointerEvents:'none' }}/>
              ))}

            </g>{/* end scr-clip */}

            {/* Inner rim — dark edge following rounded screen corners */}
            <rect
              x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h}
              rx="5" ry="4"
              fill="none"
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="2"
              style={{ pointerEvents:'none' }}
            />
          </g>

          {/* ── Ambient desk glow below monitor ──────────────────────────────── */}
          <ellipse
            cx={cx} cy={SCR.y + SCR.h + 36}
            rx={SCR.w * 0.50} ry={24}
            fill="rgba(0,165,35,0.05)"
            style={{
              pointerEvents:'none',
              animation:'screen-ambient 7s ease-in-out infinite',
            }}
          />

          {/* ── Boxes — bottom-left corner next to desk ──────────────────────── */}
          {/* 🔧 Position: BOXES_X / BOXES_Y / BOXES_W / BOXES_H constants above  */}
          <image
            href={boxesImg}
            x={BOXES_X} y={BOXES_Y}
            width={BOXES_W} height={BOXES_H}
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none', filter: 'brightness(0.68)' }}
          />

          {/* ── icontp.png — leaning on the boxes, bottom-left ──────────────── */}
          {/* 🔧 Adjust ICONTP_X / ICONTP_Y / ICONTP_W / ICONTP_H to reposition */}
          <image
            href={outsideImg}
            x={243} y={722}
            width={75} height={75}
            preserveAspectRatio="xMidYMid meet"
            transform="rotate(-5, 281, 760)"
            style={{ pointerEvents: 'none', mixBlendMode: 'multiply', filter: 'brightness(1.30) contrast(0.90) saturate(0.70) sepia(0.18)' }}
          />

          {/* ── Table corner overlay — sits in front of safe/boxes ──────────── */}
          {/* Full room dimensions so it aligns pixel-perfectly with the background */}
          <image
            href={tableOverlayImg}
            x={TABLE_X} y={TABLE_Y} width={TABLE_W} height={TABLE_H}
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none' }}
          />

          {/* ── Cat eyes — appear under table after visiting the vent ───────── */}
          {/* 🔧 Position: CAT_X / CAT_Y / CAT_GAP constants above              */}
          {catEyesVisible && !catEyesClicked && (
            <g
              onClick={() => setCatEyesClicked(true)}
              style={{ cursor: 'pointer' }}
            >
              {/* Large invisible hitbox covering the whole cat body area */}
              <rect
                x={CAT_X - 65} y={CAT_Y - 35}
                width={130} height={100}
                fill="transparent"
              />

              {/* Eyes */}
              {[-1, 1].map((side) => {
                const cx = CAT_X + side * CAT_GAP / 2
                return (
                  <g key={side} filter="url(#cat-eye-glow)">
                    <g style={{ animation: 'cat-fade-in 2s ease-out both' }}>
                      <g style={{
                        animation: 'cat-blink 7s ease-in-out 1s infinite',
                        transformBox: 'fill-box',
                        transformOrigin: '50% 50%',
                      }}>
                        <ellipse cx={cx} cy={CAT_Y} rx={4.5} ry={5.5} fill="rgba(142, 190, 28, 0.55)"
                          style={{ animation: 'cat-glow-pulse 3.8s ease-in-out infinite' }}/>
                        <ellipse cx={cx} cy={CAT_Y} rx={1.2} ry={5.0} fill="rgba(8, 6, 4, 0.92)"/>
                      </g>
                    </g>
                  </g>
                )
              })}
            </g>
          )}

          {/* Number 2 — revealed when cat eyes are clicked, styled like the vent clue */}
          {catEyesVisible && catEyesClicked && (
            <text
              x={CAT_X}
              y={CAT_Y + 14}
              textAnchor="middle"
              fontFamily="'Share Tech Mono', monospace"
              fontSize={42}
              fontWeight={700}
              fill="rgba(140, 140, 140, 0.28)"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(160, 160, 160, 0.15))',
                pointerEvents: 'none',
                userSelect: 'none',
                animation: 'cat-fade-in 0.6s ease-out both',
              }}
            >2</text>
          )}

          {/* ── About Me book — right side of desk ───────────────────────────── */}
          {/* 🔧 Image: change amBookImg import · Position: BOOK_X/Y/W/H above  */}
          <g
            transform={`rotate(-1, ${BOOK_X + BOOK_W / 2}, ${BOOK_Y + BOOK_H / 2})`}
            style={{ cursor:'pointer' }}
            onClick={onAboutClick}
            onMouseEnter={() => setAboutHovered(true)}
            onMouseLeave={() => setAboutHovered(false)}
          >
            {/* Transparent hit rect — ensures the whole book area is clickable */}
            <rect x={BOOK_X} y={BOOK_Y} width={BOOK_W} height={BOOK_H} fill="transparent" />
            {/* Shadow — rendered before image so mug sits in front */}
            <ellipse
              cx={BOOK_X + BOOK_W * 0.5 + 2} cy={BOOK_Y + BOOK_H - 14}
              rx={BOOK_W * 0.20 + 3} ry={4.5}
              fill="rgba(0,0,0,0.50)"
              style={{ pointerEvents:'none' }}
            />
            <ellipse
              cx={BOOK_X + BOOK_W * 0.5 + 2} cy={BOOK_Y + BOOK_H - 15}
              rx={BOOK_W * 0.12 + 3} ry={3}
              fill="rgba(0,0,0,0.65)"
              style={{ pointerEvents:'none' }}
            />
            {/* Steam — clipped so wisps only appear above the mug rim */}
            <clipPath id="steam-clip">
              <rect
                x={BOOK_X + BOOK_W * 0.3}
                y={BOOK_Y - 80}
                width={BOOK_W * 0.6}
                height={80 + BOOK_H * 0.155}
              />
            </clipPath>
            <g clipPath="url(#steam-clip)" style={{ pointerEvents: 'none' }}>
            {[
              { dx:  0, delay: '0s',    swing:  4 },
              { dx:  6, delay: '0.5s',  swing: -4 },
              { dx: 13, delay: '1.0s',  swing:  5 },
              { dx:  3, delay: '1.5s',  swing: -3 },
              { dx: 10, delay: '2.0s',  swing:  4 },
              { dx:  7, delay: '2.5s',  swing: -5 },
            ].map(({ dx, delay, swing }, i) => {
              const bx = BOOK_X + BOOK_W * 0.52 + dx - 13
              const by = BOOK_Y + BOOK_H * 0.16
              const h  = 24
              return (
                <path
                  key={i}
                  d={`M ${bx} ${by}
                      C ${bx + swing} ${by - h*0.3},
                        ${bx - swing} ${by - h*0.65},
                        ${bx + swing*0.5} ${by - h}`}
                  fill="none"
                  stroke="rgba(215,215,230,0.55)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  filter="url(#steam-blur)"
                  style={{
                    animation: `steam-wisp 3.0s linear ${delay} infinite`,
                    transformBox: 'fill-box',
                    transformOrigin: 'center bottom',
                    pointerEvents: 'none',
                  }}
                />
              )
            })}
            </g>

            {/* Mug image — rendered after shadow so it appears in front */}
            <image
              href={amBookImg}
              x={BOOK_X} y={BOOK_Y}
              width={BOOK_W} height={BOOK_H}
              preserveAspectRatio="xMidYMid meet"
              opacity={aboutHovered ? 1 : 0.88}
              filter={aboutHovered ? 'url(#mug-glow)' : undefined}
              style={{
                pointerEvents:'none',
                transition:'opacity 0.2s ease',
              }}
            />
          </g>

          {/* ── Contact phone — left side of desk ─────────────────────────────── */}
          {/* Position: PHONE_X/Y/W/H constants above                            */}
          <g
            style={{ cursor:'pointer' }}
            onClick={onContactClick}
            onMouseEnter={() => setContactHovered(true)}
            onMouseLeave={() => setContactHovered(false)}
          >
            {/* Transparent hit rect — full clickable area */}
            <rect x={PHONE_X} y={PHONE_Y} width={PHONE_W} height={PHONE_H} fill="transparent" />

            {/* Drop shadow on desk — layered ellipses, pushed below phone */}
            <ellipse
              cx={PHONE_X + PHONE_W * 0.5} cy={PHONE_Y + PHONE_H + 14}
              rx={PHONE_W * 0.50} ry={7}
              fill="rgba(0,0,0,0.18)"
              style={{ pointerEvents:'none' }}
            />
            <ellipse
              cx={PHONE_X + PHONE_W * 0.5} cy={PHONE_Y + PHONE_H + 12}
              rx={PHONE_W * 0.36} ry={5}
              fill="rgba(0,0,0,0.28)"
              style={{ pointerEvents:'none' }}
            />
            <ellipse
              cx={PHONE_X + PHONE_W * 0.5} cy={PHONE_Y + PHONE_H + 10}
              rx={PHONE_W * 0.22} ry={3}
              fill="rgba(0,0,0,0.40)"
              style={{ pointerEvents:'none' }}
            />

            {/* "Contact" label below phone */}
            <text
              x={PHONE_X + PHONE_W * 0.5 + 7} y={PHONE_Y + PHONE_H - 28}
              textAnchor="middle"
              fontFamily="'Share Tech Mono', monospace"
              fontSize={11}
              style={{
                fill:          contactHovered ? '#ffd080' : 'rgba(200,144,42,0.60)',
                letterSpacing: '0.18em',
                pointerEvents: 'none',
                filter:        contactHovered ? 'drop-shadow(0 0 5px rgba(255,180,40,0.8))' : 'none',
                transition:    'fill 0.2s ease, filter 0.2s ease',
              }}
            >CONTACT</text>

            {/* Phone image — wiggles on hover */}
            <image
              href={contactPhoneImg}
              x={PHONE_X} y={PHONE_Y}
              width={PHONE_W} height={PHONE_H}
              preserveAspectRatio="xMidYMid meet"
              filter={contactHovered ? 'url(#phone-glow)' : undefined}
              style={{
                pointerEvents: 'none',
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: contactHovered ? 'phone-ring 0.5s ease-in-out 0.1s 3' : 'none',
                transition: 'filter 0.2s ease',
              }}
            />
          </g>

          {/* ── Safe hover hit rect ──────────────────────────────────────────── */}
          <rect
            x={SAFEWEB_X + SAFEWEB_W * 0.22} y={SAFEWEB_Y + SAFEWEB_H * 0.12}
            width={SAFEWEB_W * 0.56} height={SAFEWEB_H * 0.72}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setSafeHovered(true)}
            onMouseLeave={() => setSafeHovered(false)}
            onClick={() => { if (!safeUnlocked) setSafeOpen(true) }}
          />

          {/* ── Safe hint text — visible only on hover ───────────────────────── */}
          <text
            x={SAFEWEB_X + SAFEWEB_W * 0.5 + 1} y={SAFEWEB_Y + SAFEWEB_H * 0.44 - 98}
            textAnchor="middle"
            fontFamily="'Share Tech Mono', monospace"
            fontSize={15}
            fill="rgba(155,155,155,0.88)"
            style={{
              pointerEvents: 'none',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
              opacity: safeHovered && !safeUnlocked ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          >Find the numbers</text>
          <text
            x={SAFEWEB_X + SAFEWEB_W * 0.5 + 1} y={SAFEWEB_Y + SAFEWEB_H * 0.44 - 98 + 16}
            textAnchor="middle"
            fontFamily="'Share Tech Mono', monospace"
            fontSize={15}
            fill="rgba(155,155,155,0.88)"
            style={{
              pointerEvents: 'none',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
              opacity: safeHovered && !safeUnlocked ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          >to open the safe</text>

        </svg>
      </div>

      {/* ── Vent zoom black fade — covers everything when zooming in ─────────── */}
      {ventZooming && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#000',
          animation: 'vent-fade-black 0.85s cubic-bezier(0.4, 0, 1, 1) both',
          pointerEvents: 'none',
          zIndex: 400,
        }} />
      )}

      {/* ── Summer bunting — visible June, July, August only ───────────────── */}
      {/* Adjust via the .summer-bunting CSS class below                        */}
      {/* getMonth() returns 0–11; 5=Jun, 6=Jul, 7=Aug                        */}
      {([5,6,7,8,9,10].includes(settings?.previewMonth ?? new Date().getMonth())) && <style>{`
        .summer-bunting {
          position: absolute;
          left: calc(18% + 36px);
          top: calc(20% - 110px);
          width: 715px;
          pointer-events: none;
          z-index: 5;
          filter: brightness(0.50) contrast(1.05) saturate(0.85);
        }
      `}</style>}
      {[5, 6, 7].includes(settings?.previewMonth ?? new Date().getMonth()) && (
        <img src={buntingImg} className="summer-bunting" alt="" />
      )}
      {[8, 9, 10].includes(settings?.previewMonth ?? new Date().getMonth()) && (
        <img src={autumnBuntingImg} className="summer-bunting" alt="" />
      )}

      {/* ── Film grain, scanlines, vignette, dust, chromatic fringe ─────────── */}
      {/* Hidden during vent zoom — HorrorOverlay is position:fixed so it would */}
      {/* float above the zooming room instead of moving with it.               */}
      {!ventZooming && <HorrorOverlay monitorCx={0.498} monitorCy={0.503}/>}

      {/* ── Sound hint — shown until first click unlocks audio ──────────────── */}
      {!soundReady && (
        <div style={{
          position: 'absolute', bottom: 22, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          color: 'rgba(180,180,180,0.45)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 6px rgba(0,0,0,0.8)',
        }}>🔊 CLICK ANYWHERE FOR SOUND</div>
      )}

      {/* ── Safe combination lock ─────────────────────────────────────────────── */}
      {safeOpen && (
        <SafeLock
          onClose={() => setSafeOpen(false)}
          onUnlock={() => setSafeUnlocked(true)}
        />
      )}
    </div>
  )
}
