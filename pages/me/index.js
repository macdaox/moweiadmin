const { getOrders, getFavorites, getConsults } = require('../../utils/storage')

Page({
  data: {
    orders: [],
    favorites: [],
    consults: []
  },
  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
    if (tabBar && typeof tabBar.setData === 'function') tabBar.setData({ selected: 4 })
    const orders = getOrders()
    const favorites = getFavorites().map((f) => ({ ...f, key: `${f.type}_${f.id}` }))
    const consults = getConsults()
    this.setData({ orders, favorites, consults })
  },
  goShop() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
