const { getCategories, getProducts } = require('../../utils/mock')

function getCategoryName(id) {
  const cats = getCategories()
  const c = cats.find((x) => x.id === id)
  return c ? c.name : ''
}

Page({
  data: {
    categoryId: '',
    categoryName: '',
    keyword: '',
    list: []
  },
  onLoad(options) {
    const categoryId = options.categoryId || ''
    this.setData({
      categoryId,
      categoryName: categoryId ? getCategoryName(categoryId) : '',
      list: getProducts()
    })
    this.applyFilter()
  },
  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },
  clearCategory() {
    this.setData({ categoryId: '', categoryName: '' })
    this.applyFilter()
  },
  applyFilter() {
    const all = getProducts()
    const k = String(this.data.keyword || '').trim()
    const list = all.filter((p) => {
      if (this.data.categoryId && p.categoryId !== this.data.categoryId) return false
      if (k && !p.title.includes(k)) return false
      return true
    })
    this.setData({ list })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/shop-detail/index?id=${id}` })
  }
})

