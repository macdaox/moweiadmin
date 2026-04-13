const categories = [
  { id: 'sofa', name: '家具沙发', icon: '🛋️' },
  { id: 'bath', name: '卫浴台盆', icon: '🚿' },
  { id: 'custom', name: '全屋定制', icon: '🧰' },
  { id: 'cabinet', name: '橱柜衣柜', icon: '🗄️' },
  { id: 'cooperate', name: '期待合作', icon: '🤝' }
]

const caseScenes = [
  {
    id: 'live',
    title: '家装/自住 全屋整装实景图',
    tag: '家装自住',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20light%20luxury%20home%20interior%2C%20bright%20living%20room%2C%20neutral%20palette%2C%20high%20end%20minimal%2C%20wide%20angle%20photography%2C%20soft%20daylight%2C%20clean%20composition%2C%20ultra%20realistic&image_size=portrait_4_3'
  },
  {
    id: 'villa',
    title: '别墅/自建 大宅定制实景图',
    tag: '别墅大宅',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20light%20luxury%20villa%20interior%2C%20double%20height%20living%20room%2C%20marble%20and%20wood%2C%20neutral%20colors%2C%20architectural%20photography%2C%20clean%20lines%2C%20ultra%20realistic&image_size=portrait_4_3'
  },
  {
    id: 'apartment',
    title: '公寓/出租 小户型极简装修实景',
    tag: '小户型',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20small%20apartment%20interior%2C%20neutral%20colors%2C%20space%20saving%20furniture%2C%20cozy%20lighting%2C%20clean%20composition%2C%20ultra%20realistic%20photo&image_size=portrait_4_3'
  },
  {
    id: 'bedroom',
    title: '小区/套间 卧室柜体全屋定制实景',
    tag: '卧室柜体',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20bedroom%20wardrobe%20custom%20built%20in%2C%20light%20luxury%2C%20neutral%20palette%2C%20soft%20lighting%2C%20high%20end%20minimal%2C%20ultra%20realistic%20photo&image_size=portrait_4_3'
  }
]

const designImages = [
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20interior%203d%20render%2C%20light%20luxury%20living%20room%2C%20neutral%20colors%2C%20minimal%20design%2C%20soft%20daylight%2C%20high%20quality&image_size=landscape_4_3',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20interior%203d%20render%2C%20light%20luxury%20kitchen%2C%20marble%20countertop%2C%20wood%20cabinets%2C%20neutral%20palette%2C%20high%20quality&image_size=landscape_4_3',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20interior%203d%20render%2C%20light%20luxury%20bedroom%2C%20wardrobe%20system%2C%20neutral%20colors%2C%20soft%20lighting%2C%20high%20quality&image_size=landscape_4_3'
]

const cases = [
  {
    id: 'case_001',
    sceneId: 'live',
    title: '金华东苑 | 现代轻奢全屋整装',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20light%20luxury%20living%20room%20photo%2C%20neutral%20palette%2C%20clean%20composition%2C%20soft%20daylight%2C%20ultra%20realistic&image_size=portrait_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20light%20luxury%20dining%20room%20photo%2C%20neutral%20palette%2C%20marble%20table%2C%20clean%20composition%2C%20ultra%20realistic&image_size=portrait_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20light%20luxury%20bedroom%20photo%2C%20neutral%20palette%2C%20custom%20wardrobe%2C%20soft%20lighting%2C%20ultra%20realistic&image_size=portrait_4_3'
    ]
  },
  {
    id: 'case_002',
    sceneId: 'villa',
    title: '金华江南 | 别墅大宅定制',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20villa%20living%20room%20photo%2C%20double%20height%2C%20neutral%20palette%2C%20high%20end%2C%20ultra%20realistic&image_size=portrait_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20villa%20staircase%20photo%2C%20marble%20and%20wood%2C%20neutral%20colors%2C%20ultra%20realistic&image_size=portrait_4_3'
    ]
  },
  {
    id: 'case_003',
    sceneId: 'apartment',
    title: '金华万达 | 小户型极简改造',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20small%20apartment%20living%20room%20photo%2C%20space%20saving%2C%20neutral%20colors%2C%20ultra%20realistic&image_size=portrait_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20small%20apartment%20kitchen%20photo%2C%20neutral%20palette%2C%20clean%20composition%2C%20ultra%20realistic&image_size=portrait_4_3'
    ]
  },
  {
    id: 'case_004',
    sceneId: 'bedroom',
    title: '金华城西 | 卧室柜体系统定制',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20bedroom%20custom%20wardrobe%20photo%2C%20neutral%20colors%2C%20soft%20lighting%2C%20ultra%20realistic&image_size=portrait_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=walk%20in%20closet%20custom%20cabinet%20photo%2C%20light%20luxury%2C%20neutral%20palette%2C%20ultra%20realistic&image_size=portrait_4_3'
    ]
  }
]

const products = [
  {
    id: 'p_001',
    categoryId: 'custom',
    title: '全屋定制基础套餐（量尺+设计）',
    price: 199,
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20minimal%20interior%20design%20consultation%2C%20measuring%20tape%20and%20blueprint%2C%20neutral%20palette%2C%20clean%20composition%2C%20ultra%20realistic&image_size=square',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20interior%20design%20meeting%20photo%2C%20neutral%20palette%2C%20clean%20composition%2C%20ultra%20realistic&image_size=landscape_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=interior%20design%20blueprint%20photo%2C%20neutral%20palette%2C%20high%20end%2C%20ultra%20realistic&image_size=landscape_4_3'
    ],
    skus: [
      { id: 's_001', name: '预约量尺', price: 199 },
      { id: 's_002', name: '量尺+效果图', price: 699 }
    ]
  },
  {
    id: 'p_002',
    categoryId: 'sofa',
    title: '轻奢布艺沙发（三人位）',
    price: 2599,
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20light%20luxury%20fabric%20sofa%20product%20photo%2C%20neutral%20background%2C%20studio%20lighting%2C%20high%20end%2C%20ultra%20realistic&image_size=square',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20fabric%20sofa%20in%20living%20room%20photo%2C%20neutral%20palette%2C%20high%20end%2C%20ultra%20realistic&image_size=landscape_4_3',
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=fabric%20sofa%20closeup%20texture%20photo%2C%20neutral%20palette%2C%20ultra%20realistic&image_size=landscape_4_3'
    ],
    skus: [
      { id: 's_003', name: '米白', price: 2599 },
      { id: 's_004', name: '浅灰', price: 2599 }
    ]
  },
  {
    id: 'p_003',
    categoryId: 'bath',
    title: '岩板台盆柜（80cm）',
    price: 1399,
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20bathroom%20vanity%20cabinet%20product%20photo%2C%20neutral%20background%2C%20studio%20lighting%2C%20ultra%20realistic&image_size=square',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20bathroom%20vanity%20cabinet%20installed%20photo%2C%20neutral%20palette%2C%20clean%20composition%2C%20ultra%20realistic&image_size=landscape_4_3'
    ],
    skus: [
      { id: 's_005', name: '80cm', price: 1399 },
      { id: 's_006', name: '100cm', price: 1699 }
    ]
  }
]

const feedPosts = [
  {
    id: 'f_001',
    title: '工地日常 | 水电阶段验收',
    content: '每一步都严格按标准施工，欢迎预约上门量尺与方案设计。',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=home%20renovation%20construction%20site%20photo%2C%20electric%20wiring%2C%20clean%20and%20professional%2C%20ultra%20realistic&image_size=landscape_4_3'
    ],
    likes: 12,
    liked: false,
    comments: [
      { id: 'c1', name: '张先生', text: '施工很规范，点赞！' }
    ]
  },
  {
    id: 'f_002',
    title: '新品上新 | 极简衣柜门板',
    content: '抗指纹、耐磨易打理，适配现代简约与轻奢风格。',
    images: [
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20wardrobe%20cabinet%20panel%20product%20photo%2C%20neutral%20palette%2C%20high%20end%2C%20ultra%20realistic&image_size=landscape_4_3'
    ],
    likes: 6,
    liked: false,
    comments: []
  }
]

function getCategories() {
  try {
    const raw = wx.getStorageSync('categories_cache_v1')
    if (Array.isArray(raw) && raw.length) {
      return raw.map((x) => ({
        id: String(x.id || '').trim() || String(x.name || '').trim(),
        name: String(x.name || '').trim(),
        icon: String(x.icon || '').trim()
      }))
    }
    if (typeof raw === 'string' && raw) {
      const v = JSON.parse(raw)
      if (Array.isArray(v) && v.length) {
        return v.map((x) => ({
          id: String(x.id || '').trim() || String(x.name || '').trim(),
          name: String(x.name || '').trim(),
          icon: String(x.icon || '').trim()
        }))
      }
    }
  } catch (_e) {}
  return categories
}

function getCaseScenes() {
  return caseScenes
}

function getDesignImages() {
  return designImages
}

function getCasesByScene(sceneId) {
  return cases.filter((c) => c.sceneId === sceneId)
}

function getCaseById(id) {
  return cases.find((c) => c.id === id)
}

function getProducts() {
  return products
}

function getProductById(id) {
  return products.find((p) => p.id === id)
}

function searchProducts(keyword) {
  const k = String(keyword || '').trim()
  if (!k) return products
  return products.filter((p) => p.title.includes(k))
}

function getFeedPosts() {
  return JSON.parse(JSON.stringify(feedPosts))
}

module.exports = {
  getCategories,
  getCaseScenes,
  getDesignImages,
  getCasesByScene,
  getCaseById,
  getProducts,
  getProductById,
  searchProducts,
  getFeedPosts
}
