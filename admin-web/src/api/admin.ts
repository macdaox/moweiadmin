import type {
  AdminLoginReq,
  AdminLoginResp,
  AdminMe,
  AdminStats,
  AppSettings,
  ContentType,
  Category,
  Paged,
  Product,
  CaseItem,
  PostItem,
  StoreCard,
  Lead,
  UploadResult
} from '@/api/types'
import { requestJson } from '@/api/http'

export function adminLogin(body: AdminLoginReq) {
  return requestJson<AdminLoginResp>('/api/admin/login', { method: 'POST', body })
}

export function adminMe(token: string) {
  return requestJson<AdminMe>('/api/admin/me', { token })
}

export function adminStats(token: string) {
  return requestJson<AdminStats>('/api/admin/stats', { token })
}

export function listContent(token: string, type: ContentType, q: string, limit = 50, offset = 0) {
  const entity = type === 'storeCards' ? 'store-cards' : type
  return requestJson<Paged<Product | CaseItem | PostItem | StoreCard>>(`/api/admin/${entity}`, {
    token,
    query: { q, limit, offset }
  })
}

export function createContent(token: string, type: ContentType, payload: unknown) {
  const entity = type === 'storeCards' ? 'store-cards' : type
  return requestJson<Product | CaseItem | PostItem | StoreCard>(`/api/admin/${entity}`, {
    token,
    method: 'POST',
    body: payload
  })
}

export function updateContent(token: string, type: ContentType, id: string, payload: unknown) {
  const entity = type === 'storeCards' ? 'store-cards' : type
  return requestJson<Product | CaseItem | PostItem | StoreCard>(`/api/admin/${entity}/${id}`, {
    token,
    method: 'PUT',
    body: payload
  })
}

export function deleteContent(token: string, type: ContentType, id: string) {
  const entity = type === 'storeCards' ? 'store-cards' : type
  return requestJson<unknown>(`/api/admin/${entity}/${id}`, {
    token,
    method: 'DELETE'
  })
}

export function listLeads(token: string, q: string, limit = 50, offset = 0) {
  return requestJson<Paged<Lead>>('/api/admin/leads', { token, query: { q, limit, offset } })
}

export function listCategories(token: string, q: string, limit = 200, offset = 0) {
  return requestJson<Paged<Category>>('/api/admin/categories', { token, query: { q, limit, offset } })
}

export function createCategory(token: string, payload: unknown) {
  return requestJson<Category>('/api/admin/categories', { token, method: 'POST', body: payload })
}

export function updateCategory(token: string, id: string, payload: unknown) {
  return requestJson<Category>(`/api/admin/categories/${id}`, { token, method: 'PUT', body: payload })
}

export function deleteCategory(token: string, id: string) {
  return requestJson<unknown>(`/api/admin/categories/${id}`, { token, method: 'DELETE' })
}

export function getSettings(token: string) {
  return requestJson<AppSettings>('/api/admin/settings', { token })
}

export function updateSettings(token: string, payload: unknown) {
  return requestJson<AppSettings>('/api/admin/settings', { token, method: 'PUT', body: payload })
}

export async function uploadImage(token: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form
  })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch (_e) {}
  if (!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`)
  if (!data || !data.ok) throw new Error((data && data.message) || '上传失败')
  return data.data as UploadResult
}
