import { useEffect, useRef } from 'react'

// CSS injected once
const CSS = `
@keyframes grain-shift {
  0%   { background-position: 0% 0%;    }
  10%  { background-position: -8% -4%;  }
  20%  { background-position: 12% 8%;   }
  30%  { background-position: -4% 16%;  }
  40%  { background-position: 8% -12%;  }
  50%  { background-position: -14% 6%;  }
  60%  { background-position: 18% 2%;   }
  70%  { background-position: -6% 14%;  }
  80%  { background-position: 10% -8%;  }
  90%  { background-position: -16% 4%;  }
  100% { background-position: 0% 0%;    }
}
`

// Grain texture as a tiny SVG data URI (feTurbulence noise, tiled)
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E")`

// Chromatic aberration: thin red/blue fringe at screen edges
function ChromaticFringe() {
  return (
    <>
      {/* Red fringe left */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(to right, rgba(180,0,0,0.04) 0%, transparent 8%)',
        pointerEvents:'none', zIndex:100,
        mixBlendMode:'screen',
      }}/>
      {/* Blue fringe right */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(to left, rgba(0,0,180,0.04) 0%, transparent 8%)',
        pointerEvents:'none', zIndex:100,
        mixBlendMode:'screen',
      }}/>
    </>
  )
}

// monitorCx / monitorCy: 0–1 normalised position of CRT screen centre in viewport
export default function HorrorOverlay({ monitorCx = 0.5, monitorCy = 0.505 }) {
  const canvasRef = useRef(null)

  // Animate dust particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Two populations:
    //  TIGHT  — spawn near the CRT glow, catch phosphor light, slightly green-tinted
    //  WIDE   — room atmosphere, loose amber
    const TIGHT = 22
    const WIDE  =  8

    function spawnParticle(c, tight) {
      if (tight) {
        // Circular spawn zone around the monitor — radius varies per particle
        const angle = Math.random() * Math.PI * 2
        const r     = 0.03 * c.width + Math.random() * 0.11 * c.width
        return {
          x:       monitorCx * c.width  + Math.cos(angle) * r,
          y:       monitorCy * c.height + Math.sin(angle) * r,
          vx:      (Math.random() - 0.45) * 0.20,
          vy:      -0.06 - Math.random() * 0.16,
          alpha:   0,
          life:    0,
          maxLife: 160 + Math.random() * 260,
          size:    0.7 + Math.random() * 1.1,
          tight:   true,
        }
      } else {
        return {
          x:       0.25 * c.width  + Math.random() * 0.5 * c.width,
          y:       0.25 * c.height + Math.random() * 0.5 * c.height,
          vx:      (Math.random() - 0.4) * 0.18,
          vy:      -0.05 - Math.random() * 0.12,
          alpha:   0,
          life:    0,
          maxLife: 220 + Math.random() * 320,
          size:    0.6 + Math.random() * 0.9,
          tight:   false,
        }
      }
    }

    const particles = [
      ...Array.from({ length: TIGHT }, () => spawnParticle(canvas, true)),
      ...Array.from({ length: WIDE  }, () => spawnParticle(canvas, false)),
    ]

    let raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.life++
        const t = p.life / p.maxLife
        // Fade in/out envelope
        p.alpha = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1
        p.x += p.vx
        p.y += p.vy
        // Micro-drift
        p.vx += (Math.random() - 0.5) * (p.tight ? 0.010 : 0.007)
        p.vy += (Math.random() - 0.5) * (p.tight ? 0.005 : 0.003)

        // Tight particles catch green phosphor; wide are warm amber
        const [r, g, b] = p.tight
          ? [145, 205, 110]   // phosphor-tinted green-amber
          : [175, 150, 65]    // distant room dust

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * (p.tight ? 0.65 : 0.45)})`
        ctx.fill()

        if (p.life >= p.maxLife) Object.assign(p, spawnParticle(canvas, p.tight))
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [monitorCx, monitorCy])

  return (
    <>
      <style>{CSS}</style>

      {/* ── Film grain ───────────────────────────────────────────────────── */}
      <div style={{
        position:'fixed', inset:0, zIndex:200,
        backgroundImage: GRAIN_URI,
        backgroundSize: '180px 180px',
        backgroundRepeat: 'repeat',
        opacity: 0.55,
        pointerEvents:'none',
        animation:'grain-shift 0.5s steps(1) infinite',
        mixBlendMode:'overlay',
        imageRendering:'pixelated',
      }}/>

      {/* ── Full-screen CRT scanlines ────────────────────────────────────── */}
      <div style={{
        position:'fixed', inset:0, zIndex:201,
        backgroundImage:'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 2px, transparent 2px, transparent 6px)',
        pointerEvents:'none',
        imageRendering:'pixelated',
      }}/>

      {/* ── Chromatic fringe ─────────────────────────────────────────────── */}
      <ChromaticFringe/>

      {/* ── Deep vignette (sharp dark corners) ───────────────────────────── */}
      <div style={{
        position:'fixed', inset:0, zIndex:202,
        background:'radial-gradient(ellipse 78% 72% at 50% 50%, transparent 38%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.97) 100%)',
        pointerEvents:'none',
      }}/>

      {/* ── Dust particles canvas ────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{
          position:'fixed', inset:0,
          width:'100%', height:'100%',
          pointerEvents:'none', zIndex:203,
          opacity:0.9,
        }}
        width={typeof window !== 'undefined' ? window.innerWidth  : 1280}
        height={typeof window !== 'undefined' ? window.innerHeight : 800}
      />

      {/* ── Green phosphor screen-bleed (concentrated around monitor) ───── */}
      <div style={{
        position:'fixed', inset:0, zIndex:199,
        background:'radial-gradient(ellipse 26% 22% at 50% 52%, rgba(0,160,40,0.05) 0%, transparent 100%)',
        pointerEvents:'none',
        mixBlendMode:'screen',
      }}/>
    </>
  )
}
