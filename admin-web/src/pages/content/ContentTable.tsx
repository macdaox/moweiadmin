import type { ContentType, Product, StoreCard } from '@/api/types'
import { cn } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'

type AnyItem = { id: string; status: string; updatedAt: string } & Record<string, unknown>

export default function ContentTable({
  type,
  items,
  loading,
  onEdit,
  onDelete
}: {
  type: ContentType
  items: AnyItem[]
  loading: boolean
  onEdit: (item: AnyItem) => void
  onDelete: (id: string) => void
}) {
  const cols = (() => {
    if (type === 'products') return ['标题', '价格', '状态', '更新时间']
    if (type === 'cases') return ['标题', '状态', '更新时间']
    if (type === 'posts') return ['标题', '状态', '更新时间']
    return ['门店名', '电话', '状态', '更新时间']
  })()

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 px-4 py-3 text-xs font-medium text-zinc-500">
        <div className="col-span-7">{cols[0]}</div>
        <div className="col-span-2">{cols[1]}</div>
        <div className="col-span-1">{cols[2]}</div>
        <div className="col-span-2 text-right">{cols[3]}</div>
      </div>
      {loading ? (
        <div className="px-4 py-6 text-sm text-zinc-500">加载中...</div>
      ) : items.length ? (
        <div>
          {items.map((it) => {
            const left = type === 'storeCards' ? String((it as unknown as StoreCard).storeName || '') : String(it.title || '')
            const mid =
              type === 'products'
                ? (it as unknown as Product).price === null
                  ? '-'
                  : `¥${(it as unknown as Product).price}`
                : type === 'storeCards'
                  ? String((it as unknown as StoreCard).phone || '-')
                  : String(it.status)
            const status = String(it.status)
            return (
              <div key={it.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm hover:bg-zinc-50">
                <div className="col-span-7">
                  <div className="truncate font-medium text-zinc-900">{left}</div>
                  <div className="mt-1 truncate text-xs text-zinc-500">ID: {it.id}</div>
                </div>
                <div className="col-span-2 truncate text-zinc-700">{mid}</div>
                <div className="col-span-1">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs',
                      status === 'disabled' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-50 text-emerald-700'
                    )}
                  >
                    {status === 'disabled' ? '禁用' : '启用'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <div className="hidden text-xs text-zinc-500 md:block">{new Date(it.updatedAt).toLocaleString()}</div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
                    onClick={() => onEdit(it)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(it.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-zinc-500">暂无数据</div>
      )}
    </div>
  )
}

