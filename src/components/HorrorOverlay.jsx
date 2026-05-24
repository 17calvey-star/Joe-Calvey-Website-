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

// Dust particle data: [x%, y%, size(px), drift-x, drift-y, duration, delay]
const DUST = [
  [28, 42, 1.5, 18, -36, '11s', '0s'  ],
  [51, 55, 1,   12, -28, '15s', '2.3s'],
  [63, 36, 2,   22, -44, '9s',  '4.8s'],
  [44, 62, 1,   16, -20, '13s', '1.1s'],
  [72, 48, 1.5, 14, -38, '12s', '3.4s'],
  [38, 33, 1,   20, -30, '14s', '6.2s'],
  [55, 70, 2,    8, -24, '10s', '0.7s'],
  [48, 44, 1,   24, -40, '16s', '7.1s'],
  [66, 60, 1.5, 10, -32, '11s', '5.5s'],
  [32, 52, 1,   18, -18, '13s', '2.9s'],
]

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

export default function HorrorOverlay() {
  const canvasRef = useRef(null)

  // Animate dust particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Each particle: { x, y, vx, vy, alpha, life, maxLife, size }
    const particles = Array.from({length: 22}, () => spawnParticle(canvas))

    function spawnParticle(c) {
      return {
        x:    0.3 * c.width  + Math.random() * 0.4 * c.width,
        y:    0.3 * c.height + Math.random() * 0.4 * c.height,
        vx:   (Math.random() - 0.4) * 0.22,
        vy:   -0.08 - Math.random() * 0.18,
        alpha: 0,
        life:  0,
        maxLife: 180 + Math.random() * 280,
        size: 0.8 + Math.random() * 1.2,
      }
    }

    let raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.life++
        const t = p.life / p.maxLife
        // Fade in/out
        p.alpha = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1
        p.x += p.vx
        p.y += p.vy
        // Subtle drift
        p.vx += (Math.random() - 0.5) * 0.008
        p.vy += (Math.random() - 0.5) * 0.004

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 155, 70, ${p.alpha * 0.55})`
        ctx.fill()

        if (p.life >= p.maxLife) Object.assign(p, spawnParticle(canvas))
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

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

      {/* ── Full-screen CRT scanlines (coarser, horror-game look) ────────── */}
      <div style={{
        position:'fixed', inset:0, zIndex:201,
        backgroundImage:'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 2px, transparent 2px, transparent 6px)',
        pointerEvents:'none',
        imageRendering:'pixelated',
      }}/>

      {/* ── Chromatic fringe ─────────────────────────────────────────────── */}
      <ChromaticFringe/>

      {/* ── Deep vignette (CSS, sharp dark corners) ──────────────────────── */}
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
          opacity:0.85,
        }}
        // Set canvas resolution to match window
        width={typeof window !== 'undefined' ? window.innerWidth  : 1280}
        height={typeof window !== 'undefined' ? window.innerHeight : 800}
      />

      {/* ── Very subtle green phosphor screen-bleed across everything ──────── */}
      <div style={{
        position:'fixed', inset:0, zIndex:199,
        background:'radial-gradient(ellipse 30% 25% at 50% 52%, rgba(0,160,40,0.04) 0%, transparent 100%)',
        pointerEvents:'none',
        mixBlendMode:'screen',
      }}/>
    </>
  )
}
