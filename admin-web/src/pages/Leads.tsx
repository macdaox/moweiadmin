import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import type { Lead } from '@/api/types'
import { listLeads } from '@/api/admin'
import { Search } from 'lucide-react'
import Modal from '@/components/Modal'

export default function Leads() {
  const token = useAuth((s) => s.token)
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)

  const reload = useCallback(async () => {
    if (!token) return
    setError('')
    setLoading(true)
    try {
      const r = await listLeads(token, q, 50, 0)
      setItems(r.items)
      setTotal(r.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [q, token])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-zinc-900">线索管理</div>
          <div className="mt-1 text-sm text-zinc-500">共 {total} 条</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="搜索昵称 / visitorId / 来源..."
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

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 px-4 py-3 text-xs font-medium text-zinc-500">
          <div className="col-span-4">访客</div>
          <div className="col-span-3">visitorId</div>
          <div className="col-span-2">来源</div>
          <div className="col-span-3 text-right">提交时间</div>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-500">加载中...</div>
        ) : items.length ? (
          <div>
            {items.map((it) => (
              <button
                type="button"
                key={it.id}
                className="grid w-full grid-cols-12 items-center gap-2 px-4 py-3 text-left text-sm hover:bg-zinc-50"
                onClick={() => {
                  setSelected(it)
                  setOpen(true)
                }}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <img className="h-8 w-8 rounded-full border border-zinc-200 object-cover" src={it.avatarUrl} alt="" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900">{it.nickName}</div>
                    <div className="truncate text-xs text-zinc-500">{it.id}</div>
                  </div>
                </div>
                <div className="col-span-3 truncate text-zinc-700">{it.visitorId || '-'}</div>
                <div className="col-span-2 truncate text-zinc-700">{it.source || '-'}</div>
                <div className="col-span-3 text-right text-xs text-zinc-500">{new Date(it.createdAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-sm text-zinc-500">暂无数据</div>
        )}
      </div>

      <Modal
        open={open}
        title="线索详情"
        onClose={() => {
          setOpen(false)
          setSelected(null)
        }}
        width="max-w-xl"
      >
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <img className="h-10 w-10 rounded-full border border-zinc-200 object-cover" src={selected.avatarUrl} alt="" />
              <div>
                <div className="font-medium text-zinc-900">{selected.nickName}</div>
                <div className="text-xs text-zinc-500">{selected.id}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-xs text-zinc-500">visitorId</div>
              <div className="col-span-2 text-zinc-900">{selected.visitorId || '-'}</div>
              <div className="text-xs text-zinc-500">来源</div>
              <div className="col-span-2 text-zinc-900">{selected.source || '-'}</div>
              <div className="text-xs text-zinc-500">提交时间</div>
              <div className="col-span-2 text-zinc-900">{new Date(selected.createdAt).toLocaleString()}</div>
              <div className="text-xs text-zinc-500">meta</div>
              <pre className="col-span-2 overflow-auto rounded-lg bg-zinc-50 p-2 text-xs text-zinc-700">
                {JSON.stringify(selected.meta, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
