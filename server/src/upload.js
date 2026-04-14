const crypto = require('crypto')
const COS = require('cos-nodejs-sdk-v5')
const { getTencentCloudTempCredential } = require('./tencentCred')

function mustEnv(name) {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
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

  const Bucket = mustEnv('COS_BUCKET')
  const Region = mustEnv('COS_REGION')
  const Prefix = String(process.env.COS_PREFIX || 'uploads/').trim()
  const Key = buildKey(originalName, mimeType, Prefix)

  const cred = await getTencentCloudTempCredential()
  const cos = new COS({ SecretId: cred.secretId, SecretKey: cred.secretKey, SecurityToken: cred.token })

  await new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket,
        Region,
        Key,
        Body: buffer,
        ContentType: String(mimeType || 'application/octet-stream'),
        ACL: 'public-read'
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data)
      }
    )
  })

  const url = `https://${Bucket}.cos.${Region}.myqcloud.com/${Key}`
  return { key: Key, url }
}

module.exports = {
  uploadBufferToCos
}
