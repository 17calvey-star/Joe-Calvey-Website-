import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// Absolute path to this project's root — derived from this config file's own
// location so it is correct regardless of the process CWD at startup.
const PROJECT_ROOT = path.dirname(new URL(import.meta.url).pathname)

function jsonRes(res, data, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const timer = setTimeout(() => reject(new Error('Request body timeout')), 8000)
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => {
      clearTimeout(timer)
      try {
        const text = Buffer.concat(chunks).toString('utf-8')
        if (!text.trim()) return reject(new Error('Empty request body'))
        resolve(JSON.parse(text))
      } catch (e) { reject(e) }
    })
    req.on('error', e => { clearTimeout(timer); reject(e) })
  })
}

function adminApiPlugin() {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
      // ── Absolute-path helpers anchored to the project root ───────────────────
      // Use PROJECT_ROOT (derived from import.meta.url) — NOT process.cwd() or
      // server.config.root, which can both be wrong when launched via IDE tools.
      const root = PROJECT_ROOT
      const p = (...segs) => path.join(root, ...segs)

      // Paths used repeatedly
      const PROJECTS  = p('src/data/projects.json')
      const SETTINGS  = p('src/data/settings.json')
      const CONTENT   = p('src/content.json')
      const TODOS     = p('src/data/todos.json')
      const IMG_DIR   = p('src/assets/images/projects')
      const PDF_DIR   = p('public/pdfs')

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const url = req.url.split('?')[0]

        try {

        // GET /api/admin-data — load all data files for the admin panel
        if (url === '/api/admin-data' && req.method === 'GET') {
          try {
            const projects = JSON.parse(fs.readFileSync(PROJECTS, 'utf-8'))
            const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf-8'))
            const content  = fs.existsSync(CONTENT) ? JSON.parse(fs.readFileSync(CONTENT, 'utf-8')) : {}
            const todos    = fs.existsSync(TODOS)   ? JSON.parse(fs.readFileSync(TODOS,   'utf-8')) : []

            const hasImages = {}
            if (fs.existsSync(IMG_DIR)) {
              for (const folder of fs.readdirSync(IMG_DIR)) {
                const workPath = path.join(IMG_DIR, folder, 'work')
                if (fs.existsSync(workPath)) {
                  const imgs = fs.readdirSync(workPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
                  if (imgs.length > 0) hasImages[folder] = imgs
                }
              }
            }
            return jsonRes(res, { projects, settings, content, todos, hasImages })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/save-projects
        if (url === '/api/save-projects' && req.method === 'POST') {
          try {
            const { projects } = await readBody(req)
            fs.writeFileSync(PROJECTS, JSON.stringify(projects, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/save-settings
        if (url === '/api/save-settings' && req.method === 'POST') {
          try {
            const { settings } = await readBody(req)
            fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/save-content
        if (url === '/api/save-content' && req.method === 'POST') {
          try {
            const { id, problem, insight, solution, workedWith, problemLabel, insightLabel, solutionLabel } = await readBody(req)
            const content = fs.existsSync(CONTENT) ? JSON.parse(fs.readFileSync(CONTENT, 'utf-8')) : {}
            content[id] = {
              problem:        problem        ?? content[id]?.problem        ?? '',
              insight:        insight        ?? content[id]?.insight        ?? '',
              solution:       solution       ?? content[id]?.solution       ?? '',
              workedWith:     workedWith     ?? content[id]?.workedWith     ?? '',
              problemLabel:   problemLabel   ?? content[id]?.problemLabel   ?? 'Problem',
              insightLabel:   insightLabel   ?? content[id]?.insightLabel   ?? 'Insight',
              solutionLabel:  solutionLabel  ?? content[id]?.solutionLabel  ?? 'Solution',
            }
            fs.writeFileSync(CONTENT, JSON.stringify(content, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/upload-image — { projectId, imageType: 'cover'|'work', filename, dataUrl }
        if (url === '/api/upload-image' && req.method === 'POST') {
          try {
            const { projectId, imageType, filename, dataUrl } = await readBody(req)
            const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
            const buf = Buffer.from(base64, 'base64')
            const projectDir = path.join(IMG_DIR, projectId)
            fs.mkdirSync(projectDir, { recursive: true })

            let destPath
            if (imageType === 'cover') {
              destPath = path.join(projectDir, 'cover.png')
            } else if (imageType === 'work') {
              const workDir = path.join(projectDir, 'work')
              fs.mkdirSync(workDir, { recursive: true })
              destPath = path.join(workDir, filename)
            } else {
              return jsonRes(res, { error: 'unknown imageType' }, 400)
            }

            fs.writeFileSync(destPath, buf)
            return jsonRes(res, { ok: true, path: destPath })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // DELETE /api/delete-work-image
        if (url === '/api/delete-work-image' && req.method === 'DELETE') {
          try {
            const { projectId, filename } = await readBody(req)
            const filePath = path.join(IMG_DIR, projectId, 'work', filename)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/upload-pdf — saves to public/pdfs/{projectId}.pdf
        if (url === '/api/upload-pdf' && req.method === 'POST') {
          try {
            const { projectId, filename, dataUrl } = await readBody(req)
            const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
            const buf = Buffer.from(base64, 'base64')
            fs.mkdirSync(PDF_DIR, { recursive: true })
            const destPath = path.join(PDF_DIR, `${projectId}.pdf`)
            fs.writeFileSync(destPath, buf)
            return jsonRes(res, { ok: true, url: `/pdfs/${projectId}.pdf` })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // GET /api/todos
        if (url === '/api/todos' && req.method === 'GET') {
          try {
            const todos = fs.existsSync(TODOS) ? JSON.parse(fs.readFileSync(TODOS, 'utf-8')) : []
            return jsonRes(res, todos)
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/todos
        if (url === '/api/todos' && req.method === 'POST') {
          try {
            const { todos } = await readBody(req)
            fs.writeFileSync(TODOS, JSON.stringify(todos, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // GET /api/git-status
        if (url === '/api/git-status' && req.method === 'GET') {
          try {
            const opts = { encoding: 'utf-8', cwd: root }
            const status     = execSync('git status --porcelain', opts).trim()
            const changes    = status ? status.split('\n').length : 0
            const branch     = execSync('git rev-parse --abbrev-ref HEAD', opts).trim()
            const lastCommit = execSync('git log -1 --format="%ar"', opts).trim()
            return jsonRes(res, { changes, branch, lastCommit })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/deploy
        if (url === '/api/deploy' && req.method === 'POST') {
          try {
            const { message } = await readBody(req).catch(() => ({ message: '' }))
            const msg = message?.trim() || `update: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
            const sshEnv = { ...process.env, GIT_SSH_COMMAND: 'ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no' }
            const gitOpts = { encoding: 'utf-8', env: sshEnv, cwd: root }

            execSync('git add -A', gitOpts)

            // Check if there's actually anything staged — skip commit if clean
            const staged = execSync('git diff --cached --name-only', gitOpts).trim()
            if (staged) {
              execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, gitOpts)
            }

            execSync('git push', gitOpts)

            // If a Netlify deploy hook is configured, trigger it now
            let hookTriggered = false
            try {
              const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf-8'))
              const hookUrl = settings?.deploy?.netlifyHookUrl?.trim()
              if (hookUrl) {
                await fetch(hookUrl, { method: 'POST' })
                hookTriggered = true
              }
            } catch (_) { /* hook call is best-effort */ }

            return jsonRes(res, {
              ok: true,
              message: staged ? msg : '(nothing to commit — pushed existing commits)',
              hookTriggered,
            })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // ── Catch-all: unknown /api/ route ────────────────────────────────────
        return jsonRes(res, { error: `Unknown API endpoint: ${url}` }, 404)

        } catch (e) {
          console.error('[admin-api] unhandled error on', url, e.message)
          if (!res.headersSent) return jsonRes(res, { error: e.message || 'Internal server error' }, 500)
        }
      })
    },
  }
}

export default defineConfig({
  server: {
    watch: {
      // Ignore data files so Vite doesn't hot-reload when the admin panel saves.
      // Paths must be absolute — PROJECT_ROOT is set via import.meta.url above.
      ignored: [
        path.join(PROJECT_ROOT, 'src/data/projects.json'),
        path.join(PROJECT_ROOT, 'src/data/settings.json'),
        path.join(PROJECT_ROOT, 'src/data/todos.json'),
        path.join(PROJECT_ROOT, 'src/content.json'),
        path.join(PROJECT_ROOT, 'public/pdfs'),
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    adminApiPlugin(),
  ],
})
