import { useEffect, useRef, useCallback } from 'react'
import radioStaticSrc from '../assets/audio/sfx/RadioStatic.mp3'
import { VOL_STATIC } from '../config'

// TV static transition overlay.
// Phase 1 (0–400ms):  static builds in from black
// Phase 2 (400–800ms): full static
// Phase 3 (800–1300ms): static clears to reveal destination
// onComplete fires at ~1300ms

const DURATION = 1300

export default function StaticTransition({ active, onComplete }) {
  const canvasRef  = useRef(null)
  const frameRef   = useRef(null)
  const startRef   = useRef(null)
  const doneRef    = useRef(false)
  const audioRef   = useRef(null)      // lazily-created Audio instance
  const fadeTimers = useRef([])        // timeout + interval for fade-out

  // Create (or reuse) the Audio instance.
  // Only created after a user gesture so autoplay policy is respected.
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(radioStaticSrc)
      audioRef.current.volume = VOL_STATIC
    }
    return audioRef.current
  }, [])

  const draw = useCallback((timestamp) => {
    if (!startRef.current) startRef.current = timestamp
    const elapsed  = timestamp - startRef.current
    const progress = Math.min(elapsed / DURATION, 1)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    // Opacity envelope: ramp in → hold → ramp out
    let opacity
    if (progress < 0.3) {
      opacity = progress / 0.3          // 0 → 1
    } else if (progress < 0.62) {
      opacity = 1                        // hold full static
    } else {
      opacity = 1 - (progress - 0.62) / 0.38  // 1 → 0
    }

    // Static density mirrors opacity
    const density = 0.7 + opacity * 0.3

    ctx.clearRect(0, 0, W, H)

    // Draw random noise
    const imageData = ctx.createImageData(W, H)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < density) {
        const v = Math.random() > 0.48 ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = v
        data[i + 3] = Math.round(opacity * 255)
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Horizontal scan-line distortion at peak intensity
    if (progress > 0.25 && progress < 0.7) {
      const numLines = Math.floor(6 * opacity)
      for (let l = 0; l < numLines; l++) {
        const y    = Math.floor(Math.random() * H)
        const xOff = (Math.random() - 0.5) * 80 * opacity
        const lineH = 2 + Math.floor(Math.random() * 6)
        if (Math.abs(xOff) > 4) {
          const slice = ctx.getImageData(0, y, W, lineH)
          ctx.clearRect(0, y, W, lineH)
          ctx.putImageData(slice, xOff, y)
        }
      }
    }

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(draw)
    } else if (!doneRef.current) {
      doneRef.current = true
      onComplete?.()
    }
  }, [onComplete])

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    startRef.current = null
    doneRef.current  = false

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [active, draw])

  // ── Audio: play RadioStatic.mp3 for the duration of the transition ────────
  useEffect(() => {
    if (!active) return

    // Clear any lingering fade timers from a previous quick re-trigger
    fadeTimers.current.forEach(id => { clearTimeout(id); clearInterval(id) })
    fadeTimers.current = []

    const audio = getAudio()
    audio.currentTime = 0
    audio.volume = VOL_STATIC
    audio.play().catch(() => {}) // silently ignore autoplay-policy rejections

    // Fade out over the last ~350ms of the transition so it doesn't cut abruptly
    const FADE_START = DURATION * 0.73          // ~950ms in
    const FADE_STEP_MS = 28
    const fadeSteps = Math.ceil((DURATION - FADE_START) / FADE_STEP_MS)
    const volStep   = VOL_STATIC / fadeSteps

    const t = setTimeout(() => {
      const iv = setInterval(() => {
        if (!audioRef.current) { clearInterval(iv); return }
        const next = audioRef.current.volume - volStep
        if (next <= 0) {
          audioRef.current.volume = 0
          audioRef.current.pause()
          clearInterval(iv)
        } else {
          audioRef.current.volume = next
        }
      }, FADE_STEP_MS)
      fadeTimers.current.push(iv)
    }, FADE_START)

    fadeTimers.current.push(t)

    return () => {
      fadeTimers.current.forEach(id => { clearTimeout(id); clearInterval(id) })
      fadeTimers.current = []
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.volume = VOL_STATIC  // reset for next use
      }
    }
  }, [active, getAudio])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    />
  )
}
