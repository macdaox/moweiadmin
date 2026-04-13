const { getCategories, getCaseScenes, getDesignImages, searchProducts } = require('../../utils/mock')
const { getCart } = require('../../utils/storage')

Page({
  data: {
    shopName: '家居',
    searchText: '',
    searchPlaceholder: '请输入您想要搜索的产品',
    categories: [],
    scenes: [],
    designImages: [],
    shownProducts: [],
    caseTitle: '金华地区 | 上千家落地案例',
    caseSubTitle: '落地案例实拍 · 点击查看详情',
    designTitle: '设计效果图',
    designSubTitle: '效果图案例 · 点击查看详情',
    productsTitle: '推荐商品',
    showTop: false,
    cartCount: 0
  },
  onLoad() {
    const app = getApp()
    this.setData({
      shopName: app.globalData.shopName,
      searchPlaceholder: app.globalData.homeSearchPlaceholder || this.data.searchPlaceholder,
      categories: getCategories(),
      scenes: getCaseScenes(),
      designImages: getDesignImages(),
      shownProducts: searchProducts('').slice(0, 10),
      caseTitle: app.globalData.homeCaseTitle || this.data.caseTitle,
      caseSubTitle: app.globalData.homeCaseSubTitle || this.data.caseSubTitle,
      designTitle: app.globalData.homeDesignTitle || this.data.designTitle,
      designSubTitle: app.globalData.homeDesignSubTitle || this.data.designSubTitle,
      productsTitle: app.globalData.homeProductsTitle || this.data.productsTitle
    })
    this.refreshCartCount()
  },
  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
    if (tabBar && typeof tabBar.setData === 'function') tabBar.setData({ selected: 0 })
    const s = wx.getStorageSync('app_settings_cache_v1')
    const data = s && typeof s === 'object' ? s : null
    const app = getApp()
    const navTitle = (data && data.homeNavTitle) || app.globalData.homeNavTitle || ''
    wx.setNavigationBarTitle({ title: String(navTitle || '') })
    this.setData({
      searchPlaceholder: (data && data.homeSearchPlaceholder) || app.globalData.homeSearchPlaceholder || this.data.searchPlaceholder,
      caseTitle: (data && data.homeCaseTitle) || app.globalData.homeCaseTitle || this.data.caseTitle,
      caseSubTitle: (data && data.homeCaseSubTitle) || app.globalData.homeCaseSubTitle || this.data.caseSubTitle,
      designTitle: (data && data.homeDesignTitle) || app.globalData.homeDesignTitle || this.data.designTitle,
      designSubTitle: (data && data.homeDesignSubTitle) || app.globalData.homeDesignSubTitle || this.data.designSubTitle,
      productsTitle: (data && data.homeProductsTitle) || app.globalData.homeProductsTitle || this.data.productsTitle
    })
    this.refreshCartCount()
  },
  onPageScroll(e) {
    const next = e.scrollTop > 420
    if (next !== this.data.showTop) this.setData({ showTop: next })
  },
  refreshCartCount() {
    const items = getCart()
    const count = items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)
    this.setData({ cartCount: count })
  },
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
  },
  onSearchConfirm() {
    const list = searchProducts(this.data.searchText).slice(0, 10)
    this.setData({ shownProducts: list })
  },
  onTapCategory(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/shop-list/index?categoryId=${id || ''}` })
  },
  onTapScene(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/case-list/index?sceneId=${id || ''}` })
  },
  onTapDesignMore() {
    wx.navigateTo({ url: '/pages/case-list/index?type=design' })
  },
  onTapAllProducts() {
    wx.navigateTo({ url: '/pages/shop-list/index' })
  },
  onTapProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/shop-detail/index?id=${id}` })
  },
  onTapPhone() {
    const app = getApp()
    wx.makePhoneCall({ phoneNumber: app.globalData.phoneNumber })
  },
  onTapTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 220 })
  },
  onTapCart() {
    wx.navigateTo({ url: '/pages/cart/index' })
  }
})
