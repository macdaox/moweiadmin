const crypto = require('crypto')
const app = require('tcb-admin-node')

function mustEnv(name) {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function getCloudEnvId() {
  return (
    String(process.env.CLOUDBASE_ENV_ID || '').trim() ||
    String(process.env.TCB_ENV || '').trim() ||
    String(process.env.WX_CLOUD_ENV_ID || '').trim() ||
    String(process.env.WX_ENV_ID || '').trim()
  )
}

function guessExtFromMime(mime) {
  const m = String(mime || '').toLowerCase()
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/png') return 'png'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/gif') return 'gif'
  if (m === 'image/svg+xml') return 'svg'
  return ''
}

function buildKey(originalName, mimeType, prefix) {
  const ts = Date.now()
  const rand = crypto.randomBytes(8).toString('hex')
  const name = String(originalName || '').trim()
  const extFromName = name.includes('.') ? name.split('.').pop() : ''
  const ext = String(extFromName || guessExtFromMime(mimeType) || 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
  const safePrefix = String(prefix || 'uploads/').replace(/^\//, '').replace(/\/?$/, '/')
  return `${safePrefix}${ts}_${rand}.${ext}`
}

async function uploadBufferToCos({ buffer, mimeType, originalName }) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length <= 0) throw new Error('Empty file')

  const env = getCloudEnvId()
  if (!env) mustEnv('CLOUDBASE_ENV_ID')

  if (app && typeof app.init === 'function') app.init({ env })

  const Prefix = String(process.env.CLOUDBASE_STORAGE_PREFIX || 'uploads/').trim()
  const cloudPath = buildKey(originalName, mimeType, Prefix)

  const result = await app.uploadFile({ cloudPath, fileContent: buffer })
  const fileID =
    result && (result.fileID || result.fileId || result.fildID) ? String(result.fileID || result.fileId || result.fildID) : ''
  if (!fileID) throw new Error('upload failed')

  return { key: cloudPath, url: fileID }
}

module.exports = {
  uploadBufferToCos
}
