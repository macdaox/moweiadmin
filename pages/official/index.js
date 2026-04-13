Page({
  data: {
    shopName: 'XX家居'
  },
  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
    if (tabBar && typeof tabBar.setData === 'function') tabBar.setData({ selected: 2 })
  },
  onLoad() {
    const app = getApp()
    this.setData({ shopName: app.globalData.shopName })
  },
  goContact() {
    wx.switchTab({ url: '/pages/card/index' })
  }
})
