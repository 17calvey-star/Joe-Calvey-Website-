import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const FONT   = "'Share Tech Mono', monospace"
const SANS   = "'Inter', sans-serif"
const ACCENT = '#00ff41'

const api = (url, opts = {}) =>
  fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
    .then(r => r.text())
    .then(text => {
      if (!text) throw new Error('Server returned empty response')
      try { return JSON.parse(text) } catch (_) { throw new Error(`Server returned non-JSON: ${text.slice(0, 80)}`) }
    })

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function Btn({ children, onClick, danger, accent, disabled, style = {} }) {
  const bg    = danger ? 'rgba(200,40,40,0.12)' : accent ? 'rgba(0,255,65,0.1)' : 'rgba(255,255,255,0.06)'
  const color = danger ? '#ff6060' : accent ? ACCENT : 'rgba(255,255,255,0.7)'
  const border = danger ? 'rgba(200,40,40,0.3)' : accent ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.15)'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color, border: `1px solid ${border}`,
        padding: '5px 12px', fontSize: 11, fontFamily: FONT,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >{children}</button>
  )
}

function Field({ label, value, onChange, multiline, placeholder }) {
  const style = {
    width: '100%', background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)',
    padding: '6px 10px', fontFamily: SANS, fontSize: 13,
    resize: multiline ? 'vertical' : 'none', outline: 'none',
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={style} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
      }
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 34, height: 18, borderRadius: 9,
          background: checked ? 'rgba(0,255,65,0.25)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${checked ? 'rgba(0,255,65,0.4)' : 'rgba(255,255,255,0.12)'}`,
          position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: checked ? ACCENT : 'rgba(255,255,255,0.3)',
          transition: 'all 0.15s',
        }} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  )
}

function ColourField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="color"
          value={value || '#4a9eff'}
          onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 28, border: '1px solid rgba(255,255,255,0.15)', background: 'none', cursor: 'pointer', padding: 2 }}
        />
        <input
          value={value || '#4a9eff'}
          onChange={e => onChange(e.target.value)}
          placeholder="#4a9eff"
          style={{
            width: 100, background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)',
            padding: '6px 10px', fontFamily: SANS, fontSize: 13, outline: 'none',
          }}
        />
        <div style={{
          width: 28, height: 28,
          background: value || '#4a9eff',
          border: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }} />
      </div>
    </div>
  )
}

// ── Projects tab ─────────────────────────────────────────────────────────────

function ProjectsTab({ projects, content, hasImages, onChange }) {
  const [editing, setEditing] = useState(null) // project id
  const [localProjects, setLocalProjects] = useState(projects)
  const [localContent, setLocalContent]   = useState(content)
  const [saving, setSaving]   = useState(false)
  const [status, setStatus]   = useState('')
  const fileRef = useRef(null)
  const workFileRef = useRef(null)
  const pdfFileRef = useRef(null)

  useEffect(() => { setLocalProjects(projects) }, [projects])
  useEffect(() => { setLocalContent(content) }, [content])

  const save = async (newProjects, newContent) => {
    setSaving(true)
    try {
      await api('/api/save-projects', { method: 'POST', body: JSON.stringify({ projects: newProjects }) })
      if (newContent) {
        for (const [id, c] of Object.entries(newContent)) {
          await api('/api/save-content', { method: 'POST', body: JSON.stringify({ id, ...c }) })
        }
      }
      onChange({ projects: newProjects, content: newContent || localContent })
      setStatus('Saved')
      setTimeout(() => setStatus(''), 2000)
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
    setSaving(false)
  }

  const addProject = async () => {
    const id = genId()
    const p = {
      id, title: 'New Project', brief: '', icon: 'folder', colour: '#4a9eff',
      tags: [], year: new Date().getFullYear().toString(), module: '',
      hidden: false, videoUrl: '', pdfUrl: '', externalLink: '',
      desktopPos: { x: 0, y: 0 }, order: localProjects.length,
    }
    const updated = [...localProjects, p]
    setLocalProjects(updated)
    setLocalContent(c => ({ ...c, [id]: { problem: '', insight: '', solution: '', workedWith: '', problemLabel: 'Problem', insightLabel: 'Insight', solutionLabel: 'Solution' } }))
    setEditing(id)
    await save(updated, null)
  }

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return
    const updated = localProjects.filter(p => p.id !== id)
    setLocalProjects(updated)
    if (editing === id) setEditing(null)
    await save(updated, null)
  }

  const updateProject = (id, key, val) => {
    setLocalProjects(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p))
  }

  const updateContent = (id, key, val) => {
    setLocalContent(c => ({ ...c, [id]: { ...c[id], [key]: val } }))
  }

  const uploadCover = async (projectId, file) => {
    const dataUrl = await fileToDataUrl(file)
    await api('/api/upload-image', { method: 'POST', body: JSON.stringify({ projectId, imageType: 'cover', filename: 'cover.png', dataUrl }) })
    setStatus('Cover uploaded — restart dev server to see it')
    setTimeout(() => setStatus(''), 3000)
  }

  const uploadWork = async (projectId, file) => {
    const dataUrl = await fileToDataUrl(file)
    await api('/api/upload-image', { method: 'POST', body: JSON.stringify({ projectId, imageType: 'work', filename: file.name, dataUrl }) })
    setStatus('Work image uploaded — restart dev server to see it')
    setTimeout(() => setStatus(''), 3000)
  }

  const uploadPdf = async (projectId, file) => {
    const dataUrl = await fileToDataUrl(file)
    const res = await api('/api/upload-pdf', { method: 'POST', body: JSON.stringify({ projectId, filename: file.name, dataUrl }) })
    if (res.ok) {
      // Set the pdfUrl on the project
      setLocalProjects(ps => ps.map(p => p.id === projectId ? { ...p, pdfUrl: res.url } : p))
      setStatus('PDF uploaded ✓')
      setTimeout(() => setStatus(''), 3000)
    } else {
      setStatus('PDF upload failed: ' + (res.error || 'unknown'))
    }
  }

  const saveEditing = async () => {
    await save(localProjects, localContent)
  }

  const editingProject = localProjects.find(p => p.id === editing)
  const editingContent = editing ? (localContent[editing] || {}) : {}

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Project list */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>PROJECTS</span>
          <Btn accent onClick={addProject}>+ Add</Btn>
        </div>
        {[...localProjects].sort((a,b) => (a.order??0)-(b.order??0)).map(p => (
          <div
            key={p.id}
            onClick={() => setEditing(p.id)}
            style={{
              padding: '8px 10px', marginBottom: 4, cursor: 'pointer',
              background: editing === p.id ? 'rgba(0,255,65,0.08)' : 'rgba(255,255,255,0.03)',
              border: editing === p.id ? `1px solid rgba(0,255,65,0.2)` : '1px solid transparent',
              opacity: p.hidden ? 0.45 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, background: p.colour || '#4a9eff', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: editing === p.id ? ACCENT : 'rgba(255,255,255,0.7)', fontFamily: SANS, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title || 'Untitled'}
              </div>
            </div>
            <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.25)', paddingLeft: 14 }}>
              {p.year}{p.hidden ? '  [hidden]' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {!editingProject ? (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: FONT, fontSize: 11, marginTop: 40, textAlign: 'center' }}>
            Select a project to edit
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontFamily: FONT, color: 'rgba(255,255,255,0.6)' }}>
                Editing: <span style={{ color: '#fff' }}>{editingProject.title}</span>
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn danger onClick={() => deleteProject(editing)}>Delete</Btn>
                <Btn accent onClick={saveEditing} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
              </div>
            </div>

            {status && (
              <div style={{ marginBottom: 16, fontSize: 11, fontFamily: FONT, color: ACCENT }}>{status}</div>
            )}

            <Field label="TITLE" value={editingProject.title} onChange={v => updateProject(editing, 'title', v)} />
            <Field label="BRIEF" value={editingProject.brief} onChange={v => updateProject(editing, 'brief', v)} multiline placeholder="Short description shown below icon" />
            <Field label="YEAR" value={editingProject.year} onChange={v => updateProject(editing, 'year', v)} />
            <Field label="MODULE" value={editingProject.module || ''} onChange={v => updateProject(editing, 'module', v)} placeholder="e.g. AAD2006" />
            <Field label="TAGS (comma separated)" value={(editingProject.tags || []).join(', ')} onChange={v => updateProject(editing, 'tags', v.split(',').map(t => t.trim()).filter(Boolean))} />

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <Field label="ORDER (lower = first)" value={String(editingProject.order ?? 0)} onChange={v => updateProject(editing, 'order', parseInt(v) || 0)} />
              </div>
              <div style={{ flex: 1 }}>
                <ColourField label="ICON COLOUR" value={editingProject.colour || '#4a9eff'} onChange={v => updateProject(editing, 'colour', v)} />
              </div>
            </div>

            <Toggle
              label="HIDDEN"
              checked={!!editingProject.hidden}
              onChange={v => updateProject(editing, 'hidden', v)}
              hint="Hides this project from the desktop"
            />

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0 16px' }} />

            <Field label="VIDEO URL" value={editingProject.videoUrl || ''} onChange={v => updateProject(editing, 'videoUrl', v)} placeholder="YouTube or Vimeo URL" />
            <Field label="EXTERNAL LINK" value={editingProject.externalLink || ''} onChange={v => updateProject(editing, 'externalLink', v)} placeholder="https://..." />

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />

            {/* Cover image upload */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>COVER IMAGE</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) uploadCover(editing, e.target.files[0]); e.target.value = '' }} />
              <Btn onClick={() => fileRef.current?.click()}>Upload Cover Image</Btn>
            </div>

            {/* Work images */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>
                WORK IMAGES {hasImages[editing] ? `(${hasImages[editing].length} uploaded)` : '(none)'}
              </div>
              {(() => {
                const allUploaded = hasImages[editing] || []
                const rawOrder    = editingProject?.imageOrder || []
                // Respect saved order; append any new files not yet in the order list
                const ordered = [
                  ...rawOrder.filter(f => allUploaded.includes(f)),
                  ...allUploaded.filter(f => !rawOrder.includes(f)),
                ]
                const move = (idx, dir) => {
                  const next = [...ordered]
                  const target = idx + dir
                  if (target < 0 || target >= next.length) return
                  ;[next[idx], next[target]] = [next[target], next[idx]]
                  updateProject(editing, 'imageOrder', next)
                }
                return ordered.map((img, idx) => (
                  <div key={img} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {/* Order buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        title="Move up"
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
                          width: 20, height: 16, cursor: idx === 0 ? 'default' : 'pointer',
                          fontSize: 9, lineHeight: 1, padding: 0,
                        }}
                      >▲</button>
                      <button
                        onClick={() => move(idx, 1)}
                        disabled={idx === ordered.length - 1}
                        title="Move down"
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: idx === ordered.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
                          width: 20, height: 16, cursor: idx === ordered.length - 1 ? 'default' : 'pointer',
                          fontSize: 9, lineHeight: 1, padding: 0,
                        }}
                      >▼</button>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.3)', minWidth: 16 }}>{idx + 1}.</span>
                    <span style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img}</span>
                    <Btn danger onClick={async () => {
                      await api('/api/delete-work-image', { method: 'DELETE', body: JSON.stringify({ projectId: editing, filename: img }) })
                      updateProject(editing, 'imageOrder', ordered.filter(f => f !== img))
                      setStatus('Deleted — restart dev server to update')
                    }}>Delete</Btn>
                  </div>
                ))
              })()}
              <input ref={workFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => {
                  const files = Array.from(e.target.files || [])
                  files.forEach(f => uploadWork(editing, f))
                  e.target.value = ''
                }} />
              <Btn onClick={() => workFileRef.current?.click()}>Add Work Image(s)</Btn>
            </div>

            {/* PDF process book */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>PDF PROCESS BOOK</div>
              {editingProject.pdfUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: FONT, color: ACCENT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {editingProject.pdfUrl}
                  </span>
                  <Btn danger onClick={() => updateProject(editing, 'pdfUrl', '')}>Remove</Btn>
                </div>
              ) : (
                <div style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>No PDF uploaded</div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input ref={pdfFileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) uploadPdf(editing, e.target.files[0]); e.target.value = '' }} />
                <Btn onClick={() => pdfFileRef.current?.click()}>Upload PDF</Btn>
                <span style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.2)' }}>or</span>
                <input
                  value={editingProject.pdfUrl || ''}
                  onChange={e => updateProject(editing, 'pdfUrl', e.target.value)}
                  placeholder="Paste external PDF URL"
                  style={{
                    flex: 1, background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)',
                    padding: '5px 8px', fontFamily: SANS, fontSize: 12, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />

            {/* Project text content */}
            <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>TEXT CONTENT</div>
            <Field label="PROBLEM LABEL" value={editingContent.problemLabel || 'Problem'} onChange={v => updateContent(editing, 'problemLabel', v)} />
            <Field label="PROBLEM" value={editingContent.problem || ''} onChange={v => updateContent(editing, 'problem', v)} multiline />
            <Field label="INSIGHT LABEL" value={editingContent.insightLabel || 'Insight'} onChange={v => updateContent(editing, 'insightLabel', v)} />
            <Field label="INSIGHT" value={editingContent.insight || ''} onChange={v => updateContent(editing, 'insight', v)} multiline />
            <Field label="SOLUTION LABEL" value={editingContent.solutionLabel || 'Solution'} onChange={v => updateContent(editing, 'solutionLabel', v)} />
            <Field label="SOLUTION" value={editingContent.solution || ''} onChange={v => updateContent(editing, 'solution', v)} multiline />
            <Field label="WORKED WITH" value={editingContent.workedWith || ''} onChange={v => updateContent(editing, 'workedWith', v)} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ settings, onChange }) {
  const [local, setLocal] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => { setLocal(settings) }, [settings])

  const save = async () => {
    setSaving(true)
    try {
      await api('/api/save-settings', { method: 'POST', body: JSON.stringify({ settings: local }) })
      onChange({ settings: local })
      setStatus('Saved')
      setTimeout(() => setStatus(''), 2000)
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
    setSaving(false)
  }

  const set = (path, val) => {
    setLocal(s => {
      const parts = path.split('.')
      const next = JSON.parse(JSON.stringify(s))
      let cur = next
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {}
        cur = cur[parts[i]]
      }
      cur[parts[parts.length - 1]] = val
      return next
    })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>SITE</div>
        <Field label="SITE TITLE" value={local.siteTitle || ''} onChange={v => set('siteTitle', v)} placeholder="Joe Calvey" />
        <Field label="OS TITLE (shown in title bar)" value={local.osTitle || ''} onChange={v => set('osTitle', v)} placeholder="CALVEY OS  v1.0" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>DEPLOY</div>
        <Field
          label="NETLIFY DEPLOY HOOK URL"
          value={local.deploy?.netlifyHookUrl || ''}
          onChange={v => set('deploy.netlifyHookUrl', v)}
          placeholder="https://api.netlify.com/build_hooks/..."
        />
        <div style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.2)', marginTop: -8, marginBottom: 4 }}>
          Paste your hook URL here, then turn off auto-publishing on Netlify.
        </div>
        <div style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.15)', marginBottom: 12 }}>
          Netlify → Site config → Build &amp; deploy → Deploy hooks → Add hook
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>NOTIFICATIONS (ntfy.sh)</div>
        <Field label="NTFY TOPIC" value={local.notifications?.ntfyTopic || ''} onChange={v => set('notifications.ntfyTopic', v)} placeholder="e.g. portfolio-joe-2026" />
        <div style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.2)', marginTop: -8, marginBottom: 12 }}>
          Only fires on the live site. Subscribe in the ntfy app using this topic name.
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>ANALYTICS</div>
        <Field label="GOATCOUNTER SITE CODE" value={local.analytics?.goatcounterSiteCode || ''} onChange={v => set('analytics.goatcounterSiteCode', v)} placeholder="e.g. joecalvey" />
        <div style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.2)', marginTop: -8 }}>
          Free at goatcounter.com — your site code from the dashboard URL
        </div>
      </div>

      {status && <div style={{ marginBottom: 12, fontSize: 11, fontFamily: FONT, color: ACCENT }}>{status}</div>}
      <Btn accent onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Btn>
    </div>
  )
}

// ── Deploy tab ────────────────────────────────────────────────────────────────

function DeployTab() {
  const [gitInfo, setGitInfo]     = useState(null)
  const [message, setMessage]     = useState('')
  const [deploying, setDeploying] = useState(false)
  const [log, setLog]             = useState('')

  useEffect(() => {
    api('/api/git-status').then(setGitInfo).catch(() => setGitInfo({ error: 'Not a git repo or git unavailable' }))
  }, [])

  const deploy = async () => {
    if (deploying) return
    setDeploying(true)
    setLog('Running git add -A && git commit && git push…')
    try {
      const res = await api('/api/deploy', {
        method: 'POST',
        body: JSON.stringify({ message: message || undefined }),
      })
      if (res.ok) {
        const hookLine = res.hookTriggered
          ? '\n🔔 Netlify deploy hook triggered — rebuilding now.'
          : '\n(No deploy hook set — make sure auto-publishing is on, or add a hook in Settings.)'
        setLog(`✓ Pushed: "${res.message}"${hookLine}`)
        setMessage('')
        const info = await api('/api/git-status')
        setGitInfo(info)
      } else {
        setLog(`✗ Error: ${res.error}`)
      }
    } catch (e) {
      setLog(`✗ ${e.message}`)
    }
    setDeploying(false)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, maxWidth: 480 }}>
      <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 16 }}>DEPLOY TO NETLIFY</div>

      {gitInfo && (
        <div style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 14px', marginBottom: 20, fontFamily: FONT, fontSize: 11,
        }}>
          {gitInfo.error ? (
            <span style={{ color: '#ff6060' }}>{gitInfo.error}</span>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Branch: <span style={{ color: '#fff' }}>{gitInfo.branch}</span></div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Uncommitted changes: <span style={{ color: gitInfo.changes > 0 ? ACCENT : 'rgba(255,255,255,0.4)' }}>{gitInfo.changes}</span></div>
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>Last commit: <span style={{ color: '#fff' }}>{gitInfo.lastCommit}</span></div>
            </>
          )}
        </div>
      )}

      <Field
        label="COMMIT MESSAGE (optional)"
        value={message}
        onChange={setMessage}
        placeholder={`update: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
      />

      <Btn accent onClick={deploy} disabled={deploying} style={{ marginBottom: 16 }}>
        {deploying ? 'Deploying…' : '🚀 Deploy'}
      </Btn>

      {log && (
        <pre style={{
          fontFamily: FONT, fontSize: 10,
          color: log.startsWith('✓') ? ACCENT : log.startsWith('✗') ? '#ff6060' : 'rgba(255,255,255,0.5)',
          background: 'rgba(0,0,0,0.3)', padding: 12, whiteSpace: 'pre-wrap', marginTop: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>{log}</pre>
      )}
    </div>
  )
}

// ── Todo tab ──────────────────────────────────────────────────────────────────

function TodoTab() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    api('/api/todos').then(t => setTodos(Array.isArray(t) ? t : [])).catch(() => {})
  }, [])

  const persist = async (next) => {
    setTodos(next)
    await api('/api/todos', { method: 'POST', body: JSON.stringify({ todos: next }) }).catch(() => {})
  }

  const add = () => {
    if (!input.trim()) return
    persist([...todos, { id: genId(), text: input.trim(), done: false }])
    setInput('')
  }

  const toggle = (id) => persist(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove = (id) => persist(todos.filter(t => t.id !== id))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, maxWidth: 480 }}>
      <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 16 }}>TO-DO</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a task…"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)',
            padding: '6px 10px', fontFamily: SANS, fontSize: 13, outline: 'none',
          }}
        />
        <Btn accent onClick={add}>Add</Btn>
      </div>

      {todos.map(todo => (
        <div key={todo.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggle(todo.id)}
            style={{ accentColor: ACCENT, width: 14, height: 14, flexShrink: 0 }}
          />
          <span style={{
            flex: 1, fontSize: 13, fontFamily: SANS,
            color: todo.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
            textDecoration: todo.done ? 'line-through' : 'none',
          }}>{todo.text}</span>
          <button onClick={() => remove(todo.id)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
            cursor: 'pointer', fontSize: 14, padding: '0 4px',
          }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Contact tab ───────────────────────────────────────────────────────────────

function ContactTab({ settings, onChange }) {
  const [local, setLocal]   = useState(settings?.contact || {})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => { setLocal(settings?.contact || {}) }, [settings])

  const save = async () => {
    setSaving(true)
    try {
      const next = { ...settings, contact: local }
      await api('/api/save-settings', { method: 'POST', body: JSON.stringify({ settings: next }) })
      onChange({ settings: next })
      setStatus('Saved')
      setTimeout(() => setStatus(''), 2000)
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
    setSaving(false)
  }

  const set = (key, val) => setLocal(c => ({ ...c, [key]: val }))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, maxWidth: 480 }}>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>
          IDENTITY
        </div>
        <Field label="NAME"     value={local.name     || ''} onChange={v => set('name',     v)} placeholder="Joe Calvey" />
        <Field label="LOCATION" value={local.location || ''} onChange={v => set('location', v)} placeholder="London, UK" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>
          DIRECT CONTACT
        </div>
        <Field label="EMAIL" value={local.email || ''} onChange={v => set('email', v)} placeholder="hello@example.com" />
        <Field label="PHONE" value={local.phone || ''} onChange={v => set('phone', v)} placeholder="+44 7700 000000" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>
          SOCIAL / LINKS
        </div>
        <Field label="LINKEDIN"       value={local.linkedin  || ''} onChange={v => set('linkedin',  v)} placeholder="joecalvey  or  linkedin.com/in/joecalvey" />
        <Field label="INSTAGRAM"      value={local.instagram || ''} onChange={v => set('instagram', v)} placeholder="@joecalvey" />
        <Field label="PORTFOLIO SITE" value={local.portfolio || ''} onChange={v => set('portfolio', v)} placeholder="joecalvey.com" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: FONT, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>
          PAGE MESSAGE
        </div>
        <Field label="SHORT MESSAGE (shown at top of Contact page)"
          value={local.message || ''} onChange={v => set('message', v)}
          multiline placeholder="Feel free to reach out…" />
        <div style={{ fontSize: 11, fontFamily: FONT, color: 'rgba(255,255,255,0.2)', marginTop: -8 }}>
          Leave blank to hide this section entirely.
        </div>
      </div>

      {status && <div style={{ marginBottom: 12, fontSize: 11, fontFamily: FONT, color: ACCENT }}>{status}</div>}
      <Btn accent onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Contact'}</Btn>
    </div>
  )
}

// ── Main Admin panel ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'settings', label: 'Settings' },
  { id: 'contact',  label: 'Contact' },
  { id: 'deploy',   label: 'Deploy' },
  { id: 'todo',     label: 'To-do' },
]

export default function Admin({ projects, settings, content, onClose, onChange }) {
  const [tab, setTab]             = useState('projects')
  const [adminData, setAdminData] = useState({ projects, settings, content, hasImages: {} })

  // Fresh load from disk on open
  useEffect(() => {
    api('/api/admin-data').then(d => {
      setAdminData(prev => ({
        projects:  d.projects  || projects,
        settings:  d.settings  || settings,
        content:   d.content   || content,
        hasImages: d.hasImages || {},
      }))
    }).catch(() => {})
  }, []) // eslint-disable-line

  const handleChange = useCallback((updates) => {
    setAdminData(prev => ({
      ...prev,
      ...(updates.projects ? { projects: updates.projects } : {}),
      ...(updates.settings ? { settings: updates.settings } : {}),
      ...(updates.content  ? { content:  updates.content  } : {}),
    }))
    onChange(updates)
  }, [onChange])

  // Drag to reposition panel
  const panelRef  = useRef(null)
  const dragRef   = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const onDragStart = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    dragRef.current = { active: true, startX: e.clientX - pos.x, startY: e.clientY - pos.y, ox: pos.x, oy: pos.y }
  }
  const onDragMove = useCallback((e) => {
    if (!dragRef.current.active) return
    setPos({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY })
  }, [])
  const onDragEnd = useCallback(() => { dragRef.current.active = false }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    return () => { window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd) }
  }, [onDragMove, onDragEnd])

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9990,
      pointerEvents: 'none',
    }}>
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          top: `calc(50% + ${pos.y}px)`, left: `calc(50% + ${pos.x}px)`,
          transform: 'translate(-50%, -50%)',
          width: 780, height: 540,
          background: '#0e0c09',
          border: '1px solid rgba(0,255,65,0.25)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 24px 64px rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column',
          pointerEvents: 'all',
          fontFamily: FONT,
        }}
      >
        {/* Title bar */}
        <div
          onMouseDown={onDragStart}
          style={{
            height: 36, background: '#0a0806',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center',
            padding: '0 12px',
            cursor: 'grab', userSelect: 'none',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(0,255,65,0.7)', letterSpacing: 2 }}>
            ADMIN — JOE CALVEY PORTFOLIO
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Ctrl+Shift+A to close</span>
            <button onClick={onClose} style={{
              background: 'rgba(200,40,40,0.15)', border: '1px solid rgba(200,40,40,0.3)',
              color: '#ff6060', width: 20, height: 20,
              cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 18px',
              background: tab === t.id ? 'rgba(0,255,65,0.06)' : 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: tab === t.id ? ACCENT : 'rgba(255,255,255,0.4)',
              fontFamily: FONT, fontSize: 10, letterSpacing: 1,
              cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content — overflow: hidden here so each tab manages its own scroll */}
        <div
          style={{ flex: 1, overflow: 'hidden' }}
          onWheel={e => e.stopPropagation()}
        >
          {tab === 'projects' && (
            <ProjectsTab
              projects={adminData.projects}
              content={adminData.content}
              hasImages={adminData.hasImages}
              onChange={handleChange}
            />
          )}
          {tab === 'settings' && (
            <SettingsTab
              settings={adminData.settings}
              onChange={handleChange}
            />
          )}
          {tab === 'contact' && (
            <ContactTab
              settings={adminData.settings}
              onChange={handleChange}
            />
          )}
          {tab === 'deploy'   && <DeployTab />}
          {tab === 'todo'     && <TodoTab />}
        </div>
      </div>
    </div>,
    document.body
  )
}
