const KEY = 'visitor_id_v1'

function createId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getVisitorId() {
  let id = wx.getStorageSync(KEY)
  if (!id) {
    id = createId()
    wx.setStorageSync(KEY, id)
  }
  return String(id)
}

module.exports = {
  getVisitorId
}

