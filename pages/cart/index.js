const { getProductById } = require('../../utils/mock')
const { getCart, updateCartQty, removeFromCart } = require('../../utils/storage')

function buildItems(cart) {
  return cart
    .map((c) => {
      const p = getProductById(c.id)
      if (!p) return null
      const sku = (p.skus || []).find((s) => s.id === c.skuId)
      return {
        key: `${c.id}_${c.skuId}`,
        id: c.id,
        skuId: c.skuId,
        qty: c.qty,
        title: p.title,
        cover: p.cover,
        skuName: sku ? sku.name : '',
        price: sku ? sku.price : p.price
      }
    })
    .filter(Boolean)
}

function calcTotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

Page({
  data: {
    items: [],
    total: 0
  },
  onShow() {
    this.refresh()
  },
  refresh() {
    const cart = getCart()
    const items = buildItems(cart)
    this.setData({ items, total: calcTotal(items).toFixed(2) })
  },
  inc(e) {
    const id = e.currentTarget.dataset.id
    const skuId = e.currentTarget.dataset.skuid
    const current = this.data.items.find((i) => i.id === id && i.skuId === skuId)
    if (!current) return
    updateCartQty(id, skuId, current.qty + 1)
    this.refresh()
  },
  dec(e) {
    const id = e.currentTarget.dataset.id
    const skuId = e.currentTarget.dataset.skuid
    const current = this.data.items.find((i) => i.id === id && i.skuId === skuId)
    if (!current) return
    updateCartQty(id, skuId, Math.max(1, current.qty - 1))
    this.refresh()
  },
  del(e) {
    const id = e.currentTarget.dataset.id
    const skuId = e.currentTarget.dataset.skuid
    removeFromCart(id, skuId)
    this.refresh()
  },
  checkout() {
    wx.navigateTo({ url: '/pages/order/index?mode=cart' })
  },
  goShop() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})

