require('dotenv').config()

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const {
  createLead,
  listLeads,
  countLeads,
  listEntities,
  countEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  getSettings,
  updateSettings,
  listPublicCategories,
  initStore
} = require('./store')
const { ensureAuthConfigured, verifyCredentials, signToken, requireAdmin } = require('./auth')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const adminPublicDir = path.join(__dirname, '../public')
const adminIndexFile = path.join(adminPublicDir, 'index.html')

function hasAdminStatic() {
  try {
    return fs.existsSync(adminIndexFile)
  } catch (_e) {
    return false
  }
}

app.get('/health', async (_req, res) => {
  res.json({ ok: true })
})

if (hasAdminStatic()) {
  app.use(express.static(adminPublicDir))
  app.get('/', async (_req, res) => {
    res.sendFile(adminIndexFile)
  })
}

app.get('/api/public/settings', async (_req, res) => {
  try {
    const data = await getSettings()
    res.json({ ok: true, data })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.get('/api/public/categories', async (_req, res) => {
  try {
    const items = await listPublicCategories()
    res.json({ ok: true, data: items })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.post('/api/admin/login', async (req, res) => {
  try {
    const payload = req.body || {}
    const email = String(payload.email || '').trim()
    const password = String(payload.password || '')
    if (!email || !password) {
      res.status(400).json({ ok: false, message: 'email/password required' })
      return
    }
    const ok = await verifyCredentials(email, password)
    if (!ok) {
      res.status(401).json({ ok: false, message: 'invalid credentials' })
      return
    }
    const token = signToken({ email })
    res.json({ ok: true, data: { token, email } })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.get('/api/admin/me', requireAdmin, async (req, res) => {
  res.json({ ok: true, data: { email: req.admin && req.admin.email ? req.admin.email : '' } })
})

app.post('/api/leads', async (req, res) => {
  try {
    const payload = req.body || {}
    const nickName = String(payload.nickName || '').trim()
    const avatarUrl = String(payload.avatarUrl || '').trim()
    const visitorId = String(payload.visitorId || '').trim()
    const source = String(payload.source || '').trim()

    if (!nickName || !avatarUrl) {
      res.status(400).json({ ok: false, message: 'nickName/avatarUrl required' })
      return
    }

    const lead = await createLead({
      nickName,
      avatarUrl,
      visitorId,
      source,
      meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : null
    })
    res.json({ ok: true, data: lead })
  } catch (e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.get('/api/admin/leads', requireAdmin, async (req, res) => {
  const limit = req.query.limit
  const offset = req.query.offset
  const q = req.query.q
  const items = await listLeads({ limit, offset, q })
  const total = await countLeads({ q })
  res.json({ ok: true, data: { items, total } })
})

app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  const [products, cases, posts, storeCards, categories, leads] = await Promise.all([
    countEntities('products', {}),
    countEntities('cases', {}),
    countEntities('posts', {}),
    countEntities('storeCards', {}),
    countEntities('categories', {}),
    countLeads({})
  ])
  res.json({ ok: true, data: { products, cases, posts, storeCards, categories, leads } })
})

function parseEntityName(v) {
  const s = String(v || '').trim()
  if (s === 'products') return 'products'
  if (s === 'cases') return 'cases'
  if (s === 'posts') return 'posts'
  if (s === 'store-cards') return 'storeCards'
  if (s === 'storeCards') return 'storeCards'
  if (s === 'categories') return 'categories'
  return ''
}

app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
  try {
    const data = await getSettings()
    res.json({ ok: true, data })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const data = await updateSettings(req.body || {})
    res.json({ ok: true, data })
  } catch (_e) {
    res.status(400).json({ ok: false, message: 'invalid payload' })
  }
})

app.get('/api/admin/:entity', requireAdmin, async (req, res) => {
  const entity = parseEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  const { limit, offset, q } = req.query
  const items = await listEntities(entity, { limit, offset, q })
  const total = await countEntities(entity, { q })
  res.json({ ok: true, data: { items, total } })
})

app.get('/api/admin/:entity/:id', requireAdmin, async (req, res) => {
  const entity = parseEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  const item = await getEntity(entity, req.params.id)
  if (!item) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  res.json({ ok: true, data: item })
})

app.post('/api/admin/:entity', requireAdmin, async (req, res) => {
  const entity = parseEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  try {
    const item = await createEntity(entity, req.body || {})
    res.json({ ok: true, data: item })
  } catch (_e) {
    res.status(400).json({ ok: false, message: 'invalid payload' })
  }
})

app.put('/api/admin/:entity/:id', requireAdmin, async (req, res) => {
  const entity = parseEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  try {
    const item = await updateEntity(entity, req.params.id, req.body || {})
    res.json({ ok: true, data: item })
  } catch (e) {
    const msg = String(e && e.message ? e.message : '')
    if (msg === 'not found') res.status(404).json({ ok: false, message: 'not found' })
    else res.status(400).json({ ok: false, message: 'invalid payload' })
  }
})

app.delete('/api/admin/:entity/:id', requireAdmin, async (req, res) => {
  const entity = parseEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  try {
    const ok = await deleteEntity(entity, req.params.id)
    if (!ok) {
      res.status(404).json({ ok: false, message: 'not found' })
      return
    }
    res.json({ ok: true })
  } catch (_e) {
    res.status(400).json({ ok: false, message: 'invalid payload' })
  }
})

async function main() {
  ensureAuthConfigured()
  await initStore()
  const port = Number(process.env.PORT) || 3000
  const server = app.listen(port, () => {
    process.stdout.write(`server listening on http://localhost:${port}\n`)
  })
  server.on('error', (e) => {
    process.stderr.write(`listen error: ${e && e.message ? e.message : String(e)}\n`)
    process.exit(1)
  })
}

if (hasAdminStatic()) {
  app.get('*', async (req, res) => {
    const p = String(req.path || '')
    if (p.startsWith('/api/') || p === '/health') {
      res.status(404).json({ ok: false, message: 'not found' })
      return
    }
    res.sendFile(adminIndexFile)
  })
} else {
  app.get('/', async (_req, res) => {
    res.json({
      ok: true,
      service: 'mowei-backend',
      endpoints: ['/health', '/api/public/settings', '/api/public/categories', '/api/admin/login']
    })
  })
}

main().catch((e) => {
  process.stderr.write(`${e && e.stack ? e.stack : String(e)}\n`)
  process.exit(1)
})
