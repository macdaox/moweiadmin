const http = require('http')

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      let buf = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (buf += c))
      res.on('end', () => resolve({ status: res.statusCode || 0, body: buf }))
    })
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error('timeout'))
    })
  })
}

async function getRoleName() {
  const fixed = String(process.env.TENCENTCLOUD_COS_ROLE_NAME || '').trim()
  if (fixed) return fixed
  const listUrl = 'http://metadata.tencentyun.com/latest/meta-data/cam/security-credentials/'
  const r = await httpGet(listUrl)
  if (r.status !== 200) throw new Error('missing role')
  const name = String(r.body || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)[0]
  if (!name) throw new Error('missing role')
  return name
}

let cached = null

async function getTencentCloudTempCredential() {
  const envId = String(process.env.TENCENTCLOUD_SECRETID || '').trim()
  const envKey = String(process.env.TENCENTCLOUD_SECRETKEY || '').trim()
  const envToken = String(process.env.TENCENTCLOUD_SESSIONTOKEN || '').trim()
  if (envId && envKey && envToken) {
    return { secretId: envId, secretKey: envKey, token: envToken, expiredAt: Date.now() + 10 * 60 * 1000 }
  }

  if (cached && cached.expiredAt - Date.now() > 60 * 1000) return cached

  const role = await getRoleName()
  const url = `http://metadata.tencentyun.com/latest/meta-data/cam/security-credentials/${encodeURIComponent(role)}`
  const r = await httpGet(url)
  if (r.status !== 200) throw new Error('missing secretId or secretKey of tencent cloud')
  let data = null
  try {
    data = JSON.parse(r.body || '{}')
  } catch (_e) {
    data = null
  }
  const secretId = String((data && (data.TmpSecretId || data.SecretId)) || '').trim()
  const secretKey = String((data && (data.TmpSecretKey || data.SecretKey)) || '').trim()
  const token = String((data && (data.Token || data.SessionToken)) || '').trim()
  const exp = Number((data && (data.ExpiredTime || data.ExpiredAt)) || 0)
  if (!secretId || !secretKey || !token) throw new Error('missing secretId or secretKey of tencent cloud')
  const expiredAt = exp ? exp * 1000 : Date.now() + 10 * 60 * 1000
  cached = { secretId, secretKey, token, expiredAt }
  return cached
}

module.exports = {
  getTencentCloudTempCredential
}

