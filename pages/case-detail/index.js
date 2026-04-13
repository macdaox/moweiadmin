const { getCaseById, getDesignImages } = require('../../utils/mock')
const { getFavorites, toggleFavorite } = require('../../utils/storage')

Page({
  data: {
    id: '',
    type: 'scene',
    title: '',
    images: [],
    current: 0,
    isFav: false,
    loadError: ''
  },
  onLoad(options) {
    const type = options.type === 'design' ? 'design' : 'scene'
    let title = ''
    let images = []
    const id = options.id || ''
    let loadError = ''
    if (type === 'design') {
      title = '3D 设计效果图图集'
      images = getDesignImages()
    } else {
      const c = getCaseById(id)
      title = c ? c.title : ''
      images = c ? c.images : []
      if (!id) loadError = '缺少案例参数'
      else if (!c) loadError = '未找到该案例'
    }
    const favorites = getFavorites()
    const favKey = type === 'design' ? 'design_pack' : id
    const isFav = favorites.some((i) => i.type === 'case' && i.id === favKey)
    this.setData({ id, type, title, images, isFav, loadError })
  },
  onChange(e) {
    this.setData({ current: e.detail.current })
  },
  preview(e) {
    const current = e.currentTarget.dataset.src
    wx.previewImage({ current, urls: this.data.images })
  },
  toggleFav() {
    const key = this.data.type === 'design' ? 'design_pack' : this.data.id
    if (!key) {
      wx.showToast({ title: '缺少案例ID', icon: 'none' })
      return
    }
    const next = toggleFavorite({ type: 'case', id: key })
    this.setData({ isFav: next.some((i) => i.type === 'case' && i.id === key) })
  },
  goBack() {
    const pages = getCurrentPages()
    if (pages && pages.length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/home/index' })
  }
})
