const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const mysql = require('mysql2/promise')

function getEnv(names) {
  for (const n of names) {
    const v = String(process.env[n] || '').trim()
    if (v) return v
  }
  return ''
}

function parseAddress(addr) {
  const s = String(addr || '').trim()
  if (!s) return { host: '', port: 0 }
  if (s.includes(':')) {
    const [h, p] = s.split(':')
    return { host: String(h || '').trim(), port: Number(p) || 0 }
  }
  return { host: s, port: 0 }
}

function getMySQLConfig() {
  const address = getEnv(['MYSQL_ADDRESS'])
  const parsed = parseAddress(address)
  const host = getEnv(['MYSQL_HOST']) || parsed.host
  const port = Number(getEnv(['MYSQL_PORT'])) || parsed.port || 3306
  const user = getEnv(['MYSQL_USER', 'MYSQL_USERNAME'])
  const password = getEnv(['MYSQL_PASSWORD'])
  const database = getEnv(['MYSQL_DATABASE', 'MYSQL_DB', 'MYSQL_DBNAME'])
  return { host, port, user, password, database }
}

function hasMySQLConfig() {
  const cfg = getMySQLConfig()
  return !!(cfg.host && cfg.user && cfg.database)
}

function nowISO() {
  return new Date().toISOString()
}

function newId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')
}

let mode = 'file'
let pool = null
const dataDir = path.join(__dirname, '../../data')
const leadsFile = path.join(dataDir, 'leads.json')
const usersFile = path.join(dataDir, 'users.json')
const postLikesFile = path.join(dataDir, 'post_likes.json')
const postCommentsFile = path.join(dataDir, 'post_comments.json')
const settingsFile = path.join(dataDir, 'app_settings.json')
const entityFiles = {
  products: path.join(dataDir, 'products.json'),
  cases: path.join(dataDir, 'cases.json'),
  designs: path.join(dataDir, 'designs.json'),
  posts: path.join(dataDir, 'posts.json'),
  storeCards: path.join(dataDir, 'store_cards.json'),
  categories: path.join(dataDir, 'categories.json')
}

async function initStore() {
  if (hasMySQLConfig()) {
    mode = 'mysql'
    const cfg = getMySQLConfig()
    pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password || '',
      database: cfg.database,
      connectionLimit: 10
    })
    await ensureMySQLSchema()
    return
  }

  mode = 'file'
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(leadsFile)) fs.writeFileSync(leadsFile, JSON.stringify([]))
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]))
  if (!fs.existsSync(postLikesFile)) fs.writeFileSync(postLikesFile, JSON.stringify([]))
  if (!fs.existsSync(postCommentsFile)) fs.writeFileSync(postCommentsFile, JSON.stringify([]))
  if (!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings(), null, 2))
  for (const k of Object.keys(entityFiles)) {
    const fp = entityFiles[k]
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify([]))
  }
}

async function ensureMySQLSchema() {
  async function tryAlter(sql) {
    try {
      await pool.query(sql)
    } catch (_e) {}
  }

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(64) PRIMARY KEY,
        nick_name VARCHAR(128) NOT NULL,
        avatar_url VARCHAR(512) NOT NULL,
        phone VARCHAR(32) NULL,
        visitor_id VARCHAR(128) NULL,
        source VARCHAR(128) NULL,
        meta_json TEXT NULL,
        created_at DATETIME NOT NULL
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS users (
        openid VARCHAR(128) PRIMARY KEY,
        nick_name VARCHAR(128) NOT NULL,
        avatar_url VARCHAR(512) NOT NULL,
        phone VARCHAR(32) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category_id VARCHAR(64) NULL,
        price DECIMAL(12,2) NULL,
        status VARCHAR(32) NOT NULL,
        cover_url VARCHAR(512) NULL,
        images_json TEXT NULL,
        skus_json TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )
  await tryAlter('ALTER TABLE products ADD COLUMN category_id VARCHAR(64) NULL')
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS cases (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        summary TEXT NULL,
        content TEXT NULL,
        status VARCHAR(32) NOT NULL,
        cover_url VARCHAR(512) NULL,
        images_json TEXT NULL,
        tags_json TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS designs (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL,
        cover_url VARCHAR(512) NULL,
        images_json TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NULL,
        status VARCHAR(32) NOT NULL,
        images_json TEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id VARCHAR(64) NOT NULL,
        actor_id VARCHAR(128) NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (post_id, actor_id)
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS post_comments (
        id VARCHAR(64) PRIMARY KEY,
        post_id VARCHAR(64) NOT NULL,
        actor_id VARCHAR(128) NOT NULL,
        nick_name VARCHAR(128) NOT NULL,
        avatar_url VARCHAR(512) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL
      )
    `
  )
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS store_cards (
        id VARCHAR(64) PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NULL,
        phone VARCHAR(64) NULL,
        wechat_id VARCHAR(128) NULL,
        address TEXT NULL,
        latitude DECIMAL(10,6) NULL,
        longitude DECIMAL(10,6) NULL,
        intro TEXT NULL,
        status VARCHAR(32) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        icon VARCHAR(64) NULL,
        sort_num INT NULL,
        status VARCHAR(32) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS app_settings (
        id VARCHAR(64) PRIMARY KEY,
        shop_name VARCHAR(255) NULL,
        phone VARCHAR(64) NULL,
        wechat_id VARCHAR(128) NULL,
        address TEXT NULL,
        latitude DECIMAL(10,6) NULL,
        longitude DECIMAL(10,6) NULL,
        banners_json TEXT NULL,
        home_nav_title VARCHAR(255) NULL,
        home_search_placeholder VARCHAR(255) NULL,
        home_case_title VARCHAR(255) NULL,
        home_case_sub_title VARCHAR(255) NULL,
        home_design_title VARCHAR(255) NULL,
        home_design_sub_title VARCHAR(255) NULL,
        home_products_title VARCHAR(255) NULL,
        updated_at DATETIME NOT NULL
      )
    `
  )

  await tryAlter('ALTER TABLE app_settings ADD COLUMN banners_json TEXT NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_nav_title VARCHAR(255) NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_search_placeholder VARCHAR(255) NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_case_title VARCHAR(255) NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_case_sub_title VARCHAR(255) NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_design_title VARCHAR(255) NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_design_sub_title VARCHAR(255) NULL')
  await tryAlter('ALTER TABLE app_settings ADD COLUMN home_products_title VARCHAR(255) NULL')

  await tryAlter('ALTER TABLE leads ADD COLUMN phone VARCHAR(32) NULL')

  await tryAlter('ALTER TABLE users ADD COLUMN nick_name VARCHAR(128) NOT NULL')
  await tryAlter('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NOT NULL')
  await tryAlter('ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL')
  await tryAlter('ALTER TABLE users ADD COLUMN created_at DATETIME NOT NULL')
  await tryAlter('ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL')

  await tryAlter('ALTER TABLE post_likes ADD COLUMN created_at DATETIME NOT NULL')

  await tryAlter('ALTER TABLE post_comments ADD COLUMN post_id VARCHAR(64) NOT NULL')
  await tryAlter('ALTER TABLE post_comments ADD COLUMN actor_id VARCHAR(128) NOT NULL')
  await tryAlter('ALTER TABLE post_comments ADD COLUMN nick_name VARCHAR(128) NOT NULL')
  await tryAlter('ALTER TABLE post_comments ADD COLUMN avatar_url VARCHAR(512) NOT NULL')
  await tryAlter('ALTER TABLE post_comments ADD COLUMN content TEXT NOT NULL')
  await tryAlter('ALTER TABLE post_comments ADD COLUMN created_at DATETIME NOT NULL')
}

function defaultSettings() {
  return {
    id: 'default',
    shopName: '',
    phone: '',
    wechatId: '',
    address: '',
    latitude: null,
    longitude: null,
    homeBanners: [],
    homeNavTitle: '',
    homeSearchPlaceholder: '请输入您想要搜索的产品',
    homeCaseTitle: '金华地区 | 上千家落地案例',
    homeCaseSubTitle: '落地案例实拍 · 点击查看详情',
    homeDesignTitle: '设计效果图',
    homeDesignSubTitle: '效果图案例 · 点击查看详情',
    homeProductsTitle: '推荐商品',
    updatedAt: nowISO()
  }
}

async function createLead(input) {
  const lead = {
    id: newId(),
    nickName: input.nickName,
    avatarUrl: input.avatarUrl,
    phone: String(input.phone || '').trim(),
    visitorId: input.visitorId || '',
    source: input.source || '',
    meta: input.meta || null,
    createdAt: nowISO()
  }

  if (mode === 'mysql') {
    const metaJson = lead.meta ? JSON.stringify(lead.meta) : null
    await pool.query(
      'INSERT INTO leads (id, nick_name, avatar_url, phone, visitor_id, source, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [lead.id, lead.nickName, lead.avatarUrl, lead.phone || null, lead.visitorId || null, lead.source || null, metaJson, new Date(lead.createdAt)]
    )
    return lead
  }

  const items = readLeadsFile()
  items.unshift(lead)
  writeLeadsFile(items)
  return lead
}

async function listLeads({ limit, offset, q }) {
  const take = Math.min(200, Math.max(1, Number(limit) || 50))
  const skip = Math.max(0, Number(offset) || 0)
  const keyword = String(q || '').trim()
  if (mode === 'mysql') {
    const where = keyword ? 'WHERE nick_name LIKE ? OR visitor_id LIKE ? OR source LIKE ? OR phone LIKE ?' : ''
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, take, skip] : [take, skip]
    const [rows] = await pool.query(
      `SELECT id, nick_name AS nickName, avatar_url AS avatarUrl, phone, visitor_id AS visitorId, source, meta_json AS metaJson, created_at AS createdAt FROM leads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    )
    return rows.map((r) => ({
      id: r.id,
      nickName: r.nickName,
      avatarUrl: r.avatarUrl,
      phone: r.phone || '',
      visitorId: r.visitorId || '',
      source: r.source || '',
      meta: r.metaJson ? safeJSON(r.metaJson) : null,
      createdAt: new Date(r.createdAt).toISOString()
    }))
  }

  const items = readLeadsFile()
  const filtered = keyword
    ? items.filter((x) => {
        const a = `${x.nickName || ''} ${x.phone || ''} ${x.visitorId || ''} ${x.source || ''}`
        return a.includes(keyword)
      })
    : items
  return filtered.slice(skip, skip + take)
}

async function countLeads({ q }) {
  const keyword = String(q || '').trim()
  if (mode === 'mysql') {
    const where = keyword ? 'WHERE nick_name LIKE ? OR visitor_id LIKE ? OR source LIKE ? OR phone LIKE ?' : ''
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []
    const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM leads ${where}`, params)
    return Number(rows && rows[0] ? rows[0].c : 0)
  }
  const items = readLeadsFile()
  if (!keyword) return items.length
  return items.filter((x) => {
    const a = `${x.nickName || ''} ${x.phone || ''} ${x.visitorId || ''} ${x.source || ''}`
    return a.includes(keyword)
  }).length
}

function normalizeStatus(v) {
  const s = String(v || '').trim()
  return s === 'disabled' ? 'disabled' : 'enabled'
}

function asNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function asStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || '').trim()).filter(Boolean)
  return []
}

function sanitize(entity, input) {
  const src = input && typeof input === 'object' ? input : {}
  if (entity === 'products') {
    return {
      title: String(src.title || '').trim(),
      description: String(src.description || '').trim(),
      categoryId: String(src.categoryId || '').trim(),
      price: src.price === '' || src.price === null || typeof src.price === 'undefined' ? null : asNumber(src.price),
      status: normalizeStatus(src.status),
      coverUrl: String(src.coverUrl || '').trim(),
      images: asStringArray(src.images),
      skus: Array.isArray(src.skus) ? src.skus : []
    }
  }
  if (entity === 'cases') {
    return {
      title: String(src.title || '').trim(),
      summary: String(src.summary || '').trim(),
      content: String(src.content || '').trim(),
      status: normalizeStatus(src.status),
      coverUrl: String(src.coverUrl || '').trim(),
      images: asStringArray(src.images),
      tags: asStringArray(src.tags)
    }
  }
  if (entity === 'designs') {
    return {
      title: String(src.title || '').trim(),
      status: normalizeStatus(src.status),
      coverUrl: String(src.coverUrl || '').trim(),
      images: asStringArray(src.images)
    }
  }
  if (entity === 'posts') {
    return {
      title: String(src.title || '').trim(),
      content: String(src.content || '').trim(),
      status: normalizeStatus(src.status),
      images: asStringArray(src.images)
    }
  }
  if (entity === 'storeCards') {
    return {
      storeName: String(src.storeName || '').trim(),
      contactName: String(src.contactName || '').trim(),
      phone: String(src.phone || '').trim(),
      wechatId: String(src.wechatId || '').trim(),
      address: String(src.address || '').trim(),
      latitude: src.latitude === '' || src.latitude === null || typeof src.latitude === 'undefined' ? null : asNumber(src.latitude),
      longitude: src.longitude === '' || src.longitude === null || typeof src.longitude === 'undefined' ? null : asNumber(src.longitude),
      intro: String(src.intro || '').trim(),
      status: normalizeStatus(src.status)
    }
  }
  if (entity === 'categories') {
    return {
      name: String(src.name || '').trim(),
      icon: String(src.icon || '').trim(),
      sort: src.sort === '' || src.sort === null || typeof src.sort === 'undefined' ? null : asNumber(src.sort),
      status: normalizeStatus(src.status)
    }
  }
  return {}
}

function requiredOk(entity, value) {
  if (entity === 'products') return !!value.title
  if (entity === 'cases') return !!value.title
  if (entity === 'designs') return !!value.title
  if (entity === 'posts') return !!value.title
  if (entity === 'storeCards') return !!value.storeName
  if (entity === 'categories') return !!value.name
  return false
}

function readEntityFile(entity) {
  const fp = entityFiles[entity]
  if (!fp) return []
  try {
    const raw = fs.readFileSync(fp, 'utf8')
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch (_e) {
    return []
  }
}

function writeEntityFile(entity, items) {
  const fp = entityFiles[entity]
  if (!fp) return
  fs.writeFileSync(fp, JSON.stringify(items, null, 2))
}

function matchEntity(entity, item, keyword) {
  if (!keyword) return true
  const k = String(keyword).trim()
  if (!k) return true
  if (entity === 'products') return `${item.title || ''} ${item.description || ''} ${item.categoryId || ''}`.includes(k)
  if (entity === 'cases') return `${item.title || ''} ${item.summary || ''} ${item.content || ''}`.includes(k)
  if (entity === 'designs') return `${item.title || ''}`.includes(k)
  if (entity === 'posts') return `${item.title || ''} ${item.content || ''}`.includes(k)
  if (entity === 'storeCards') return `${item.storeName || ''} ${item.contactName || ''} ${item.phone || ''} ${item.address || ''}`.includes(k)
  if (entity === 'categories') return `${item.name || ''} ${item.icon || ''}`.includes(k)
  return false
}

function sortEntities(entity, items) {
  if (entity === 'categories') {
    return items
      .slice()
      .sort((a, b) => {
        const as = a.sort === null || typeof a.sort === 'undefined' ? 999999 : Number(a.sort)
        const bs = b.sort === null || typeof b.sort === 'undefined' ? 999999 : Number(b.sort)
        if (as !== bs) return as - bs
        return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
      })
  }
  return items.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}

async function listEntities(entity, { limit, offset, q }) {
  const take = Math.min(200, Math.max(1, Number(limit) || 50))
  const skip = Math.max(0, Number(offset) || 0)
  const keyword = String(q || '').trim()
  if (mode === 'mysql') {
    if (entity === 'products') {
      const where = keyword ? 'WHERE title LIKE ? OR description LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, take, skip] : [take, skip]
      const [rows] = await pool.query(
        `SELECT id, title, description, category_id AS categoryId, price, status, cover_url AS coverUrl, images_json AS imagesJson, skus_json AS skusJson, created_at AS createdAt, updated_at AS updatedAt FROM products ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        params
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        categoryId: r.categoryId || '',
        price: r.price === null ? null : Number(r.price),
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        skus: r.skusJson ? safeJSON(r.skusJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'cases') {
      const where = keyword ? 'WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, take, skip] : [take, skip]
      const [rows] = await pool.query(
        `SELECT id, title, summary, content, status, cover_url AS coverUrl, images_json AS imagesJson, tags_json AS tagsJson, created_at AS createdAt, updated_at AS updatedAt FROM cases ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        params
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary || '',
        content: r.content || '',
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        tags: r.tagsJson ? safeJSON(r.tagsJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'designs') {
      const where = keyword ? 'WHERE title LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, take, skip] : [take, skip]
      const [rows] = await pool.query(
        `SELECT id, title, status, cover_url AS coverUrl, images_json AS imagesJson, created_at AS createdAt, updated_at AS updatedAt FROM designs ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        params
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'posts') {
      const where = keyword ? 'WHERE title LIKE ? OR content LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, take, skip] : [take, skip]
      const [rows] = await pool.query(
        `SELECT id, title, content, status, images_json AS imagesJson, created_at AS createdAt, updated_at AS updatedAt FROM posts ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        params
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content || '',
        status: r.status,
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'storeCards') {
      const where = keyword ? 'WHERE store_name LIKE ? OR contact_name LIKE ? OR phone LIKE ? OR address LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, take, skip] : [take, skip]
      const [rows] = await pool.query(
        `SELECT id, store_name AS storeName, contact_name AS contactName, phone, wechat_id AS wechatId, address, latitude, longitude, intro, status, created_at AS createdAt, updated_at AS updatedAt FROM store_cards ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        params
      )
      return rows.map((r) => ({
        id: r.id,
        storeName: r.storeName,
        contactName: r.contactName || '',
        phone: r.phone || '',
        wechatId: r.wechatId || '',
        address: r.address || '',
        latitude: r.latitude === null ? null : Number(r.latitude),
        longitude: r.longitude === null ? null : Number(r.longitude),
        intro: r.intro || '',
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'categories') {
      const where = keyword ? 'WHERE name LIKE ? OR icon LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, take, skip] : [take, skip]
      const [rows] = await pool.query(
        `SELECT id, name, icon, sort_num AS sort, status, created_at AS createdAt, updated_at AS updatedAt FROM categories ${where} ORDER BY sort_num ASC, updated_at DESC LIMIT ? OFFSET ?`,
        params
      )
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || '',
        sort: r.sort === null ? null : Number(r.sort),
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    return []
  }
  const items = readEntityFile(entity)
  const filtered = keyword ? items.filter((x) => matchEntity(entity, x, keyword)) : items
  const sorted = sortEntities(entity, filtered)
  return sorted.slice(skip, skip + take)
}

async function countEntities(entity, { q }) {
  const keyword = String(q || '').trim()
  if (mode === 'mysql') {
    if (entity === 'products') {
      const where = keyword ? 'WHERE title LIKE ? OR description LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : []
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM products ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'cases') {
      const where = keyword ? 'WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM cases ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'designs') {
      const where = keyword ? 'WHERE title LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`] : []
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM designs ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'posts') {
      const where = keyword ? 'WHERE title LIKE ? OR content LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : []
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM posts ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'storeCards') {
      const where = keyword ? 'WHERE store_name LIKE ? OR contact_name LIKE ? OR phone LIKE ? OR address LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM store_cards ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'categories') {
      const where = keyword ? 'WHERE name LIKE ? OR icon LIKE ?' : ''
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : []
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM categories ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    return 0
  }
  const items = readEntityFile(entity)
  if (!keyword) return items.length
  return items.filter((x) => matchEntity(entity, x, keyword)).length
}

async function getEntity(entity, id) {
  const key = String(id || '').trim()
  if (!key) return null
  if (mode === 'mysql') {
    if (entity === 'products') {
      const [rows] = await pool.query(
        'SELECT id, title, description, category_id AS categoryId, price, status, cover_url AS coverUrl, images_json AS imagesJson, skus_json AS skusJson, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = ? LIMIT 1',
        [key]
      )
      const r = rows && rows[0] ? rows[0] : null
      if (!r) return null
      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        categoryId: r.categoryId || '',
        price: r.price === null ? null : Number(r.price),
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        skus: r.skusJson ? safeJSON(r.skusJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }
    }
    if (entity === 'cases') {
      const [rows] = await pool.query(
        'SELECT id, title, summary, content, status, cover_url AS coverUrl, images_json AS imagesJson, tags_json AS tagsJson, created_at AS createdAt, updated_at AS updatedAt FROM cases WHERE id = ? LIMIT 1',
        [key]
      )
      const r = rows && rows[0] ? rows[0] : null
      if (!r) return null
      return {
        id: r.id,
        title: r.title,
        summary: r.summary || '',
        content: r.content || '',
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        tags: r.tagsJson ? safeJSON(r.tagsJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }
    }
    if (entity === 'designs') {
      const [rows] = await pool.query(
        'SELECT id, title, status, cover_url AS coverUrl, images_json AS imagesJson, created_at AS createdAt, updated_at AS updatedAt FROM designs WHERE id = ? LIMIT 1',
        [key]
      )
      const r = rows && rows[0] ? rows[0] : null
      if (!r) return null
      return {
        id: r.id,
        title: r.title,
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }
    }
    if (entity === 'posts') {
      const [rows] = await pool.query(
        'SELECT id, title, content, status, images_json AS imagesJson, created_at AS createdAt, updated_at AS updatedAt FROM posts WHERE id = ? LIMIT 1',
        [key]
      )
      const r = rows && rows[0] ? rows[0] : null
      if (!r) return null
      return {
        id: r.id,
        title: r.title,
        content: r.content || '',
        status: r.status,
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }
    }
    if (entity === 'storeCards') {
      const [rows] = await pool.query(
        'SELECT id, store_name AS storeName, contact_name AS contactName, phone, wechat_id AS wechatId, address, latitude, longitude, intro, status, created_at AS createdAt, updated_at AS updatedAt FROM store_cards WHERE id = ? LIMIT 1',
        [key]
      )
      const r = rows && rows[0] ? rows[0] : null
      if (!r) return null
      return {
        id: r.id,
        storeName: r.storeName,
        contactName: r.contactName || '',
        phone: r.phone || '',
        wechatId: r.wechatId || '',
        address: r.address || '',
        latitude: r.latitude === null ? null : Number(r.latitude),
        longitude: r.longitude === null ? null : Number(r.longitude),
        intro: r.intro || '',
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }
    }
    if (entity === 'categories') {
      const [rows] = await pool.query(
        'SELECT id, name, icon, sort_num AS sort, status, created_at AS createdAt, updated_at AS updatedAt FROM categories WHERE id = ? LIMIT 1',
        [key]
      )
      const r = rows && rows[0] ? rows[0] : null
      if (!r) return null
      return {
        id: r.id,
        name: r.name,
        icon: r.icon || '',
        sort: r.sort === null ? null : Number(r.sort),
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }
    }
    return null
  }
  const items = readEntityFile(entity)
  return items.find((x) => x.id === key) || null
}

async function createEntity(entity, input) {
  const value = sanitize(entity, input)
  if (!requiredOk(entity, value)) {
    throw new Error('invalid payload')
  }
  const createdAt = nowISO()
  const item = { id: newId(), ...value, createdAt, updatedAt: createdAt }
  if (mode === 'mysql') {
    if (entity === 'products') {
      await pool.query(
        'INSERT INTO products (id, title, description, category_id, price, status, cover_url, images_json, skus_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.title,
          item.description || null,
          item.categoryId || null,
          item.price === null ? null : item.price,
          item.status,
          item.coverUrl || null,
          item.images && item.images.length ? JSON.stringify(item.images) : null,
          item.skus && item.skus.length ? JSON.stringify(item.skus) : null,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        ]
      )
      return item
    }
    if (entity === 'cases') {
      await pool.query(
        'INSERT INTO cases (id, title, summary, content, status, cover_url, images_json, tags_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.title,
          item.summary || null,
          item.content || null,
          item.status,
          item.coverUrl || null,
          item.images && item.images.length ? JSON.stringify(item.images) : null,
          item.tags && item.tags.length ? JSON.stringify(item.tags) : null,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        ]
      )
      return item
    }
    if (entity === 'designs') {
      await pool.query(
        'INSERT INTO designs (id, title, status, cover_url, images_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.title,
          item.status,
          item.coverUrl || null,
          item.images && item.images.length ? JSON.stringify(item.images) : null,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        ]
      )
      return item
    }
    if (entity === 'posts') {
      await pool.query(
        'INSERT INTO posts (id, title, content, status, images_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.title,
          item.content || null,
          item.status,
          item.images && item.images.length ? JSON.stringify(item.images) : null,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        ]
      )
      return item
    }
    if (entity === 'storeCards') {
      await pool.query(
        'INSERT INTO store_cards (id, store_name, contact_name, phone, wechat_id, address, latitude, longitude, intro, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.storeName,
          item.contactName || null,
          item.phone || null,
          item.wechatId || null,
          item.address || null,
          item.latitude === null ? null : item.latitude,
          item.longitude === null ? null : item.longitude,
          item.intro || null,
          item.status,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        ]
      )
      return item
    }
    if (entity === 'categories') {
      await pool.query(
        'INSERT INTO categories (id, name, icon, sort_num, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.name,
          item.icon || null,
          item.sort === null ? null : Math.trunc(Number(item.sort)),
          item.status,
          new Date(item.createdAt),
          new Date(item.updatedAt)
        ]
      )
      return item
    }
    return item
  }
  const items = readEntityFile(entity)
  items.unshift(item)
  writeEntityFile(entity, items)
  return item
}

async function updateEntity(entity, id, input) {
  const key = String(id || '').trim()
  if (!key) throw new Error('missing id')
  const value = sanitize(entity, input)
  if (!requiredOk(entity, value)) throw new Error('invalid payload')
  const updatedAt = nowISO()
  if (mode === 'mysql') {
    if (entity === 'products') {
      await pool.query(
        'UPDATE products SET title=?, description=?, category_id=?, price=?, status=?, cover_url=?, images_json=?, skus_json=?, updated_at=? WHERE id=?',
        [
          value.title,
          value.description || null,
          value.categoryId || null,
          value.price === null ? null : value.price,
          value.status,
          value.coverUrl || null,
          value.images && value.images.length ? JSON.stringify(value.images) : null,
          value.skus && value.skus.length ? JSON.stringify(value.skus) : null,
          new Date(updatedAt),
          key
        ]
      )
      const item = await getEntity(entity, key)
      if (!item) throw new Error('not found')
      return item
    }
    if (entity === 'cases') {
      await pool.query(
        'UPDATE cases SET title=?, summary=?, content=?, status=?, cover_url=?, images_json=?, tags_json=?, updated_at=? WHERE id=?',
        [
          value.title,
          value.summary || null,
          value.content || null,
          value.status,
          value.coverUrl || null,
          value.images && value.images.length ? JSON.stringify(value.images) : null,
          value.tags && value.tags.length ? JSON.stringify(value.tags) : null,
          new Date(updatedAt),
          key
        ]
      )
      const item = await getEntity(entity, key)
      if (!item) throw new Error('not found')
      return item
    }
    if (entity === 'designs') {
      await pool.query(
        'UPDATE designs SET title=?, status=?, cover_url=?, images_json=?, updated_at=? WHERE id=?',
        [
          value.title,
          value.status,
          value.coverUrl || null,
          value.images && value.images.length ? JSON.stringify(value.images) : null,
          new Date(updatedAt),
          key
        ]
      )
      const item = await getEntity(entity, key)
      if (!item) throw new Error('not found')
      return item
    }
    if (entity === 'posts') {
      await pool.query(
        'UPDATE posts SET title=?, content=?, status=?, images_json=?, updated_at=? WHERE id=?',
        [
          value.title,
          value.content || null,
          value.status,
          value.images && value.images.length ? JSON.stringify(value.images) : null,
          new Date(updatedAt),
          key
        ]
      )
      const item = await getEntity(entity, key)
      if (!item) throw new Error('not found')
      return item
    }
    if (entity === 'storeCards') {
      await pool.query(
        'UPDATE store_cards SET store_name=?, contact_name=?, phone=?, wechat_id=?, address=?, latitude=?, longitude=?, intro=?, status=?, updated_at=? WHERE id=?',
        [
          value.storeName,
          value.contactName || null,
          value.phone || null,
          value.wechatId || null,
          value.address || null,
          value.latitude === null ? null : value.latitude,
          value.longitude === null ? null : value.longitude,
          value.intro || null,
          value.status,
          new Date(updatedAt),
          key
        ]
      )
      const item = await getEntity(entity, key)
      if (!item) throw new Error('not found')
      return item
    }
    if (entity === 'categories') {
      await pool.query(
        'UPDATE categories SET name=?, icon=?, sort_num=?, status=?, updated_at=? WHERE id=?',
        [
          value.name,
          value.icon || null,
          value.sort === null ? null : Math.trunc(Number(value.sort)),
          value.status,
          new Date(updatedAt),
          key
        ]
      )
      const item = await getEntity(entity, key)
      if (!item) throw new Error('not found')
      return item
    }
  }
  const items = readEntityFile(entity)
  const idx = items.findIndex((x) => x.id === key)
  if (idx < 0) throw new Error('not found')
  const next = { ...items[idx], ...value, updatedAt }
  items[idx] = next
  writeEntityFile(entity, items)
  return next
}

async function deleteEntity(entity, id) {
  const key = String(id || '').trim()
  if (!key) throw new Error('missing id')
  if (mode === 'mysql') {
    const table = entity === 'storeCards' ? 'store_cards' : entity
    const [r] = await pool.query(`DELETE FROM ${table} WHERE id=?`, [key])
    return r && typeof r.affectedRows === 'number' ? r.affectedRows > 0 : true
  }
  const items = readEntityFile(entity)
  const next = items.filter((x) => x.id !== key)
  const ok = next.length !== items.length
  writeEntityFile(entity, next)
  return ok
}

function sanitizeSettings(input) {
  const src = input && typeof input === 'object' ? input : {}
  const updatedAt = nowISO()
  const banners = Array.isArray(src.homeBanners) ? src.homeBanners : []
  const homeBanners = banners
    .map((b) => ({
      imageUrl: String(b && b.imageUrl ? b.imageUrl : '').trim(),
      path: String(b && b.path ? b.path : '').trim()
    }))
    .filter((b) => !!b.imageUrl)
  return {
    id: 'default',
    shopName: String(src.shopName || '').trim(),
    phone: String(src.phone || '').trim(),
    wechatId: String(src.wechatId || '').trim(),
    address: String(src.address || '').trim(),
    latitude: src.latitude === '' || src.latitude === null || typeof src.latitude === 'undefined' ? null : asNumber(src.latitude),
    longitude: src.longitude === '' || src.longitude === null || typeof src.longitude === 'undefined' ? null : asNumber(src.longitude),
    homeBanners,
    homeNavTitle: String(src.homeNavTitle || '').trim(),
    homeSearchPlaceholder: String(src.homeSearchPlaceholder || '').trim(),
    homeCaseTitle: String(src.homeCaseTitle || '').trim(),
    homeCaseSubTitle: String(src.homeCaseSubTitle || '').trim(),
    homeDesignTitle: String(src.homeDesignTitle || '').trim(),
    homeDesignSubTitle: String(src.homeDesignSubTitle || '').trim(),
    homeProductsTitle: String(src.homeProductsTitle || '').trim(),
    updatedAt
  }
}

async function getSettings() {
  if (mode === 'mysql') {
    const [rows] = await pool.query(
      'SELECT id, shop_name AS shopName, phone, wechat_id AS wechatId, address, latitude, longitude, banners_json AS bannersJson, home_nav_title AS homeNavTitle, home_search_placeholder AS homeSearchPlaceholder, home_case_title AS homeCaseTitle, home_case_sub_title AS homeCaseSubTitle, home_design_title AS homeDesignTitle, home_design_sub_title AS homeDesignSubTitle, home_products_title AS homeProductsTitle, updated_at AS updatedAt FROM app_settings WHERE id = ? LIMIT 1',
      ['default']
    )
    const r = rows && rows[0] ? rows[0] : null
    if (!r) {
      const v = defaultSettings()
      await pool.query(
        'INSERT INTO app_settings (id, shop_name, phone, wechat_id, address, latitude, longitude, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [v.id, v.shopName || null, v.phone || null, v.wechatId || null, v.address || null, v.latitude, v.longitude, new Date(v.updatedAt)]
      )
      return v
    }
    return {
      id: r.id,
      shopName: r.shopName || '',
      phone: r.phone || '',
      wechatId: r.wechatId || '',
      address: r.address || '',
      latitude: r.latitude === null ? null : Number(r.latitude),
      longitude: r.longitude === null ? null : Number(r.longitude),
      homeBanners: r.bannersJson ? safeJSON(r.bannersJson) || [] : [],
      homeNavTitle: r.homeNavTitle || '',
      homeSearchPlaceholder: r.homeSearchPlaceholder || '请输入您想要搜索的产品',
      homeCaseTitle: r.homeCaseTitle || '金华地区 | 上千家落地案例',
      homeCaseSubTitle: r.homeCaseSubTitle || '落地案例实拍 · 点击查看详情',
      homeDesignTitle: r.homeDesignTitle || '设计效果图',
      homeDesignSubTitle: r.homeDesignSubTitle || '效果图案例 · 点击查看详情',
      homeProductsTitle: r.homeProductsTitle || '推荐商品',
      updatedAt: new Date(r.updatedAt).toISOString()
    }
  }

  try {
    const raw = fs.readFileSync(settingsFile, 'utf8')
    const v = JSON.parse(raw)
    const d = defaultSettings()
    return {
      id: 'default',
      shopName: v && typeof v.shopName === 'string' ? v.shopName : d.shopName,
      phone: v && typeof v.phone === 'string' ? v.phone : d.phone,
      wechatId: v && typeof v.wechatId === 'string' ? v.wechatId : d.wechatId,
      address: v && typeof v.address === 'string' ? v.address : d.address,
      latitude: v && typeof v.latitude === 'number' ? v.latitude : null,
      longitude: v && typeof v.longitude === 'number' ? v.longitude : null,
      homeBanners: v && Array.isArray(v.homeBanners) ? v.homeBanners : d.homeBanners,
      homeNavTitle: v && typeof v.homeNavTitle === 'string' ? v.homeNavTitle : d.homeNavTitle,
      homeSearchPlaceholder: v && typeof v.homeSearchPlaceholder === 'string' ? v.homeSearchPlaceholder : d.homeSearchPlaceholder,
      homeCaseTitle: v && typeof v.homeCaseTitle === 'string' ? v.homeCaseTitle : d.homeCaseTitle,
      homeCaseSubTitle: v && typeof v.homeCaseSubTitle === 'string' ? v.homeCaseSubTitle : d.homeCaseSubTitle,
      homeDesignTitle: v && typeof v.homeDesignTitle === 'string' ? v.homeDesignTitle : d.homeDesignTitle,
      homeDesignSubTitle: v && typeof v.homeDesignSubTitle === 'string' ? v.homeDesignSubTitle : d.homeDesignSubTitle,
      homeProductsTitle: v && typeof v.homeProductsTitle === 'string' ? v.homeProductsTitle : d.homeProductsTitle,
      updatedAt: v && typeof v.updatedAt === 'string' ? v.updatedAt : d.updatedAt
    }
  } catch (_e) {
    return defaultSettings()
  }
}

async function updateSettings(input) {
  const v = sanitizeSettings(input)
  if (mode === 'mysql') {
    const [rows] = await pool.query('SELECT id FROM app_settings WHERE id = ? LIMIT 1', ['default'])
    const exists = !!(rows && rows[0])
    const bannersJson = v.homeBanners && v.homeBanners.length ? JSON.stringify(v.homeBanners) : null
    if (exists) {
      await pool.query(
        'UPDATE app_settings SET shop_name=?, phone=?, wechat_id=?, address=?, latitude=?, longitude=?, banners_json=?, home_nav_title=?, home_search_placeholder=?, home_case_title=?, home_case_sub_title=?, home_design_title=?, home_design_sub_title=?, home_products_title=?, updated_at=? WHERE id=?',
        [
          v.shopName || null,
          v.phone || null,
          v.wechatId || null,
          v.address || null,
          v.latitude,
          v.longitude,
          bannersJson,
          v.homeNavTitle || null,
          v.homeSearchPlaceholder || null,
          v.homeCaseTitle || null,
          v.homeCaseSubTitle || null,
          v.homeDesignTitle || null,
          v.homeDesignSubTitle || null,
          v.homeProductsTitle || null,
          new Date(v.updatedAt),
          'default'
        ]
      )
    } else {
      await pool.query(
        'INSERT INTO app_settings (id, shop_name, phone, wechat_id, address, latitude, longitude, banners_json, home_nav_title, home_search_placeholder, home_case_title, home_case_sub_title, home_design_title, home_design_sub_title, home_products_title, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          'default',
          v.shopName || null,
          v.phone || null,
          v.wechatId || null,
          v.address || null,
          v.latitude,
          v.longitude,
          bannersJson,
          v.homeNavTitle || null,
          v.homeSearchPlaceholder || null,
          v.homeCaseTitle || null,
          v.homeCaseSubTitle || null,
          v.homeDesignTitle || null,
          v.homeDesignSubTitle || null,
          v.homeProductsTitle || null,
          new Date(v.updatedAt)
        ]
      )
    }
    return v
  }

  fs.writeFileSync(settingsFile, JSON.stringify(v, null, 2))
  return v
}

async function listPublicCategories() {
  const items = await listEntities('categories', { limit: 200, offset: 0, q: '' })
  return items.filter((x) => x.status !== 'disabled')
}

async function listPublicEntities(entity, { limit, offset, q, categoryId, tag }) {
  const take = Math.min(200, Math.max(1, Number(limit) || 50))
  const skip = Math.max(0, Number(offset) || 0)
  const keyword = String(q || '').trim()
  const cat = String(categoryId || '').trim()
  const t = String(tag || '').trim()

  if (mode === 'mysql') {
    if (entity === 'products') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ? OR description LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`)
      }
      if (cat) {
        wheres.push('category_id = ?')
        params.push(cat)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(
        `SELECT id, title, description, category_id AS categoryId, price, status, cover_url AS coverUrl, images_json AS imagesJson, skus_json AS skusJson, created_at AS createdAt, updated_at AS updatedAt FROM products ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, take, skip]
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        categoryId: r.categoryId || '',
        price: r.price === null ? null : Number(r.price),
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        skus: r.skusJson ? safeJSON(r.skusJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'cases') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ? OR summary LIKE ? OR content LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }
      if (t) {
        wheres.push('tags_json LIKE ?')
        params.push(`%${t}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(
        `SELECT id, title, summary, content, status, cover_url AS coverUrl, images_json AS imagesJson, tags_json AS tagsJson, created_at AS createdAt, updated_at AS updatedAt FROM cases ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, take, skip]
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary || '',
        content: r.content || '',
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        tags: r.tagsJson ? safeJSON(r.tagsJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'designs') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ?)')
        params.push(`%${keyword}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(
        `SELECT id, title, status, cover_url AS coverUrl, images_json AS imagesJson, created_at AS createdAt, updated_at AS updatedAt FROM designs ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, take, skip]
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        coverUrl: r.coverUrl || '',
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'posts') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ? OR content LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(
        `SELECT id, title, content, status, images_json AS imagesJson, created_at AS createdAt, updated_at AS updatedAt FROM posts ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, take, skip]
      )
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content || '',
        status: r.status,
        images: r.imagesJson ? safeJSON(r.imagesJson) || [] : [],
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    if (entity === 'storeCards') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(store_name LIKE ? OR contact_name LIKE ? OR phone LIKE ? OR address LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(
        `SELECT id, store_name AS storeName, contact_name AS contactName, phone, wechat_id AS wechatId, address, latitude, longitude, intro, status, created_at AS createdAt, updated_at AS updatedAt FROM store_cards ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, take, skip]
      )
      return rows.map((r) => ({
        id: r.id,
        storeName: r.storeName,
        contactName: r.contactName || '',
        phone: r.phone || '',
        wechatId: r.wechatId || '',
        address: r.address || '',
        latitude: r.latitude === null ? null : Number(r.latitude),
        longitude: r.longitude === null ? null : Number(r.longitude),
        intro: r.intro || '',
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      }))
    }
    return []
  }

  const items = await listEntities(entity, { limit: 1000, offset: 0, q: keyword })
  const enabled = items.filter((x) => x.status !== 'disabled')
  const filtered =
    entity === 'products' && cat
      ? enabled.filter((x) => String(x.categoryId || '') === cat)
      : entity === 'cases' && t
        ? enabled.filter((x) => Array.isArray(x.tags) && x.tags.includes(t))
        : enabled
  return filtered.slice(skip, skip + take)
}

async function countPublicEntities(entity, { q, categoryId, tag }) {
  const keyword = String(q || '').trim()
  const cat = String(categoryId || '').trim()
  const t = String(tag || '').trim()
  if (mode === 'mysql') {
    if (entity === 'products') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ? OR description LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`)
      }
      if (cat) {
        wheres.push('category_id = ?')
        params.push(cat)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM products ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'cases') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ? OR summary LIKE ? OR content LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }
      if (t) {
        wheres.push('tags_json LIKE ?')
        params.push(`%${t}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM cases ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'designs') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ?)')
        params.push(`%${keyword}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM designs ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'posts') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(title LIKE ? OR content LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM posts ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    if (entity === 'storeCards') {
      const wheres = ["status <> 'disabled'"]
      const params = []
      if (keyword) {
        wheres.push('(store_name LIKE ? OR contact_name LIKE ? OR phone LIKE ? OR address LIKE ?)')
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }
      const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : ''
      const [rows] = await pool.query(`SELECT COUNT(1) AS c FROM store_cards ${where}`, params)
      return Number(rows && rows[0] ? rows[0].c : 0)
    }
    return 0
  }
  const items = await listPublicEntities(entity, { limit: 1000, offset: 0, q: keyword, categoryId: cat, tag: t })
  return items.length
}

async function getPublicEntity(entity, id) {
  const item = await getEntity(entity, id)
  if (!item) return null
  if (String(item.status || '') === 'disabled') return null
  return item
}

async function listPublicCaseTags() {
  const items = await listPublicEntities('cases', { limit: 500, offset: 0, q: '' })
  const set = new Set()
  for (const it of items) {
    const tags = Array.isArray(it.tags) ? it.tags : []
    for (const x of tags) {
      const s = String(x || '').trim()
      if (s) set.add(s)
    }
  }
  return Array.from(set).slice(0, 200)
}

function safeJSON(s) {
  try {
    return JSON.parse(s)
  } catch (_e) {
    return null
  }
}

function readLeadsFile() {
  try {
    const raw = fs.readFileSync(leadsFile, 'utf8')
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch (_e) {
    return []
  }
}

function writeLeadsFile(items) {
  fs.writeFileSync(leadsFile, JSON.stringify(items, null, 2))
}

function readUsersFile() {
  try {
    const raw = fs.readFileSync(usersFile, 'utf8')
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch (_e) {
    return []
  }
}

function writeUsersFile(items) {
  fs.writeFileSync(usersFile, JSON.stringify(items, null, 2))
}

function readPostLikesFile() {
  try {
    const raw = fs.readFileSync(postLikesFile, 'utf8')
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch (_e) {
    return []
  }
}

function writePostLikesFile(items) {
  fs.writeFileSync(postLikesFile, JSON.stringify(items, null, 2))
}

function readPostCommentsFile() {
  try {
    const raw = fs.readFileSync(postCommentsFile, 'utf8')
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch (_e) {
    return []
  }
}

function writePostCommentsFile(items) {
  fs.writeFileSync(postCommentsFile, JSON.stringify(items, null, 2))
}

async function upsertUserProfile({ openid, nickName, avatarUrl, phone }) {
  const id = String(openid || '').trim()
  const name = String(nickName || '').trim()
  const ava = String(avatarUrl || '').trim()
  const p = String(phone || '').trim()
  if (!id) throw new Error('missing openid')
  if (!name || !ava) throw new Error('nickName/avatarUrl required')
  const now = nowISO()

  if (mode === 'mysql') {
    await pool.query(
      `
        INSERT INTO users (openid, nick_name, avatar_url, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nick_name=VALUES(nick_name), avatar_url=VALUES(avatar_url), phone=VALUES(phone), updated_at=VALUES(updated_at)
      `,
      [id, name, ava, p || null, new Date(now), new Date(now)]
    )
    const [rows] = await pool.query(
      'SELECT openid, nick_name AS nickName, avatar_url AS avatarUrl, phone, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE openid=? LIMIT 1',
      [id]
    )
    const r = rows && rows[0] ? rows[0] : null
    return r
      ? {
          openid: r.openid,
          nickName: r.nickName,
          avatarUrl: r.avatarUrl,
          phone: r.phone || '',
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString()
        }
      : { openid: id, nickName: name, avatarUrl: ava, phone: p, createdAt: now, updatedAt: now }
  }

  const items = readUsersFile()
  const idx = items.findIndex((x) => x && x.openid === id)
  if (idx >= 0) {
    const prev = items[idx]
    items[idx] = { ...prev, openid: id, nickName: name, avatarUrl: ava, phone: p || prev.phone || '', updatedAt: now }
  } else {
    items.unshift({ openid: id, nickName: name, avatarUrl: ava, phone: p, createdAt: now, updatedAt: now })
  }
  writeUsersFile(items)
  return items.find((x) => x && x.openid === id) || { openid: id, nickName: name, avatarUrl: ava, phone: p, createdAt: now, updatedAt: now }
}

async function countUsers() {
  if (mode === 'mysql') {
    const [rows] = await pool.query('SELECT COUNT(1) AS c FROM users')
    return Number(rows && rows[0] ? rows[0].c : 0)
  }
  return readUsersFile().length
}

async function togglePostLike({ postId, actorId }) {
  const pid = String(postId || '').trim()
  const aid = String(actorId || '').trim()
  if (!pid) throw new Error('missing postId')
  if (!aid) throw new Error('missing actorId')
  const now = nowISO()

  if (mode === 'mysql') {
    const [rows] = await pool.query('SELECT 1 AS ok FROM post_likes WHERE post_id=? AND actor_id=? LIMIT 1', [pid, aid])
    const exists = !!(rows && rows[0])
    if (exists) await pool.query('DELETE FROM post_likes WHERE post_id=? AND actor_id=?', [pid, aid])
    else await pool.query('INSERT INTO post_likes (post_id, actor_id, created_at) VALUES (?, ?, ?)', [pid, aid, new Date(now)])
    const [crows] = await pool.query('SELECT COUNT(1) AS c FROM post_likes WHERE post_id=?', [pid])
    const c = Number(crows && crows[0] ? crows[0].c : 0)
    return { liked: !exists, likes: c }
  }

  const items = readPostLikesFile()
  const idx = items.findIndex((x) => x && x.postId === pid && x.actorId === aid)
  const exists = idx >= 0
  const next = exists ? items.filter((_, i) => i !== idx) : [{ postId: pid, actorId: aid, createdAt: now }, ...items]
  writePostLikesFile(next)
  const likes = next.filter((x) => x && x.postId === pid).length
  return { liked: !exists, likes }
}

async function addPostComment({ postId, actorId, nickName, avatarUrl, content }) {
  const pid = String(postId || '').trim()
  const aid = String(actorId || '').trim()
  const name = String(nickName || '').trim()
  const ava = String(avatarUrl || '').trim()
  const text = String(content || '').trim()
  if (!pid) throw new Error('missing postId')
  if (!aid) throw new Error('missing actorId')
  if (!name || !ava) throw new Error('nickName/avatarUrl required')
  if (!text) throw new Error('content required')
  const now = nowISO()
  const id = newId()

  if (mode === 'mysql') {
    await pool.query(
      'INSERT INTO post_comments (id, post_id, actor_id, nick_name, avatar_url, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, pid, aid, name, ava, text, new Date(now)]
    )
    return { id, postId: pid, nickName: name, avatarUrl: ava, content: text, createdAt: now }
  }

  const items = readPostCommentsFile()
  items.unshift({ id, postId: pid, actorId: aid, nickName: name, avatarUrl: ava, content: text, createdAt: now })
  writePostCommentsFile(items)
  return { id, postId: pid, nickName: name, avatarUrl: ava, content: text, createdAt: now }
}

async function listPostComments(postId, limit = 20) {
  const pid = String(postId || '').trim()
  const take = Math.max(1, Math.min(50, Number(limit) || 20))
  if (!pid) return []
  if (mode === 'mysql') {
    const [rows] = await pool.query(
      'SELECT id, post_id AS postId, nick_name AS nickName, avatar_url AS avatarUrl, content, created_at AS createdAt FROM post_comments WHERE post_id=? ORDER BY created_at DESC LIMIT ?',
      [pid, take]
    )
    return (rows || []).map((r) => ({
      id: r.id,
      postId: r.postId,
      nickName: r.nickName,
      avatarUrl: r.avatarUrl,
      content: r.content || '',
      createdAt: new Date(r.createdAt).toISOString()
    }))
  }
  const all = readPostCommentsFile().filter((x) => x && x.postId === pid)
  all.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  return all.slice(0, take).map((x) => ({ id: x.id, postId: x.postId, nickName: x.nickName, avatarUrl: x.avatarUrl, content: x.content, createdAt: x.createdAt }))
}

async function getPostsEngagement(postIds) {
  const ids = Array.isArray(postIds) ? postIds.map((x) => String(x || '').trim()).filter(Boolean) : []
  const uniq = Array.from(new Set(ids)).slice(0, 200)
  const likesCount = {}
  const commentsCount = {}
  const latestComments = {}
  if (!uniq.length) return { likesCount, commentsCount, latestComments }

  if (mode === 'mysql') {
    const inPlaceholders = uniq.map(() => '?').join(',')
    const [lrows] = await pool.query(`SELECT post_id AS postId, COUNT(1) AS c FROM post_likes WHERE post_id IN (${inPlaceholders}) GROUP BY post_id`, uniq)
    ;(lrows || []).forEach((r) => {
      likesCount[String(r.postId)] = Number(r.c) || 0
    })
    const [crows] = await pool.query(`SELECT post_id AS postId, COUNT(1) AS c FROM post_comments WHERE post_id IN (${inPlaceholders}) GROUP BY post_id`, uniq)
    ;(crows || []).forEach((r) => {
      commentsCount[String(r.postId)] = Number(r.c) || 0
    })
    const [rows] = await pool.query(
      `SELECT id, post_id AS postId, nick_name AS nickName, avatar_url AS avatarUrl, content, created_at AS createdAt FROM post_comments WHERE post_id IN (${inPlaceholders}) ORDER BY created_at DESC LIMIT 200`,
      uniq
    )
    ;(rows || []).forEach((r) => {
      const pid = String(r.postId)
      if (!latestComments[pid]) latestComments[pid] = []
      if (latestComments[pid].length >= 3) return
      latestComments[pid].push({
        id: r.id,
        postId: pid,
        nickName: r.nickName,
        avatarUrl: r.avatarUrl,
        content: r.content || '',
        createdAt: new Date(r.createdAt).toISOString()
      })
    })
    return { likesCount, commentsCount, latestComments }
  }

  const likes = readPostLikesFile()
  const comments = readPostCommentsFile()
  for (const pid of uniq) {
    likesCount[pid] = likes.filter((x) => x && x.postId === pid).length
    const cs = comments.filter((x) => x && x.postId === pid)
    commentsCount[pid] = cs.length
    cs.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    latestComments[pid] = cs.slice(0, 3).map((x) => ({ id: x.id, postId: x.postId, nickName: x.nickName, avatarUrl: x.avatarUrl, content: x.content, createdAt: x.createdAt }))
  }
  return { likesCount, commentsCount, latestComments }
}

module.exports = {
  initStore,
  createLead,
  listLeads,
  countLeads,
  upsertUserProfile,
  countUsers,
  togglePostLike,
  addPostComment,
  listPostComments,
  getPostsEngagement,
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
  getStoreMode: () => mode
}
