Page({
  data: {
    shopName: 'XX家居',
    phoneNumber: '',
    wechatId: '',
    address: '',
    location: null,
    visitorId: '',
    unlocked: false,
    userInfo: null,
    showAuthSheet: false,
    tempAvatarUrl: '',
    tempNickName: ''
  },
  onLoad() {
    const { getVisitorId } = require('../../utils/visitor')
    const app = getApp()
    const unlocked = !!wx.getStorageSync('card_unlocked_v1')
    const userInfo = wx.getStorageSync('card_user_info_v1') || null
    this.setData({
      shopName: app.globalData.shopName,
      phoneNumber: app.globalData.phoneNumber,
      wechatId: app.globalData.wechatId,
      address: app.globalData.address,
      location: app.globalData.location,
      visitorId: getVisitorId(),
      unlocked,
      userInfo,
      showAuthSheet: !unlocked,
      tempAvatarUrl: userInfo && userInfo.avatarUrl ? userInfo.avatarUrl : '',
      tempNickName: userInfo && userInfo.nickName ? userInfo.nickName : ''
    })
  },
  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
    if (tabBar && typeof tabBar.setData === 'function') tabBar.setData({ selected: 1 })
    const unlocked = !!wx.getStorageSync('card_unlocked_v1')
    if (!unlocked && !this.data.showAuthSheet) this.setData({ showAuthSheet: true })
  },
  requestUnlock() {
    this.ensureUnlocked()
  },
  ensureUnlocked(next) {
    if (this.data.unlocked) {
      if (typeof next === 'function') next()
      return
    }
    this.setData({ showAuthSheet: true })
    if (typeof next === 'function') this._pendingNext = next
  },
  noop() {},
  onChooseAvatar(e) {
    const avatarUrl = e && e.detail ? e.detail.avatarUrl : ''
    if (!avatarUrl) return
    this.setData({ tempAvatarUrl: avatarUrl })
  },
  onNicknameInput(e) {
    this.setData({ tempNickName: (e && e.detail ? e.detail.value : '') || '' })
  },
  rejectAuth() {
    this.setData({ showAuthSheet: false })
    wx.showToast({ title: '未授权', icon: 'none' })
  },
  allowAuth() {
    const { postLead } = require('../../utils/api')
    const avatarUrl = String(this.data.tempAvatarUrl || '').trim()
    const nickName = String(this.data.tempNickName || '').trim()
    if (!avatarUrl) {
      wx.showToast({ title: '请先选择头像', icon: 'none' })
      return
    }
    if (!nickName) {
      wx.showToast({ title: '请先填写昵称', icon: 'none' })
      return
    }
    const userInfo = { avatarUrl, nickName }
    wx.setStorageSync('card_unlocked_v1', '1')
    wx.setStorageSync('card_user_info_v1', userInfo)
    this.setData({ unlocked: true, userInfo, showAuthSheet: false })

    postLead({
      nickName,
      avatarUrl,
      visitorId: this.data.visitorId || '',
      source: 'card',
      meta: {
        page: 'pages/card/index',
        ts: Date.now()
      }
    }).catch(() => {})

    const next = this._pendingNext
    this._pendingNext = null
    if (typeof next === 'function') next()
  },
  call() {
    this.ensureUnlocked(() => {
      wx.makePhoneCall({ phoneNumber: this.data.phoneNumber })
    })
  },
  openMap() {
    this.ensureUnlocked(() => {
      const loc = this.data.location
      if (!loc) return
      wx.openLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: this.data.shopName,
        address: this.data.address
      })
    })
  },
  copyWechat() {
    this.ensureUnlocked(() => {
      wx.setClipboardData({ data: this.data.wechatId })
    })
  }
})
