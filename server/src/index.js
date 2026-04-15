require('dotenv').config()

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const {
  createLead,
  listLeads,
  countLeads,
  countUsers,
  upsertUserProfile,
  listEntities,
  countEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  getSettings,
  updateSettings,
  listPublicCategories,
  listPublicEntities,
  countPublicEntities,
  getPublicEntity,
  listPublicCaseTags,
  getStoreMode,
  initStore
} = require('./store')
const { ensureAuthConfigured, verifyCredentials, signToken, requireAdmin } = require('./auth')
const { uploadBufferToCos } = require('./upload')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

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

function parsePublicEntityName(v) {
  const s = String(v || '').trim()
  if (s === 'products') return 'products'
  if (s === 'cases') return 'cases'
  if (s === 'designs') return 'designs'
  if (s === 'posts') return 'posts'
  if (s === 'store-cards') return 'storeCards'
  if (s === 'storeCards') return 'storeCards'
  return ''
}

app.get('/api/public/case-tags', async (_req, res) => {
  try {
    const items = await listPublicCaseTags()
    res.json({ ok: true, data: items })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.get('/api/public/:entity', async (req, res) => {
  const entity = parsePublicEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  try {
    const { limit, offset, q, categoryId, tag } = req.query
    const items = await listPublicEntities(entity, { limit, offset, q, categoryId, tag })
    const total = await countPublicEntities(entity, { q, categoryId, tag })
    res.json({ ok: true, data: { items, total } })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.get('/api/public/:entity/:id', async (req, res) => {
  const entity = parsePublicEntityName(req.params.entity)
  if (!entity) {
    res.status(404).json({ ok: false, message: 'not found' })
    return
  }
  try {
    const item = await getPublicEntity(entity, req.params.id)
    if (!item) {
      res.status(404).json({ ok: false, message: 'not found' })
      return
    }
    res.json({ ok: true, data: item })
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

app.get('/api/admin/debug/env', requireAdmin, async (_req, res) => {
  res.json({
    ok: true,
    data: {
      hasCLOUDBASE_ENV_ID: !!String(process.env.CLOUDBASE_ENV_ID || '').trim(),
      hasTCB_ENV: !!String(process.env.TCB_ENV || '').trim(),
      hasWX_CLOUD_ENV_ID: !!String(process.env.WX_CLOUD_ENV_ID || '').trim(),
      hasWX_ENV_ID: !!String(process.env.WX_ENV_ID || '').trim(),
      hasTENCENTCLOUD_SECRETID: !!String(process.env.TENCENTCLOUD_SECRETID || '').trim(),
      hasTENCENTCLOUD_SECRETKEY: !!String(process.env.TENCENTCLOUD_SECRETKEY || '').trim(),
      hasWX_CONTEXT: !!String(process.env.WX_CONTEXT || '').trim()
    }
  })
})

app.get('/api/admin/debug/store', requireAdmin, async (_req, res) => {
  res.json({ ok: true, data: { mode: getStoreMode() } })
})

app.get('/api/admin/debug/cos', requireAdmin, async (_req, res) => {
  try {
    const Bucket = String(process.env.COS_BUCKET || '').trim()
    const Region = String(process.env.COS_REGION || '').trim()
    const hasBucket = !!Bucket
    const hasRegion = !!Region
    if (!hasBucket || !hasRegion) {
      res.json({ ok: true, data: { hasBucket, hasRegion, canCredential: false, error: 'missing env' } })
      return
    }
    let canCredential = false
    let error = ''
    try {
      const { getTencentCloudTempCredential } = require('./tencentCred')
      await getTencentCloudTempCredential()
      canCredential = true
    } catch (e) {
      error = String(e && e.message ? e.message : '')
    }
    res.json({
      ok: true,
      data: {
        hasBucket,
        hasRegion,
        hasWX_CONTEXT: !!String(process.env.WX_CONTEXT || '').trim(),
        hasTENCENTCLOUD_SECRETID: !!String(process.env.TENCENTCLOUD_SECRETID || '').trim(),
        hasTENCENTCLOUD_SECRETKEY: !!String(process.env.TENCENTCLOUD_SECRETKEY || '').trim(),
        canCredential,
        error: error || null
      }
    })
  } catch (_e) {
    res.status(500).json({ ok: false, message: 'internal error' })
  }
})

app.post('/api/admin/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const f = req.file
    if (!f || !f.buffer) {
      res.status(400).json({ ok: false, message: 'file required' })
      return
    }
    if (!String(f.mimetype || '').toLowerCase().startsWith('image/')) {
      res.status(400).json({ ok: false, message: 'only image allowed' })
      return
    }
    const out = await uploadBufferToCos({ buffer: f.buffer, mimeType: f.mimetype, originalName: f.originalname })
    if (!out.url) {
      res.status(500).json({ ok: false, message: 'upload failed' })
      return
    }
    res.json({ ok: true, data: out })
  } catch (e) {
    const msg = String(e && e.message ? e.message : 'upload failed').trim()
    if (msg.toLowerCase().includes('missing env')) {
      res.status(500).json({ ok: false, message: msg })
      return
    }
    res.status(500).json({ ok: false, message: msg ? msg.slice(0, 200) : 'upload failed' })
  }
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

function getWXOpenId(req) {
  const h = req && req.headers ? req.headers : {}
  const v =
    String(h['x-wx-openid'] || '').trim() ||
    String(h['x-wx-from-openid'] || '').trim() ||
    String(h['x-wx-source-openid'] || '').trim()
  return v
}

app.post('/api/user/profile', async (req, res) => {
  try {
    const openid = getWXOpenId(req)
    if (!openid) {
      res.status(401).json({ ok: false, message: 'missing openid' })
      return
    }
    const payload = req.body || {}
    const nickName = String(payload.nickName || '').trim()
    const avatarUrl = String(payload.avatarUrl || '').trim()
    if (!nickName || !avatarUrl) {
      res.status(400).json({ ok: false, message: 'nickName/avatarUrl required' })
      return
    }
    const data = await upsertUserProfile({ openid, nickName, avatarUrl })
    res.json({ ok: true, data })
  } catch (e) {
    const msg = String(e && e.message ? e.message : 'internal error')
    res.status(500).json({ ok: false, message: msg ? msg.slice(0, 200) : 'internal error' })
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
  try {
    const [products, cases, posts, storeCards, categories, leads, users] = await Promise.all([
      countEntities('products', {}),
      countEntities('cases', {}),
      countEntities('posts', {}),
      countEntities('storeCards', {}),
      countEntities('categories', {}),
      countLeads({}),
      countUsers()
    ])
    res.json({ ok: true, data: { products, cases, posts, storeCards, categories, leads, users } })
  } catch (e) {
    const msg = String(e && e.message ? e.message : '').trim()
    res.status(500).json({ ok: false, message: msg ? msg.slice(0, 200) : 'internal error' })
  }
})

function parseEntityName(v) {
  const s = String(v || '').trim()
  if (s === 'products') return 'products'
  if (s === 'cases') return 'cases'
  if (s === 'designs') return 'designs'
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
