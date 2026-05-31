import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

// ── Rich text renderer — supports **bold** syntax ────────────────────────────
function RichText({ text, style }) {
  if (!text) return null
  // Split on **…** markers and alternate normal / bold
  const parts = text.split(/\*\*(.+?)\*\*/gs)
  return (
    <p style={{ ...style, whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} style={{ fontWeight: 700, color: 'inherit' }}>{part}</strong>
          : part
      )}
    </p>
  )
}

// Work image glob
const workGlob = import.meta.glob(
  '../assets/images/projects/*/work/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: false }   // lazy — only loaded when window opens
)
async function loadWorkImages(id, imageOrder = []) {
  const entries = Object.entries(workGlob).filter(([p]) => p.includes(`/${id}/work/`))
  const loaded  = await Promise.all(entries.map(async ([path, fn]) => {
    const mod = await fn()
    return { url: mod.default, filename: path.split('/').pop() }
  }))
  // Sort by imageOrder if provided; unrecognised files go to the end
  if (imageOrder.length > 0) {
    loaded.sort((a, b) => {
      const ai = imageOrder.indexOf(a.filename)
      const bi = imageOrder.indexOf(b.filename)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }
  return loaded.map(l => l.url)
}

const coverGlob = import.meta.glob(
  '../assets/images/projects/*/cover.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: true }
)
function getCoverUrl(id) {
  const entry = Object.entries(coverGlob).find(([p]) => p.includes(`/${id}/cover`))
  return entry ? entry[1].default : null
}

// ── Window title bar buttons (pixel art style) ────────────────────────────────
function WinBtn({ color, label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 16, height: 14,
        background: hov ? color : '#2a2a4a',
        border: '1px solid #5050a0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 8,
        fontFamily: "'Share Tech Mono', monospace",
        color: hov ? '#fff' : '#8080b0',
        userSelect: 'none',
      }}
    >{label}</div>
  )
}

// ── Fullscreen slideshow ──────────────────────────────────────────────────────
function Slideshow({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + images.length) % images.length)
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <img
        src={images[idx]} alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
      />
      <div style={{
        marginTop: 20, display: 'flex', alignItems: 'center', gap: 20,
        fontFamily: "'Share Tech Mono', monospace", color: 'rgba(255,255,255,0.5)',
      }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
          ◄
        </button>
        <span style={{ fontSize: 12 }}>{idx + 1} / {images.length}</span>
        <button onClick={() => setIdx(i => (i + 1) % images.length)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
          ►
        </button>
        <button onClick={onClose}
          style={{ background: 'none', border: '1px solid rgba(200,40,40,0.4)', color: 'rgba(255,100,100,0.7)', padding: '6px 12px', cursor: 'pointer', fontSize: 12, marginLeft: 8 }}>
          ✕ CLOSE
        </button>
      </div>
    </motion.div>,
    document.body
  )
}

// ── YouTube/Vimeo embed helper ────────────────────────────────────────────────
function getEmbedUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

// ── Main DesktopWindow component ──────────────────────────────────────────────

export default function DesktopWindow({ project, content, scale, zIndex, isActive, onClose, onFocus }) {
  const s = scale
  const color = project.colour || '#4a9eff'

  const [workImages, setWorkImages] = useState([])
  const [imgIdx,     setImgIdx]     = useState(0)
  const [slideshow,  setSlideshow]  = useState(null)
  const [dragging,   setDragging]   = useState(false)
  const [pos,        setPos]        = useState({ x: 60, y: 40 })
  const dragRef = useRef({ active: false, ox: 0, oy: 0, sx: 0, sy: 0 })

  const coverUrl  = getCoverUrl(project.id)
  const embedUrl  = getEmbedUrl(project.videoUrl)

  // Lazy-load work images when window opens (re-run if imageOrder changes)
  const imageOrderKey = (project.imageOrder || []).join(',')
  useEffect(() => {
    loadWorkImages(project.id, project.imageOrder || []).then(imgs => {
      setWorkImages(imgs)
      setImgIdx(0)
    })
  }, [project.id, imageOrderKey]) // eslint-disable-line

  // Keyboard nav for images
  useEffect(() => {
    if (!isActive) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight' && workImages.length > 1)
        setImgIdx(i => (i + 1) % workImages.length)
      if (e.key === 'ArrowLeft' && workImages.length > 1)
        setImgIdx(i => (i - 1 + workImages.length) % workImages.length)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, workImages.length, onClose])

  // Window drag
  const onDragStart = useCallback((e) => {
    dragRef.current = { active: true, sx: e.clientX - pos.x, sy: e.clientY - pos.y }
    setDragging(true)
  }, [pos])
  const onDragMove = useCallback((e) => {
    if (!dragRef.current.active) return
    setPos({ x: e.clientX - dragRef.current.sx, y: e.clientY - dragRef.current.sy })
  }, [])
  const onDragEnd = useCallback(() => { dragRef.current.active = false; setDragging(false) }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup',   onDragEnd)
    return () => {
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('mouseup',   onDragEnd)
    }
  }, [onDragMove, onDragEnd])

  const W = Math.min(700 * s, window.innerWidth  - 40)
  const H = Math.min(480 * s, window.innerHeight - 80)
  const LEFT_W = 220 * s
  const RIGHT_W = W - LEFT_W - 1

  const allImages = workImages

  return (
    <>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{    scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onMouseDown={onFocus}
        style={{
          position: 'absolute',
          left: pos.x, top: pos.y,
          width: W, height: H,
          zIndex: isActive ? zIndex + 100 : zIndex,
          imageRendering: 'pixelated',
          boxShadow: isActive
            ? `0 0 0 ${1 * s}px ${color}55, 0 ${16 * s}px ${48 * s}px rgba(0,0,0,0.8)`
            : `0 ${8 * s}px ${24 * s}px rgba(0,0,0,0.6)`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'default',
        }}
      >
        {/* ── Window title bar ──────────────────────────────────────────── */}
        <div
          onMouseDown={onDragStart}
          style={{
            height: 24 * s, flexShrink: 0,
            background: isActive
              ? `linear-gradient(90deg, ${color}cc, ${color}88)`
              : 'linear-gradient(90deg, #3030a0, #1a1a60)',
            display: 'flex', alignItems: 'center',
            padding: `0 ${6 * s}px`,
            justifyContent: 'space-between',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: Math.max(6, 7 * s), color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '70%',
            display: 'flex', alignItems: 'center', gap: 6 * s,
          }}>
            {coverUrl ? (
              <img src={coverUrl} alt="" style={{
                width: 16 * s, height: 16 * s,
                objectFit: 'cover',
                imageRendering: 'pixelated',
                flexShrink: 0,
                border: `${1 * s}px solid rgba(255,255,255,0.2)`,
              }} />
            ) : <span>📁</span>}
            {project.title}
          </span>
          <div style={{ display: 'flex', gap: 3 * s }}>
            <WinBtn color="#c0c000" label="–" onClick={() => {}} />
            <WinBtn color="#0080c0" label="□" onClick={() => {}} />
            <WinBtn color="#c02020" label="✕" onClick={(e) => { e.stopPropagation(); onClose() }} />
          </div>
        </div>

        {/* ── Window menu bar ───────────────────────────────────────────── */}
        <div style={{
          height: 18 * s, flexShrink: 0,
          background: '#1a1a30',
          borderBottom: `${1 * s}px solid #3030a0`,
          display: 'flex', alignItems: 'center',
          padding: `0 ${8 * s}px`, gap: 16 * s,
        }}>
          {['File', 'View', 'Help'].map(m => (
            <span key={m} style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: Math.max(8, 9 * s), color: 'rgba(180,180,220,0.6)',
              cursor: 'default',
            }}>
              {m}
            </span>
          ))}
          {project.externalLink && (
            <a href={project.externalLink} target="_blank" rel="noopener noreferrer"
              style={{
                marginLeft: 'auto',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: Math.max(8, 9 * s), color: color,
                textDecoration: 'none',
              }}>
              🔗 View Live
            </a>
          )}
        </div>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#0e0e1e' }}>

          {/* Left panel — project info */}
          <div style={{
            width: LEFT_W, flexShrink: 0,
            borderRight: `${1 * s}px solid #3030a0`,
            overflowY: 'auto',
            padding: `${12 * s}px ${10 * s}px`,
            background: '#0a0a18',
          }}>
            {/* Module tag */}
            {project.module && (
              <div style={{
                display: 'inline-block',
                border: `${1 * s}px solid ${color}66`,
                color: color, fontSize: Math.max(6, 7 * s),
                fontFamily: "'Share Tech Mono', monospace",
                padding: `${2 * s}px ${6 * s}px`,
                marginBottom: 8 * s,
              }}>{project.module}</div>
            )}

            {/* Year */}
            {project.year && (
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: Math.max(8, 9 * s), color: 'rgba(255,255,255,0.25)',
                marginBottom: 10 * s,
              }}>{project.year}</div>
            )}

            {/* Brief */}
            {project.brief && (
              <RichText text={project.brief} style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: Math.max(10, 12 * s),
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6, margin: `0 0 ${12 * s}px`,
              }} />
            )}

            <div style={{ height: 1 * s, background: '#3030a060', margin: `${8 * s}px 0` }} />

            {/* Problem / Insight / Solution */}
            {[
              { key: 'problem',  label: content.problemLabel  || 'Brief'    },
              { key: 'insight',  label: content.insightLabel  || 'Approach' },
              { key: 'solution', label: content.solutionLabel || 'Result'   },
            ].filter(sec => content[sec.key]).map(sec => (
              <div key={sec.key} style={{ marginBottom: 12 * s }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: Math.max(6, 7 * s),
                  color: color, letterSpacing: 1,
                  marginBottom: 4 * s,
                }}>{sec.label.toUpperCase()}</div>
                <RichText text={content[sec.key]} style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: Math.max(10, 11 * s),
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.65, margin: 0,
                }} />
              </div>
            ))}

            {/* Worked with */}
            {content.workedWith && (
              <div style={{ marginTop: 8 * s }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: Math.max(6, 7 * s),
                  color: 'rgba(255,255,255,0.3)', marginBottom: 4 * s,
                }}>WORKED WITH</div>
                <RichText text={content.workedWith} style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: Math.max(9, 10 * s),
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.6, margin: 0,
                }} />
              </div>
            )}
          </div>

          {/* Right panel — media */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', background: '#0e0e1e',
          }}>
            {/* Image viewer */}
            <div style={{
              flex: 1, position: 'relative',
              background: '#080810',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <AnimatePresence mode="wait">
                {allImages.length > 0 ? (
                  <motion.img
                    key={imgIdx}
                    src={allImages[imgIdx]}
                    alt=""
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{    opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSlideshow(imgIdx)}
                    style={{
                      maxWidth: '100%', maxHeight: '100%',
                      objectFit: 'contain', display: 'block',
                      cursor: 'zoom-in',
                    }}
                  />
                ) : embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={project.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: Math.max(6, 8 * s),
                    color: 'rgba(255,255,255,0.1)',
                  }}>NO IMAGES</div>
                )}
              </AnimatePresence>

              {/* Prev/Next arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length)}
                    style={{
                      position: 'absolute', left: 4 * s, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)', border: `${1 * s}px solid rgba(255,255,255,0.15)`,
                      color: '#fff', padding: `${4 * s}px ${8 * s}px`,
                      cursor: 'pointer', fontSize: 12 * s,
                    }}>◄</button>
                  <button
                    onClick={() => setImgIdx(i => (i + 1) % allImages.length)}
                    style={{
                      position: 'absolute', right: 4 * s, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)', border: `${1 * s}px solid rgba(255,255,255,0.15)`,
                      color: '#fff', padding: `${4 * s}px ${8 * s}px`,
                      cursor: 'pointer', fontSize: 12 * s,
                    }}>►</button>
                  {/* Counter */}
                  <div style={{
                    position: 'absolute', bottom: 6 * s, right: 8 * s,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: Math.max(8, 9 * s),
                    color: 'rgba(255,255,255,0.35)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: `${2 * s}px ${6 * s}px`,
                  }}>{imgIdx + 1} / {allImages.length}</div>
                </>
              )}
            </div>

            {/* Bottom toolbar */}
            <div style={{
              height: 30 * s, flexShrink: 0,
              background: '#0a0a18',
              borderTop: `${1 * s}px solid #3030a060`,
              display: 'flex', alignItems: 'center',
              padding: `0 ${8 * s}px`, gap: 6 * s,
            }}>
              {/* Image strip thumbnails */}
              {allImages.map((src, i) => (
                <div
                  key={i}
                  onClick={() => setImgIdx(i)}
                  style={{
                    width: 20 * s, height: 20 * s,
                    background: `url(${src}) center/cover`,
                    border: i === imgIdx
                      ? `${1 * s}px solid ${color}`
                      : `${1 * s}px solid rgba(255,255,255,0.1)`,
                    cursor: 'pointer', flexShrink: 0,
                    opacity: i === imgIdx ? 1 : 0.5,
                  }}
                />
              ))}

              <div style={{ flex: 1 }} />

              {/* Action buttons */}
              {project.pdfUrl && (
                <a href={project.pdfUrl} target="_blank" rel="noopener noreferrer"
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: Math.max(7, 8 * s), color: color,
                    textDecoration: 'none',
                    border: `${1 * s}px solid ${color}44`,
                    padding: `${2 * s}px ${6 * s}px`,
                  }}>📄 PDF</a>
              )}
              {allImages.length > 0 && (
                <button
                  onClick={() => setSlideshow(imgIdx)}
                  style={{
                    background: 'none', border: `${1 * s}px solid rgba(255,255,255,0.15)`,
                    color: 'rgba(255,255,255,0.5)',
                    padding: `${2 * s}px ${6 * s}px`,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: Math.max(7, 8 * s), cursor: 'pointer',
                  }}>⛶ Fullscreen</button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen slideshow */}
      <AnimatePresence>
        {slideshow !== null && (
          <Slideshow
            images={allImages}
            startIndex={slideshow}
            onClose={() => setSlideshow(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
