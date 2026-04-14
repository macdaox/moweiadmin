import type { ContentType } from '@/api/types'

export function contentLabel(type: ContentType) {
  if (type === 'products') return '商品'
  if (type === 'cases') return '案例'
  if (type === 'designs') return '效果图'
  if (type === 'posts') return '动态'
  return '门店名片'
}

export function splitLines(v: string) {
  return String(v || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function joinLines(v: string[]) {
  return (v || []).join('\n')
}
