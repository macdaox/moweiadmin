const COS = require('cos-nodejs-sdk-v5')
const crypto = require('crypto')

function mustEnv(name) {
  const v = String(process.env[name] || '').trim()
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function assertBucketName(bucket) {
  const b = String(bucket || '').trim()
  if (!b) throw new Error('Invalid COS_BUCKET')
  if (!/^[a-z0-9-]+-\d{5,}$/.test(b)) throw new Error('Invalid COS_BUCKET')
}

function assertRegion(region) {
  const r = String(region || '').trim()
  if (!r) throw new Error('Invalid COS_REGION')
  if (!/^[a-z]{2}-[a-z]+$/.test(r)) throw new Error('Invalid COS_REGION')
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

function createCosClient() {
  const SecretId = mustEnv('COS_SECRET_ID')
  const SecretKey = mustEnv('COS_SECRET_KEY')
  return new COS({ SecretId, SecretKey })
}

function buildPublicUrl({ region, bucket, key }) {
  const r = String(region || '').trim()
  const b = String(bucket || '').trim()
  const k = String(key || '').replace(/^\//, '')
  if (!r || !b || !k) return ''
  return `https://${b}.cos.${r}.myqcloud.com/${k}`
}

async function uploadBufferToCos({ buffer, mimeType, originalName }) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length <= 0) throw new Error('Empty file')

  const Bucket = mustEnv('COS_BUCKET')
  const Region = mustEnv('COS_REGION')
  const Prefix = String(process.env.COS_PREFIX || 'uploads/').trim()

  assertBucketName(Bucket)
  assertRegion(Region)

  const key = buildKey(originalName, mimeType, Prefix)
  const cos = createCosClient()

  await new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket,
        Region,
        Key: key,
        Body: buffer,
        ContentType: String(mimeType || 'application/octet-stream')
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data)
      }
    )
  })

  return {
    key,
    url: buildPublicUrl({ region: Region, bucket: Bucket, key })
  }
}

module.exports = {
  uploadBufferToCos
}
