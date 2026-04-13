const { getProductById } = require('../../utils/mock')
const { addToCart, getFavorites, toggleFavorite } = require('../../utils/storage')

function findSku(product, skuId) {
  if (!product) return null
  return (product.skus || []).find((s) => s.id === skuId) || null
}

Page({
  data: {
    product: null,
    selectedSkuId: '',
    qty: 1,
    activePrice: 0,
    isFav: false,
    loadError: ''
  },
  onLoad(options) {
    const product = getProductById(options.id)
    const selectedSkuId = product && product.skus && product.skus[0] ? product.skus[0].id : ''
    const sku = findSku(product, selectedSkuId)
    const favorites = getFavorites()
    const isFav = favorites.some((i) => i.type === 'product' && i.id === (product ? product.id : ''))
    const loadError = options.id ? (product ? '' : '未找到该商品') : '缺少商品参数'
    this.setData({
      product,
      selectedSkuId,
      activePrice: sku ? sku.price : product ? product.price : 0,
      isFav,
      loadError
    })
  },
  selectSku(e) {
    const id = e.currentTarget.dataset.id
    const sku = findSku(this.data.product, id)
    this.setData({ selectedSkuId: id, activePrice: sku ? sku.price : this.data.activePrice })
  },
  incQty() {
    this.setData({ qty: this.data.qty + 1 })
  },
  decQty() {
    this.setData({ qty: Math.max(1, this.data.qty - 1) })
  },
  previewImage(e) {
    const src = e.currentTarget.dataset.src
    const urls = (this.data.product && this.data.product.images) || []
    wx.previewImage({ current: src, urls })
  },
  addCart() {
    if (!this.data.product || !this.data.selectedSkuId) return
    addToCart({ id: this.data.product.id, skuId: this.data.selectedSkuId, qty: this.data.qty })
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  },
  buyNow() {
    if (!this.data.product || !this.data.selectedSkuId) return
    wx.navigateTo({
      url: `/pages/order/index?mode=single&id=${this.data.product.id}&skuId=${this.data.selectedSkuId}&qty=${this.data.qty}`
    })
  },
  toggleFav() {
    if (!this.data.product) return
    const next = toggleFavorite({ type: 'product', id: this.data.product.id })
    this.setData({ isFav: next.some((i) => i.type === 'product' && i.id === this.data.product.id) })
  },
  goBack() {
    const pages = getCurrentPages()
    if (pages && pages.length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/home/index' })
  },
  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
