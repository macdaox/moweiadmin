function getBaseUrl() {
  try {
    const app = getApp()
    const base = app && app.globalData ? app.globalData.apiBase : ''
    return String(base || '').trim()
  } catch (_e) {
    return ''
  }
}

function request({ path, method, data, timeout }) {
  const baseUrl = getBaseUrl()
  if (!baseUrl) return Promise.reject(new Error('Missing apiBase'))
  const url = `${baseUrl}${path}`
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: method || 'GET',
      data: data || {},
      timeout: timeout || 8000,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else reject(new Error(`HTTP ${res.statusCode}`))
      },
      fail: (err) => reject(err)
    })
  })
}

function postLead(payload) {
  return request({ path: '/api/leads', method: 'POST', data: payload })
}

function getPublicSettings() {
  return request({ path: '/api/public/settings', method: 'GET' })
}

function getPublicCategories() {
  return request({ path: '/api/public/categories', method: 'GET' })
}

module.exports = {
  postLead,
  getPublicSettings,
  getPublicCategories
}
