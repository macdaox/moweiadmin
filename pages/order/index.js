const { getProductById } = require('../../utils/mock')
const { getCart, clearCart, addOrder, addConsult } = require('../../utils/storage')

function buildItemsFromCart(cart) {
  return cart
    .map((c) => {
      const p = getProductById(c.id)
      if (!p) return null
      const sku = (p.skus || []).find((s) => s.id === c.skuId)
      const price = sku ? sku.price : p.price
      return {
        key: `${c.id}_${c.skuId}`,
        id: c.id,
        skuId: c.skuId,
        qty: c.qty,
        title: p.title,
        skuName: sku ? sku.name : '',
        price,
        subtotal: (price * c.qty).toFixed(2)
      }
    })
    .filter(Boolean)
}

function calcTotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

function genId(prefix) {
  const n = Date.now()
  const r = Math.floor(Math.random() * 1000)
  return `${prefix}_${n}_${r}`
}

Page({
  data: {
    mode: 'single',
    items: [],
    total: '0.00',
    name: '',
    phone: '',
    address: '',
    note: ''
  },
  onLoad(options) {
    const mode = options.mode || 'single'
    let items = []
    if (mode === 'cart') {
      items = buildItemsFromCart(getCart())
    } else {
      const p = getProductById(options.id)
      if (p) {
        const sku = (p.skus || []).find((s) => s.id === options.skuId)
        const price = sku ? sku.price : p.price
        const qty = Math.max(1, Number(options.qty || 1))
        items = [
          {
            key: `${p.id}_${options.skuId}`,
            id: p.id,
            skuId: options.skuId,
            qty,
            title: p.title,
            skuName: sku ? sku.name : '',
            price,
            subtotal: (price * qty).toFixed(2)
          }
        ]
      }
    }
    this.setData({ mode, items, total: calcTotal(items).toFixed(2) })
  },
  onName(e) {
    this.setData({ name: e.detail.value })
  },
  onPhone(e) {
    this.setData({ phone: e.detail.value })
  },
  onAddress(e) {
    this.setData({ address: e.detail.value })
  },
  onNote(e) {
    this.setData({ note: e.detail.value })
  },
  submit() {
    if (!this.data.items.length) {
      wx.showToast({ title: '暂无商品', icon: 'none' })
      return
    }
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(this.data.phone.trim())) {
      wx.showToast({ title: '请填写正确手机号', icon: 'none' })
      return
    }
    if (!this.data.address.trim()) {
      wx.showToast({ title: '请填写地址', icon: 'none' })
      return
    }
    const orderId = genId('order')
    const createdAt = new Date().toISOString()
    addOrder({
      id: orderId,
      items: this.data.items,
      totalPrice: this.data.total,
      status: '已提交',
      createdAt,
      contact: {
        name: this.data.name,
        phone: this.data.phone,
        address: this.data.address,
        note: this.data.note
      }
    })
    addConsult({ id: genId('consult'), title: `订单咨询：${orderId}`, createdAt })
    if (this.data.mode === 'cart') clearCart()
    wx.showModal({
      title: '提交成功',
      content: `订单号：${orderId}\n本期为演示版，将订单保存到本地。`,
      showCancel: false,
      success: () => {
        wx.switchTab({ url: '/pages/me/index' })
      }
    })
  }
})

