import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

function jsonRes(res, data, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', c => { body += c })
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}

function adminApiPlugin() {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const url = req.url.split('?')[0]

        // GET /api/admin-data — load all data files for the admin panel
        if (url === '/api/admin-data' && req.method === 'GET') {
          try {
            const projects = JSON.parse(fs.readFileSync('./src/data/projects.json', 'utf-8'))
            const settings = JSON.parse(fs.readFileSync('./src/data/settings.json', 'utf-8'))
            const contentPath = './src/content.json'
            const content = fs.existsSync(contentPath) ? JSON.parse(fs.readFileSync(contentPath, 'utf-8')) : {}
            const todosPath = './src/data/todos.json'
            const todos = fs.existsSync(todosPath) ? JSON.parse(fs.readFileSync(todosPath, 'utf-8')) : []

            const projectImgDir = './src/assets/images/projects'
            const hasImages = {}
            if (fs.existsSync(projectImgDir)) {
              for (const folder of fs.readdirSync(projectImgDir)) {
                const workPath = path.join(projectImgDir, folder, 'work')
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
            fs.writeFileSync('./src/data/projects.json', JSON.stringify(projects, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/save-settings
        if (url === '/api/save-settings' && req.method === 'POST') {
          try {
            const { settings } = await readBody(req)
            fs.writeFileSync('./src/data/settings.json', JSON.stringify(settings, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/save-content
        if (url === '/api/save-content' && req.method === 'POST') {
          try {
            const { id, problem, insight, solution, workedWith, problemLabel, insightLabel, solutionLabel } = await readBody(req)
            const contentPath = './src/content.json'
            const content = fs.existsSync(contentPath) ? JSON.parse(fs.readFileSync(contentPath, 'utf-8')) : {}
            content[id] = {
              problem:        problem        ?? content[id]?.problem        ?? '',
              insight:        insight        ?? content[id]?.insight        ?? '',
              solution:       solution       ?? content[id]?.solution       ?? '',
              workedWith:     workedWith     ?? content[id]?.workedWith     ?? '',
              problemLabel:   problemLabel   ?? content[id]?.problemLabel   ?? 'Problem',
              insightLabel:   insightLabel   ?? content[id]?.insightLabel   ?? 'Insight',
              solutionLabel:  solutionLabel  ?? content[id]?.solutionLabel  ?? 'Solution',
            }
            fs.writeFileSync(contentPath, JSON.stringify(content, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/upload-image — { projectId, imageType: 'cover'|'work', filename, dataUrl }
        if (url === '/api/upload-image' && req.method === 'POST') {
          try {
            const { projectId, imageType, filename, dataUrl } = await readBody(req)
            const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '')
            const buf = Buffer.from(base64, 'base64')
            const projectDir = path.resolve(`./src/assets/images/projects/${projectId}`)
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
            const filePath = path.resolve(`./src/assets/images/projects/${projectId}/work/${filename}`)
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
            const pdfDir = path.resolve('./public/pdfs')
            fs.mkdirSync(pdfDir, { recursive: true })
            // Use projectId as filename so there's always one PDF per project
            const ext = filename?.endsWith('.pdf') ? '.pdf' : '.pdf'
            const destPath = path.join(pdfDir, `${projectId}${ext}`)
            fs.writeFileSync(destPath, buf)
            const publicUrl = `/pdfs/${projectId}.pdf`
            return jsonRes(res, { ok: true, url: publicUrl })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // GET /api/todos
        if (url === '/api/todos' && req.method === 'GET') {
          try {
            const todosPath = './src/data/todos.json'
            const todos = fs.existsSync(todosPath) ? JSON.parse(fs.readFileSync(todosPath, 'utf-8')) : []
            return jsonRes(res, todos)
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/todos
        if (url === '/api/todos' && req.method === 'POST') {
          try {
            const { todos } = await readBody(req)
            fs.writeFileSync('./src/data/todos.json', JSON.stringify(todos, null, 2) + '\n')
            return jsonRes(res, { ok: true })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // GET /api/git-status
        if (url === '/api/git-status' && req.method === 'GET') {
          try {
            const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
            const changes = status ? status.split('\n').length : 0
            const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
            const lastCommit = execSync('git log -1 --format="%ar"', { encoding: 'utf-8' }).trim()
            return jsonRes(res, { changes, branch, lastCommit })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        // POST /api/deploy
        if (url === '/api/deploy' && req.method === 'POST') {
          try {
            const { message } = await readBody(req).catch(() => ({ message: '' }))
            const msg = message?.trim() || `update: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
            const sshEnv = { ...process.env, GIT_SSH_COMMAND: 'ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no' }

            execSync('git add -A', { encoding: 'utf-8', env: sshEnv })

            // Check if there's actually anything staged — skip commit if clean
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim()
            if (staged) {
              execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { encoding: 'utf-8', env: sshEnv })
            }

            execSync('git push', { encoding: 'utf-8', env: sshEnv })
            return jsonRes(res, { ok: true, message: staged ? msg : '(nothing to commit — pushed existing commits)' })
          } catch (e) { return jsonRes(res, { error: e.message }, 500) }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  server: {
    watch: {
      ignored: [
        path.resolve('./src/data/projects.json'),
        path.resolve('./src/data/settings.json'),
        path.resolve('./src/data/todos.json'),
        path.resolve('./src/content.json'),
        path.resolve('./public/pdfs'),
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    adminApiPlugin(),
  ],
})
