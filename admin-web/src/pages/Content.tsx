import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/store/auth'
import type { CaseItem, ContentType, PostItem, Product, StoreCard } from '@/api/types'
import { createContent, deleteContent, listContent, updateContent } from '@/api/admin'
import { Plus, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ContentTabs from '@/pages/content/ContentTabs'
import ContentTable from '@/pages/content/ContentTable'
import ContentEditorModal from '@/pages/content/ContentEditorModal'
import { contentLabel } from '@/pages/content/contentUtils'

type AnyItem = Product | CaseItem | PostItem | StoreCard

export default function Content() {
  const token = useAuth((s) => s.token)
  const [params, setParams] = useSearchParams()
  const initial = (params.get('type') as ContentType) || 'products'

  const [type, setType] = useState<ContentType>(initial)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<AnyItem[]>([])
  const [total, setTotal] = useState(0)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AnyItem | null>(null)

  const label = useMemo(() => contentLabel(type), [type])

  useEffect(() => {
    setParams((p) => {
      p.set('type', type)
      return p
    })
  }, [type, setParams])

  const reload = useCallback(async () => {
    if (!token) return
    setError('')
    setLoading(true)
    try {
      const r = await listContent(token, type, q, 50, 0)
      setItems(r.items as AnyItem[])
      setTotal(r.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [q, token, type])

  useEffect(() => {
    reload()
  }, [reload])

  async function onSave(payload: unknown) {
    if (!token) return
    setError('')
    try {
      if (editing) await updateContent(token, type, String(editing.id), payload)
      else await createContent(token, type, payload)
      setOpen(false)
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    }
  }

  async function onDelete(id: string) {
    if (!token) return
    const ok = window.confirm('确定删除？删除后不可恢复。')
    if (!ok) return
    try {
      await deleteContent(token, type, id)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-zinc-900">内容管理</div>
          <div className="mt-1 text-sm text-zinc-500">{label} · 共 {total} 条</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          新建{label}
        </button>
      </div>

      <ContentTabs type={type} onChange={setType} />

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="搜索..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') reload()
          }}
        />
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
          onClick={reload}
        >
          查询
        </button>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <ContentTable
        type={type}
        items={items}
        loading={loading}
        onEdit={(it) => {
          setEditing(it)
          setOpen(true)
        }}
        onDelete={onDelete}
      />

      <ContentEditorModal
        open={open}
        type={type}
        title={label}
        editing={editing}
        error={error}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        onSave={onSave}
      />
    </div>
  )
}
