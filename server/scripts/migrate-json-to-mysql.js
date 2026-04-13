require('dotenv').config()

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

function mustEnv(name) {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function readJsonFile(fp, fallback) {
  try {
    const raw = fs.readFileSync(fp, 'utf8')
    return JSON.parse(raw)
  } catch (_e) {
    return fallback
  }
}

function asDate(v) {
  const s = String(v || '').trim()
  if (!s) return new Date()
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

async function tryAddColumn(pool, sql) {
  try {
    await pool.query(sql)
  } catch (_e) {}
}

async function ensureSchema(pool) {
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(64) PRIMARY KEY,
        nick_name VARCHAR(128) NOT NULL,
        avatar_url VARCHAR(512) NOT NULL,
        visitor_id VARCHAR(128) NULL,
        source VARCHAR(128) NULL,
        meta_json TEXT NULL,
        created_at DATETIME NOT NULL
      )
    `
  )

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
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

  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_nav_title VARCHAR(255) NULL')
  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_search_placeholder VARCHAR(255) NULL')
  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_case_title VARCHAR(255) NULL')
  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_case_sub_title VARCHAR(255) NULL')
  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_design_title VARCHAR(255) NULL')
  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_design_sub_title VARCHAR(255) NULL')
  await tryAddColumn(pool, 'ALTER TABLE app_settings ADD COLUMN home_products_title VARCHAR(255) NULL')
}

async function upsertLead(pool, x) {
  const metaJson = x.meta ? JSON.stringify(x.meta) : null
  await pool.query(
    `
      INSERT INTO leads (id, nick_name, avatar_url, visitor_id, source, meta_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nick_name=VALUES(nick_name),
        avatar_url=VALUES(avatar_url),
        visitor_id=VALUES(visitor_id),
        source=VALUES(source),
        meta_json=VALUES(meta_json),
        created_at=VALUES(created_at)
    `,
    [
      String(x.id || ''),
      String(x.nickName || ''),
      String(x.avatarUrl || ''),
      x.visitorId ? String(x.visitorId) : null,
      x.source ? String(x.source) : null,
      metaJson,
      asDate(x.createdAt)
    ]
  )
}

async function upsertProduct(pool, x) {
  await pool.query(
    `
      INSERT INTO products (id, title, description, price, status, cover_url, images_json, skus_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        description=VALUES(description),
        price=VALUES(price),
        status=VALUES(status),
        cover_url=VALUES(cover_url),
        images_json=VALUES(images_json),
        skus_json=VALUES(skus_json),
        updated_at=VALUES(updated_at)
    `,
    [
      String(x.id || ''),
      String(x.title || ''),
      x.description ? String(x.description) : null,
      typeof x.price === 'number' ? x.price : x.price === null ? null : x.price === '' ? null : Number(x.price),
      String(x.status || 'enabled'),
      x.coverUrl ? String(x.coverUrl) : x.cover ? String(x.cover) : null,
      JSON.stringify(Array.isArray(x.images) ? x.images : []),
      JSON.stringify(Array.isArray(x.skus) ? x.skus : []),
      asDate(x.createdAt),
      asDate(x.updatedAt)
    ]
  )
}

async function upsertCase(pool, x) {
  await pool.query(
    `
      INSERT INTO cases (id, title, summary, content, status, cover_url, images_json, tags_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        summary=VALUES(summary),
        content=VALUES(content),
        status=VALUES(status),
        cover_url=VALUES(cover_url),
        images_json=VALUES(images_json),
        tags_json=VALUES(tags_json),
        updated_at=VALUES(updated_at)
    `,
    [
      String(x.id || ''),
      String(x.title || ''),
      x.summary ? String(x.summary) : null,
      x.content ? String(x.content) : null,
      String(x.status || 'enabled'),
      x.coverUrl ? String(x.coverUrl) : x.cover ? String(x.cover) : null,
      JSON.stringify(Array.isArray(x.images) ? x.images : []),
      JSON.stringify(Array.isArray(x.tags) ? x.tags : []),
      asDate(x.createdAt),
      asDate(x.updatedAt)
    ]
  )
}

async function upsertPost(pool, x) {
  await pool.query(
    `
      INSERT INTO posts (id, title, content, status, images_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=VALUES(title),
        content=VALUES(content),
        status=VALUES(status),
        images_json=VALUES(images_json),
        updated_at=VALUES(updated_at)
    `,
    [
      String(x.id || ''),
      String(x.title || ''),
      x.content ? String(x.content) : null,
      String(x.status || 'enabled'),
      JSON.stringify(Array.isArray(x.images) ? x.images : []),
      asDate(x.createdAt),
      asDate(x.updatedAt)
    ]
  )
}

async function upsertStoreCard(pool, x) {
  await pool.query(
    `
      INSERT INTO store_cards (id, store_name, contact_name, phone, wechat_id, address, latitude, longitude, intro, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        store_name=VALUES(store_name),
        contact_name=VALUES(contact_name),
        phone=VALUES(phone),
        wechat_id=VALUES(wechat_id),
        address=VALUES(address),
        latitude=VALUES(latitude),
        longitude=VALUES(longitude),
        intro=VALUES(intro),
        status=VALUES(status),
        updated_at=VALUES(updated_at)
    `,
    [
      String(x.id || ''),
      String(x.storeName || ''),
      x.contactName ? String(x.contactName) : null,
      x.phone ? String(x.phone) : null,
      x.wechatId ? String(x.wechatId) : null,
      x.address ? String(x.address) : null,
      typeof x.latitude === 'number' ? x.latitude : x.latitude === null ? null : x.latitude === '' ? null : Number(x.latitude),
      typeof x.longitude === 'number' ? x.longitude : x.longitude === null ? null : x.longitude === '' ? null : Number(x.longitude),
      x.intro ? String(x.intro) : null,
      String(x.status || 'enabled'),
      asDate(x.createdAt),
      asDate(x.updatedAt)
    ]
  )
}

async function upsertCategory(pool, x) {
  await pool.query(
    `
      INSERT INTO categories (id, name, icon, sort_num, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name),
        icon=VALUES(icon),
        sort_num=VALUES(sort_num),
        status=VALUES(status),
        updated_at=VALUES(updated_at)
    `,
    [
      String(x.id || ''),
      String(x.name || ''),
      x.icon ? String(x.icon) : null,
      x.sort === null || typeof x.sort === 'undefined' || x.sort === '' ? null : Math.trunc(Number(x.sort)),
      String(x.status || 'enabled'),
      asDate(x.createdAt),
      asDate(x.updatedAt)
    ]
  )
}

async function upsertSettings(pool, x) {
  const id = 'default'
  await pool.query(
    `
      INSERT INTO app_settings (
        id, shop_name, phone, wechat_id, address, latitude, longitude,
        home_nav_title, home_search_placeholder, home_case_title, home_case_sub_title,
        home_design_title, home_design_sub_title, home_products_title,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        shop_name=VALUES(shop_name),
        phone=VALUES(phone),
        wechat_id=VALUES(wechat_id),
        address=VALUES(address),
        latitude=VALUES(latitude),
        longitude=VALUES(longitude),
        home_nav_title=VALUES(home_nav_title),
        home_search_placeholder=VALUES(home_search_placeholder),
        home_case_title=VALUES(home_case_title),
        home_case_sub_title=VALUES(home_case_sub_title),
        home_design_title=VALUES(home_design_title),
        home_design_sub_title=VALUES(home_design_sub_title),
        home_products_title=VALUES(home_products_title),
        updated_at=VALUES(updated_at)
    `,
    [
      id,
      x.shopName ? String(x.shopName) : null,
      x.phone ? String(x.phone) : null,
      x.wechatId ? String(x.wechatId) : null,
      x.address ? String(x.address) : null,
      typeof x.latitude === 'number' ? x.latitude : x.latitude === null ? null : x.latitude === '' ? null : Number(x.latitude),
      typeof x.longitude === 'number' ? x.longitude : x.longitude === null ? null : x.longitude === '' ? null : Number(x.longitude),
      x.homeNavTitle ? String(x.homeNavTitle) : null,
      x.homeSearchPlaceholder ? String(x.homeSearchPlaceholder) : null,
      x.homeCaseTitle ? String(x.homeCaseTitle) : null,
      x.homeCaseSubTitle ? String(x.homeCaseSubTitle) : null,
      x.homeDesignTitle ? String(x.homeDesignTitle) : null,
      x.homeDesignSubTitle ? String(x.homeDesignSubTitle) : null,
      x.homeProductsTitle ? String(x.homeProductsTitle) : null,
      asDate(x.updatedAt)
    ]
  )
}

async function main() {
  const host = mustEnv('MYSQL_HOST')
  const user = mustEnv('MYSQL_USER')
  const database = mustEnv('MYSQL_DATABASE')

  const port = Number(process.env.MYSQL_PORT) || 3306
  const password = String(process.env.MYSQL_PASSWORD || '')

  const pool = mysql.createPool({ host, port, user, password, database, connectionLimit: 5 })
  await ensureSchema(pool)

  const baseDir = path.join(__dirname, '../data')
  const leads = readJsonFile(path.join(baseDir, 'leads.json'), [])
  const products = readJsonFile(path.join(baseDir, 'products.json'), [])
  const cases = readJsonFile(path.join(baseDir, 'cases.json'), [])
  const posts = readJsonFile(path.join(baseDir, 'posts.json'), [])
  const storeCards = readJsonFile(path.join(baseDir, 'store_cards.json'), [])
  const categories = readJsonFile(path.join(baseDir, 'categories.json'), [])
  const settings = readJsonFile(path.join(baseDir, 'app_settings.json'), null)

  const tasks = []
  for (const x of Array.isArray(leads) ? leads : []) tasks.push(() => upsertLead(pool, x))
  for (const x of Array.isArray(products) ? products : []) tasks.push(() => upsertProduct(pool, x))
  for (const x of Array.isArray(cases) ? cases : []) tasks.push(() => upsertCase(pool, x))
  for (const x of Array.isArray(posts) ? posts : []) tasks.push(() => upsertPost(pool, x))
  for (const x of Array.isArray(storeCards) ? storeCards : []) tasks.push(() => upsertStoreCard(pool, x))
  for (const x of Array.isArray(categories) ? categories : []) tasks.push(() => upsertCategory(pool, x))
  if (settings && typeof settings === 'object') tasks.push(() => upsertSettings(pool, settings))

  for (const fn of tasks) {
    await fn()
  }

  await pool.end()
  process.stdout.write('migration done\n')
}

main().catch((e) => {
  process.stderr.write(String(e && e.message ? e.message : e) + '\n')
  process.exit(1)
})

