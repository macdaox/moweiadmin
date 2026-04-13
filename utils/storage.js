const KEYS = {
  cart: 'cart_v1',
  orders: 'orders_v1',
  favorites: 'favorites_v1',
  consults: 'consults_v1'
}

function getJSON(key, fallback) {
  const v = wx.getStorageSync(key)
  if (!v) return fallback
  try {
    return JSON.parse(v)
  } catch (e) {
    return fallback
  }
}

function setJSON(key, value) {
  wx.setStorageSync(key, JSON.stringify(value))
}

function getCart() {
  return getJSON(KEYS.cart, [])
}

function setCart(items) {
  setJSON(KEYS.cart, items)
}

function addToCart(payload) {
  const items = getCart()
  const idx = items.findIndex((i) => i.id === payload.id && i.skuId === payload.skuId)
  if (idx >= 0) {
    items[idx].qty += payload.qty
  } else {
    items.push({ id: payload.id, skuId: payload.skuId, qty: payload.qty })
  }
  setCart(items)
  return items
}

function updateCartQty(id, skuId, qty) {
  const items = getCart()
  const next = items
    .map((i) => (i.id === id && i.skuId === skuId ? { ...i, qty } : i))
    .filter((i) => i.qty > 0)
  setCart(next)
  return next
}

function removeFromCart(id, skuId) {
  const items = getCart().filter((i) => !(i.id === id && i.skuId === skuId))
  setCart(items)
  return items
}

function clearCart() {
  setCart([])
}

function getOrders() {
  return getJSON(KEYS.orders, [])
}

function addOrder(order) {
  const orders = getOrders()
  orders.unshift(order)
  setJSON(KEYS.orders, orders)
  return orders
}

function getFavorites() {
  return getJSON(KEYS.favorites, [])
}

function toggleFavorite(entry) {
  const favorites = getFavorites()
  const idx = favorites.findIndex((i) => i.type === entry.type && i.id === entry.id)
  const next = idx >= 0 ? favorites.filter((_, i) => i !== idx) : [entry, ...favorites]
  setJSON(KEYS.favorites, next)
  return next
}

function getConsults() {
  return getJSON(KEYS.consults, [])
}

function addConsult(consult) {
  const consults = getConsults()
  consults.unshift(consult)
  setJSON(KEYS.consults, consults)
  return consults
}

module.exports = {
  getCart,
  setCart,
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
  getOrders,
  addOrder,
  getFavorites,
  toggleFavorite,
  getConsults,
  addConsult
}
