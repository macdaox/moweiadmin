Component({
  data: {
    selected: 0,
    color: '#6B7280',
    selectedColor: '#C7A46A',
    list: [
      { pagePath: '/pages/home/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/card/index', text: '名片', icon: '📇' },
      { pagePath: '/pages/official/index', text: '官网', icon: '🏷️' },
      { pagePath: '/pages/feed/index', text: '动态', icon: '📰' },
      { pagePath: '/pages/me/index', text: '我的', icon: '👤' }
    ]
  },
  methods: {
    normalizePath(p) {
      return String(p || '')
        .trim()
        .split('?')[0]
        .replace(/^\/+/, '')
    },
    updateSelected() {
      const pages = getCurrentPages()
      if (!pages || pages.length === 0) {
        this.setData({ selected: 0 })
        return
      }
      const last = pages[pages.length - 1]
      const route = last && (last.route || last.__route__) ? last.route || last.__route__ : ''
      const current = this.normalizePath(route)
      const idx = this.data.list.findIndex((i) => this.normalizePath(i.pagePath) === current)
      this.setData({ selected: idx === -1 ? 0 : idx })
    },
    onTap(e) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.list[index]
      if (!item) return
      wx.switchTab({ url: item.pagePath })
    }
  },
  lifetimes: {
    attached() {
      this.updateSelected()
    }
  },
  pageLifetimes: {
    show() {
      this.updateSelected()
    }
  }
})
