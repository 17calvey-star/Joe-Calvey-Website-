import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProjectModal from './ProjectModal'

const coverGlob = import.meta.glob(
  '../assets/images/projects/*/cover.{png,jpg,jpeg,webp,PNG,JPG,JPEG}',
  { eager: true }
)
function getCover(projectId) {
  const entry = Object.entries(coverGlob).find(([p]) => p.includes(`/${projectId}/cover`))
  return entry ? entry[1].default : null
}

export default function Portfolio({ projects, content, activeProject, onProjectClick, onCloseProject, onBack }) {
  const sorted = [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0908',
      overflowY: 'auto',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0,
        background: 'rgba(10,9,8,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)',
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 12,
            letterSpacing: 1,
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
        >
          ← BACK
        </button>

        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: 2,
        }}>
          JOE CALVEY
        </div>

        <div style={{ width: 80 }} /> {/* spacer */}
      </div>

      {/* Project grid */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '48px 32px 80px',
      }}>
        {sorted.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 13,
            marginTop: 80,
          }}>
            No projects yet — add them in the admin panel (Ctrl+Shift+A)
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {sorted.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                coverSrc={getCover(project.id)}
                onClick={() => onProjectClick(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project modal */}
      <AnimatePresence>
        {activeProject && (
          <ProjectModal
            project={activeProject}
            content={content[activeProject.id] || {}}
            coverSrc={getCover(activeProject.id)}
            onClose={onCloseProject}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProjectCard({ project, index, coverSrc, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onClick={onClick}
      style={{
        background: '#111009',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Cover image or placeholder */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: '#0a0908',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: 'rgba(255,255,255,0.1)',
            letterSpacing: 1,
          }}>
            NO IMAGE
          </div>
        )}
      </div>

      {/* Card info */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 6,
        }}>
          <h2 style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            margin: 0,
          }}>{project.title}</h2>
          {project.year && (
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'Share Tech Mono', monospace",
            }}>{project.year}</span>
          )}
        </div>

        {project.brief && (
          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.55,
            margin: '0 0 12px',
          }}>{project.brief}</p>
        )}

        {project.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 10,
                color: 'rgba(0,255,65,0.5)',
                border: '1px solid rgba(0,255,65,0.2)',
                padding: '2px 8px',
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: 0.5,
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
