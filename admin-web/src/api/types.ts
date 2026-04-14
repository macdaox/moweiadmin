export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; message?: string }
export type ApiResp<T> = ApiOk<T> | ApiErr

export type Paged<T> = {
  items: T[]
  total: number
}

export type AdminLoginReq = {
  email: string
  password: string
}

export type AdminLoginResp = {
  token: string
  email: string
}

export type AdminMe = {
  email: string
}

export type AdminStats = {
  products: number
  cases: number
  posts: number
  storeCards: number
  categories: number
  leads: number
}

export type Category = {
  id: string
  name: string
  icon: string
  sort: number | null
  status: 'enabled' | 'disabled'
  createdAt: string
  updatedAt: string
}

export type AppSettings = {
  id: string
  shopName: string
  phone: string
  wechatId: string
  address: string
  latitude: number | null
  longitude: number | null
  homeNavTitle: string
  homeSearchPlaceholder: string
  homeCaseTitle: string
  homeCaseSubTitle: string
  homeDesignTitle: string
  homeDesignSubTitle: string
  homeProductsTitle: string
  updatedAt: string
}

export type Product = {
  id: string
  title: string
  description: string
  price: number | null
  status: 'enabled' | 'disabled'
  coverUrl: string
  images: string[]
  skus: unknown[]
  createdAt: string
  updatedAt: string
}

export type CaseItem = {
  id: string
  title: string
  summary: string
  content: string
  status: 'enabled' | 'disabled'
  coverUrl: string
  images: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type PostItem = {
  id: string
  title: string
  content: string
  status: 'enabled' | 'disabled'
  images: string[]
  createdAt: string
  updatedAt: string
}

export type StoreCard = {
  id: string
  storeName: string
  contactName: string
  phone: string
  wechatId: string
  address: string
  latitude: number | null
  longitude: number | null
  intro: string
  status: 'enabled' | 'disabled'
  createdAt: string
  updatedAt: string
}

export type Lead = {
  id: string
  nickName: string
  avatarUrl: string
  visitorId: string
  source: string
  meta: unknown
  createdAt: string
}

export type ContentType = 'products' | 'cases' | 'posts' | 'storeCards'

export type UploadResult = {
  key: string
  url: string
}
