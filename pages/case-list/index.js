const { getCaseScenes, getCasesByScene, getDesignImages } = require('../../utils/mock')

function getSceneTitle(sceneId) {
  const scenes = getCaseScenes()
  const s = scenes.find((x) => x.id === sceneId)
  return s ? s.title : '案例'
}

Page({
  data: {
    type: 'scene',
    title: '案例',
    list: []
  },
  onLoad(options) {
    const type = options.type === 'design' ? 'design' : 'scene'
    if (type === 'design') {
      const imgs = getDesignImages()
      this.setData({
        type,
        title: '设计效果图案例',
        list: [
          {
            id: 'design_pack',
            title: '3D 设计效果图图集',
            cover: imgs[0],
            count: imgs.length
          }
        ]
      })
      return
    }

    const sceneId = options.sceneId || ''
    const list = getCasesByScene(sceneId).map((c) => ({
      id: c.id,
      title: c.title,
      cover: c.images && c.images[0] ? c.images[0] : '',
      count: (c.images || []).length
    }))
    this.setData({ type, title: getSceneTitle(sceneId), list })
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: `/pages/case-detail/index?id=${id}&type=${type}` })
  }
})

