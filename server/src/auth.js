const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

function getAdminConfig() {
  const email = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim()
  const password = String(process.env.ADMIN_PASSWORD || 'admin123').trim()
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim()
  const jwtSecret = String(process.env.ADMIN_JWT_SECRET || 'dev_jwt_secret_change_me').trim()
  const legacyToken = String(process.env.ADMIN_TOKEN || '').trim()
  return { email, password, passwordHash, jwtSecret, legacyToken }
}

function isProd() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
}

function ensureAuthConfigured() {
  if (!isProd()) return
  const cfg = getAdminConfig()
  const hasHash = !!cfg.passwordHash
  const hasSecret = cfg.jwtSecret && cfg.jwtSecret !== 'dev_jwt_secret_change_me'
  const hasCustomCred = cfg.email !== 'admin@example.com' && (hasHash || cfg.password !== 'admin123')
  if (!hasSecret || !hasCustomCred) {
    throw new Error('Admin auth not configured')
  }
}

async function verifyCredentials(email, password) {
  const cfg = getAdminConfig()
  if (String(email || '').trim().toLowerCase() !== cfg.email.toLowerCase()) return false
  const pwd = String(password || '')
  if (cfg.passwordHash) return bcrypt.compare(pwd, cfg.passwordHash)
  return pwd === cfg.password
}

function signToken(payload) {
  const cfg = getAdminConfig()
  return jwt.sign(payload, cfg.jwtSecret, { expiresIn: '7d' })
}

function verifyToken(token) {
  const cfg = getAdminConfig()
  return jwt.verify(token, cfg.jwtSecret)
}

function extractBearer(req) {
  const auth = String(req.headers.authorization || '').trim()
  if (!auth) return ''
  if (!auth.toLowerCase().startsWith('bearer ')) return ''
  return auth.slice(7).trim()
}

function requireAdmin(req, res, next) {
  const cfg = getAdminConfig()
  const bearer = extractBearer(req)
  if (cfg.legacyToken && bearer === cfg.legacyToken) {
    req.admin = { email: cfg.email, legacy: true }
    next()
    return
  }
  if (!bearer) {
    res.status(401).json({ ok: false, message: 'unauthorized' })
    return
  }
  try {
    const decoded = verifyToken(bearer)
    req.admin = { email: decoded && decoded.email ? decoded.email : cfg.email, legacy: false }
    next()
  } catch (_e) {
    res.status(401).json({ ok: false, message: 'unauthorized' })
  }
}

module.exports = {
  ensureAuthConfigured,
  verifyCredentials,
  signToken,
  requireAdmin
}
