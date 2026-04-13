const { getFeedPosts } = require('../../utils/mock')

function genId() {
  const n = Date.now()
  const r = Math.floor(Math.random() * 1000)
  return `c_${n}_${r}`
}

Page({
  data: {
    posts: [],
    draft: {}
  },
  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
    if (tabBar && typeof tabBar.setData === 'function') tabBar.setData({ selected: 3 })
  },
  onLoad() {
    this.setData({ posts: getFeedPosts() })
  },
  preview(e) {
    const src = e.currentTarget.dataset.src
    const pid = e.currentTarget.dataset.pid
    const post = this.data.posts.find((p) => p.id === pid)
    if (!post) return
    wx.previewImage({ current: src, urls: post.images })
  },
  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    const posts = this.data.posts.map((p) => {
      if (p.id !== id) return p
      const liked = !p.liked
      return { ...p, liked, likes: Math.max(0, p.likes + (liked ? 1 : -1)) }
    })
    this.setData({ posts })
  },
  onDraft(e) {
    const id = e.currentTarget.dataset.id
    const val = e.detail.value
    this.setData({ draft: { ...this.data.draft, [id]: val } })
  },
  send(e) {
    const id = e.currentTarget.dataset.id || (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id)
    const text = String(this.data.draft[id] || '').trim()
    if (!text) {
      wx.showToast({ title: '请输入评论', icon: 'none' })
      return
    }
    const posts = this.data.posts.map((p) => {
      if (p.id !== id) return p
      return { ...p, comments: [...p.comments, { id: genId(), name: '访客', text }] }
    })
    const draft = { ...this.data.draft, [id]: '' }
    this.setData({ posts, draft })
  }
})
