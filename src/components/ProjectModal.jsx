import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

const workGlob = import.meta.glob(
  '../assets/images/projects/*/work/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: true }
)
function getWorkImages(projectId) {
  return Object.entries(workGlob)
    .filter(([p]) => p.includes(`/${projectId}/work/`))
    .map(([, mod]) => mod.default)
}

export default function ProjectModal({ project, content, coverSrc, onClose }) {
  const workImages = getWorkImages(project.id)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '40px 24px',
      }}
    >
      <motion.div
        key="modal-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0d0a',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: 860,
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#fff',
              margin: '0 0 6px',
            }}>{project.title}</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {project.year && (
                <span style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: "'Share Tech Mono', monospace",
                }}>{project.year}</span>
              )}
              {project.module && (
                <span style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.25)',
                  fontFamily: "'Share Tech Mono', monospace",
                }}>{project.module}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.4)',
              width: 32, height: 32,
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Cover image */}
        {coverSrc && (
          <div style={{ width: '100%', maxHeight: 380, overflow: 'hidden' }}>
            <img src={coverSrc} alt={project.title} style={{ width: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Content sections */}
        <div style={{ padding: '32px' }}>
          {/* Problem / Insight / Solution */}
          {[
            { key: 'problem',  label: content.problemLabel  || 'Problem'  },
            { key: 'insight',  label: content.insightLabel  || 'Insight'  },
            { key: 'solution', label: content.solutionLabel || 'Solution' },
          ].filter(s => content[s.key]).map(section => (
            <div key={section.key} style={{ marginBottom: 28 }}>
              <h3 style={{
                fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace",
                color: 'rgba(0,255,65,0.6)',
                letterSpacing: 2,
                textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>{section.label}</h3>
              <p style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.7,
                margin: 0,
              }}>{content[section.key]}</p>
            </div>
          ))}

          {content.workedWith && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{
                fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace",
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: 2,
                margin: '0 0 6px',
              }}>WORKED WITH</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{content.workedWith}</p>
            </div>
          )}

          {/* Work images */}
          {workImages.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{
                fontSize: 10,
                fontFamily: "'Share Tech Mono', monospace",
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: 2,
                margin: '0 0 16px',
              }}>WORK</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {workImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Work ${i + 1}`}
                    style={{ width: '100%', display: 'block', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
