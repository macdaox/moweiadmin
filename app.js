App({
  onLaunch() {
    const base = String(this.globalData.apiBase || '').trim()
    if (!base) return
    wx.request({
      url: `${base}/api/public/settings`,
      method: 'GET',
      success: (res) => {
        const data = res && res.data && res.data.ok ? res.data.data : null
        if (!data) return
        this.globalData.shopName = String(data.shopName || this.globalData.shopName || '')
        this.globalData.phoneNumber = String(data.phone || this.globalData.phoneNumber || '')
        this.globalData.wechatId = String(data.wechatId || this.globalData.wechatId || '')
        this.globalData.address = String(data.address || this.globalData.address || '')
        this.globalData.homeNavTitle = String(data.homeNavTitle || '')
        this.globalData.homeSearchPlaceholder = String(data.homeSearchPlaceholder || '')
        this.globalData.homeCaseTitle = String(data.homeCaseTitle || '')
        this.globalData.homeCaseSubTitle = String(data.homeCaseSubTitle || '')
        this.globalData.homeDesignTitle = String(data.homeDesignTitle || '')
        this.globalData.homeDesignSubTitle = String(data.homeDesignSubTitle || '')
        this.globalData.homeProductsTitle = String(data.homeProductsTitle || '')
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          this.globalData.location = { latitude: data.latitude, longitude: data.longitude }
        }
        wx.setStorageSync('app_settings_cache_v1', data)
      }
    })

    wx.request({
      url: `${base}/api/public/categories`,
      method: 'GET',
      success: (res) => {
        const list = res && res.data && res.data.ok ? res.data.data : null
        if (!Array.isArray(list)) return
        wx.setStorageSync('categories_cache_v1', list)
      }
    })
  },
  globalData: {
    shopName: '墨维装饰',
    phoneNumber: '13800000000',
    wechatId: 'XXJIAJU',
    address: '浙江省金华市XX区XX路XX号',
    apiBase: 'http://localhost:3000',
    homeNavTitle: '墨维装饰',
    homeSearchPlaceholder: '请输入您想要搜索的产品',
    homeCaseTitle: '金华地区 | 上千家落地案例',
    homeCaseSubTitle: '落地案例实拍 · 点击查看详情',
    homeDesignTitle: '设计效果图',
    homeDesignSubTitle: '效果图案例 · 点击查看详情',
    homeProductsTitle: '推荐商品',
    location: {
      latitude: 29.0791,
      longitude: 119.6474
    }
  }
})
