import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// CRT + horror animations (injected once)
const ANIM = `
@keyframes crt-flicker {
  0%,100% { opacity:1;    }
  4%      { opacity:0.84; }
  5%      { opacity:1;    }
  48%     { opacity:1;    }
  49%     { opacity:0.76; }
  50%     { opacity:0.94; }
  51%     { opacity:1;    }
  82%     { opacity:1;    }
  83%     { opacity:0.88; }
  84%     { opacity:1;    }
}
@keyframes cursor-blink {
  0%,45%  { opacity:1; }
  50%,95% { opacity:0; }
  100%    { opacity:1; }
}
@keyframes phosphor-pulse {
  0%,100% { text-shadow: 0 0 4px #00dd44, 0 0 10px rgba(0,220,60,0.4); }
  50%     { text-shadow: 0 0 6px #00ff55, 0 0 18px rgba(0,255,70,0.6), 0 0 32px rgba(0,200,50,0.2); }
}
@keyframes scanline-scroll {
  0%   { transform: translateY(0); }
  100% { transform: translateY(4px); }
}
`

export default function Computer({ onClick, scale = 1 }) {
  const s = scale
  const [hovered, setHovered] = useState(false)
  const [flickerOp, setFlickerOp] = useState(1)
  const timerRef = useRef(null)

  // Occasional random brightness dip
  useEffect(() => {
    const tick = () => {
      setFlickerOp(0.72 + Math.random() * 0.28)
      setTimeout(() => setFlickerOp(1), 60 + Math.random() * 80)
      timerRef.current = setTimeout(tick, 2000 + Math.random() * 6000)
    }
    timerRef.current = setTimeout(tick, 1500 + Math.random() * 3000)
    return () => clearTimeout(timerRef.current)
  }, [])

  // Colors
  const CASE_BG   = '#c8b87a'   // dirty aged beige
  const CASE_SIDE = '#9a8e56'   // darker side face
  const CASE_BOT  = '#b0a068'
  const BORDER    = '#6a6038'

  // Screen glow intensity
  const screenBloom = hovered
    ? `0 0 ${18*s}px #00ff55, 0 0 ${40*s}px rgba(0,220,60,0.55), 0 0 ${80*s}px rgba(0,180,40,0.25), inset 0 0 ${14*s}px rgba(0,255,60,0.15)`
    : `0 0 ${8*s}px rgba(0,220,55,0.5), 0 0 ${22*s}px rgba(0,180,40,0.28), inset 0 0 ${6*s}px rgba(0,200,50,0.08)`

  // Outer case glow (warm amber from screen lighting the bezel)
  const caseGlow = `0 0 ${24*s}px rgba(180,140,14,0.5), 0 ${6*s}px ${20*s}px rgba(0,0,0,0.85)`

  return (
    <>
      <style>{ANIM}</style>
      <motion.div
        onClick={onClick}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type:'spring', stiffness:380, damping:28 }}
        style={{ cursor:'pointer', userSelect:'none', imageRendering:'pixelated' }}
      >
        {/* ── MONITOR BODY ──────────────────────────────────────────────────── */}
        <div style={{
          width: 196 * s,
          background: `linear-gradient(160deg, #d4c484 0%, ${CASE_BG} 40%, ${CASE_BOT} 100%)`,
          border: `${3*s}px solid ${BORDER}`,
          boxShadow: caseGlow,
          position: 'relative',
          imageRendering: 'pixelated',
        }}>

          {/* Bezel top strip */}
          <div style={{ height: 12*s, background: `linear-gradient(180deg, #d8c888, ${CASE_BG})` }}/>

          {/* Screen housing recess */}
          <div style={{ padding: `0 ${12*s}px` }}>
            <div style={{
              background: '#0c0c0a',
              border: `${2*s}px solid #383020`,
              boxShadow: `inset 0 0 ${8*s}px rgba(0,0,0,0.9), inset ${2*s}px ${2*s}px ${4*s}px rgba(0,0,0,0.6)`,
              position: 'relative',
              padding: `${3*s}px`,
            }}>

              {/* ── CRT SCREEN ────────────────────────────────────────────── */}
              <div style={{
                height: 122 * s,
                background: hovered ? '#061208' : '#040e06',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: screenBloom,
                transition: 'box-shadow 0.2s ease',
                animation: 'crt-flicker 11s ease-in-out infinite',
              }}>

                {/* Phosphor base tint */}
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(180deg, #040e05 0%, #061408 50%, #040e05 100%)',
                  pointerEvents:'none',
                }}/>

                {/* Scanlines */}
                <div style={{
                  position:'absolute', inset:0,
                  backgroundImage:'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)',
                  pointerEvents:'none', zIndex:4,
                  animation:'scanline-scroll 0.18s linear infinite',
                }}/>

                {/* CRT curvature vignette */}
                <div style={{
                  position:'absolute', inset:0,
                  background:'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.72) 100%)',
                  pointerEvents:'none', zIndex:5,
                }}/>

                {/* Horizontal interference band (very subtle) */}
                <div style={{
                  position:'absolute', left:0, right:0,
                  height: 2*s,
                  top: `${30 + Math.sin(Date.now()/3000)*20}%`,
                  background:'rgba(0,255,60,0.04)',
                  pointerEvents:'none', zIndex:3,
                }}/>

                {/* Screen content */}
                <div style={{
                  position:'absolute', inset:`${6*s}px ${8*s}px`,
                  display:'flex', flexDirection:'column',
                  justifyContent:'center', gap: 3*s,
                  zIndex:2,
                }}>
                  {hovered ? (
                    // Hover: glitch effect
                    <motion.div
                      initial={{ opacity:0, y: 4*s }}
                      animate={{ opacity:1, y:0 }}
                      style={{
                        fontFamily:"'Press Start 2P', monospace",
                        fontSize: 8*s, color:'#00ee44',
                        textShadow:`-${1*s}px 0 rgba(255,0,40,0.35), ${1*s}px 0 rgba(0,60,255,0.35), 0 0 ${8*s}px #00ee44`,
                        textAlign:'center', lineHeight:2,
                        animation:'phosphor-pulse 2s ease-in-out infinite',
                      }}
                    >
                      CLICK<br/>TO<br/>ENTER
                    </motion.div>
                  ) : (
                    // Idle: terminal lines
                    <div style={{ fontFamily:"'Share Tech Mono', monospace" }}>
                      <div style={{
                        fontSize: 9*s, color:'#009930',
                        textShadow:`0 0 ${3*s}px rgba(0,180,40,0.4)`,
                        marginBottom: 3*s, opacity:0.5,
                      }}>
                        CALVEY OS v1.0
                      </div>
                      <div style={{
                        fontSize: 9*s, color:'#00cc44',
                        textShadow:`0 0 ${4*s}px rgba(0,210,50,0.5)`,
                        marginBottom: 3*s, opacity: flickerOp,
                      }}>
                        C:\PORTFOLIO&gt;
                      </div>
                      <div style={{
                        fontSize: 10*s,
                        color:'#00dd44',
                        textShadow:`-${1*s}px 0 rgba(255,0,50,0.2), ${1*s}px 0 rgba(0,50,255,0.2), 0 0 ${6*s}px #00dd44`,
                        display:'flex', alignItems:'center', gap: 3*s,
                        opacity: flickerOp,
                        animation:'phosphor-pulse 3s ease-in-out infinite',
                      }}>
                        _
                        <span style={{ animation:'cursor-blink 1.1s step-end infinite' }}>
                          ▮
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dust specs on screen glass */}
                {[{x:'18%',y:'22%'},{x:'74%',y:'61%'},{x:'42%',y:'78%'},{x:'87%',y:'35%'}].map((p,i)=>(
                  <div key={i} style={{
                    position:'absolute', left:p.x, top:p.y,
                    width:1*s, height:1*s,
                    background:'rgba(180,160,80,0.35)',
                    pointerEvents:'none', zIndex:6,
                  }}/>
                ))}

              </div>{/* end screen */}

            </div>{/* end screen housing */}
          </div>

          {/* ── BOTTOM BEZEL (floppy + controls) ──────────────────────────── */}
          <div style={{
            height: 30*s,
            background: `linear-gradient(180deg, ${CASE_BG}, ${CASE_BOT})`,
            display:'flex', alignItems:'center',
            padding:`0 ${14*s}px`, gap: 6*s,
          }}>
            {/* Power LED */}
            <div style={{
              width:5*s, height:5*s,
              background: hovered ? '#00ff44' : '#185520',
              boxShadow: hovered ? `0 0 ${5*s}px #00ff44` : 'none',
              transition:'all 0.2s',
            }}/>
            {/* Floppy drive */}
            <div style={{
              flex:1, height:8*s,
              background:'#5a5230',
              border:`${1*s}px solid #3a3420`,
              display:'flex', alignItems:'center',
              padding:`0 ${4*s}px`,
            }}>
              <div style={{ width:'60%', height:2*s, background:'#2a2414', borderRadius:0 }}/>
            </div>
            {/* Disk eject button */}
            <div style={{
              width:7*s, height:7*s,
              background:'#6a6038',
              border:`${1*s}px solid #3a3418`,
            }}/>
          </div>

          {/* Subtle dirt/yellowing on bezel */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, bottom:0,
            background:'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
            pointerEvents:'none',
          }}/>
        </div>{/* end monitor body */}

        {/* ── KEYBOARD ──────────────────────────────────────────────────────── */}
        <div style={{
          width: 212*s, height:18*s,
          background:`linear-gradient(180deg, #c4b472, #a89858)`,
          border:`${2*s}px solid ${BORDER}`,
          borderTop:'none',
          margin:`${1*s}px auto 0`,
          boxShadow:`0 ${3*s}px ${10*s}px rgba(0,0,0,0.85)`,
          position:'relative',
          overflow:'hidden',
        }}>
          {/* Key rows */}
          {[[0,14],[1,6],[2,5]].map(([row,offset])=>(
            <div key={row} style={{
              position:'absolute',
              top: `${3*s + row*5*s}px`,
              left: `${(3+offset)*s}px`, right:`${3*s}px`,
              height:3*s,
              backgroundImage:`repeating-linear-gradient(90deg,
                #8a7c4a 0px, #8a7c4a ${5*s}px,
                #6a6030 ${5*s}px, #6a6030 ${6*s}px)`,
            }}/>
          ))}
          {/* Spacebar */}
          <div style={{
            position:'absolute', bottom:2*s,
            left:'30%', width:'40%', height:2*s,
            background:'#7a6e3a',
            border:`${0.5*s}px solid #5a5228`,
          }}/>
        </div>

      </motion.div>
    </>
  )
}
