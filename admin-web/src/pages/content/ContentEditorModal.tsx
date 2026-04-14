import type { CaseItem, ContentType, PostItem, Product, StoreCard } from '@/api/types'
import Modal from '@/components/Modal'
import { joinLines, splitLines } from '@/pages/content/contentUtils'
import { useEffect, useMemo, useState } from 'react'
import { uploadImage } from '@/api/admin'
import { useAuth } from '@/store/auth'

type AnyItem = Product | CaseItem | PostItem | StoreCard

type Draft = Record<string, string>

function initDraft(type: ContentType, editing: AnyItem | null): Draft {
  if (type === 'products') {
    const v = editing as Product | null
    return {
      title: v?.title || '',
      description: v?.description || '',
      price: v?.price === null || typeof v?.price === 'undefined' ? '' : String(v?.price),
      status: v?.status || 'enabled',
      coverUrl: v?.coverUrl || '',
      imagesText: joinLines(v?.images || [])
    }
  }
  if (type === 'cases') {
    const v = editing as CaseItem | null
    return {
      title: v?.title || '',
      summary: v?.summary || '',
      content: v?.content || '',
      status: v?.status || 'enabled',
      coverUrl: v?.coverUrl || '',
      imagesText: joinLines(v?.images || []),
      tagsText: joinLines(v?.tags || [])
    }
  }
  if (type === 'posts') {
    const v = editing as PostItem | null
    return {
      title: v?.title || '',
      content: v?.content || '',
      status: v?.status || 'enabled',
      imagesText: joinLines(v?.images || [])
    }
  }
  const v = editing as StoreCard | null
  return {
    storeName: v?.storeName || '',
    contactName: v?.contactName || '',
    phone: v?.phone || '',
    wechatId: v?.wechatId || '',
    address: v?.address || '',
    latitude: v?.latitude === null || typeof v?.latitude === 'undefined' ? '' : String(v?.latitude),
    longitude: v?.longitude === null || typeof v?.longitude === 'undefined' ? '' : String(v?.longitude),
    intro: v?.intro || '',
    status: v?.status || 'enabled'
  }
}

function buildPayload(type: ContentType, draft: Draft) {
  const payload: Record<string, unknown> = {}
  if (type === 'products') {
    payload.title = draft.title || ''
    payload.description = draft.description || ''
    payload.price = draft.price === '' ? null : Number(draft.price)
    payload.status = draft.status || 'enabled'
    payload.coverUrl = draft.coverUrl || ''
    payload.images = splitLines(draft.imagesText || '')
  }
  if (type === 'cases') {
    payload.title = draft.title || ''
    payload.summary = draft.summary || ''
    payload.content = draft.content || ''
    payload.status = draft.status || 'enabled'
    payload.coverUrl = draft.coverUrl || ''
    payload.images = splitLines(draft.imagesText || '')
    payload.tags = splitLines(draft.tagsText || '')
  }
  if (type === 'posts') {
    payload.title = draft.title || ''
    payload.content = draft.content || ''
    payload.status = draft.status || 'enabled'
    payload.images = splitLines(draft.imagesText || '')
  }
  if (type === 'storeCards') {
    payload.storeName = draft.storeName || ''
    payload.contactName = draft.contactName || ''
    payload.phone = draft.phone || ''
    payload.wechatId = draft.wechatId || ''
    payload.address = draft.address || ''
    payload.latitude = draft.latitude === '' ? null : Number(draft.latitude)
    payload.longitude = draft.longitude === '' ? null : Number(draft.longitude)
    payload.intro = draft.intro || ''
    payload.status = draft.status || 'enabled'
  }
  return payload
}

export default function ContentEditorModal({
  open,
  type,
  title,
  editing,
  error,
  onClose,
  onSave
}: {
  open: boolean
  type: ContentType
  title: string
  editing: AnyItem | null
  error: string
  onClose: () => void
  onSave: (payload: unknown) => Promise<void>
}) {
  const token = useAuth((s) => s.token)
  const initial = useMemo(() => initDraft(type, editing), [type, editing])
  const [draft, setDraft] = useState<Draft>(initial)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setDraft(initial)
  }, [initial])

  async function onUploadCover(file: File) {
    if (!token) return
    setUploading(true)
    try {
      const r = await uploadImage(token, file)
      setDraft((d) => ({ ...d, coverUrl: r.url }))
    } finally {
      setUploading(false)
    }
  }

  async function onUploadImages(files: FileList | null) {
    if (!token) return
    if (!files || !files.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i)
        if (!f) continue
        const r = await uploadImage(token, f)
        urls.push(r.url)
      }
      if (urls.length) {
        setDraft((d) => {
          const curr = String(d.imagesText || '').trim()
          const next = curr ? `${curr}\n${urls.join('\n')}` : urls.join('\n')
          return { ...d, imagesText: next }
        })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal open={open} title={editing ? `编辑${title}` : `新建${title}`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {type === 'storeCards' ? (
          <>
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-zinc-700">门店名</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.storeName || ''}
                onChange={(e) => setDraft((d) => ({ ...d, storeName: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">联系人</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.contactName || ''}
                onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">电话</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.phone || ''}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">微信号</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.wechatId || ''}
                onChange={(e) => setDraft((d) => ({ ...d, wechatId: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">状态</div>
              <select
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.status || 'enabled'}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              >
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-zinc-700">地址</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.address || ''}
                onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">纬度</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.latitude || ''}
                onChange={(e) => setDraft((d) => ({ ...d, latitude: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">经度</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.longitude || ''}
                onChange={(e) => setDraft((d) => ({ ...d, longitude: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-zinc-700">简介</div>
              <textarea
                className="mt-2 h-28 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.intro || ''}
                onChange={(e) => setDraft((d) => ({ ...d, intro: e.target.value }))}
              />
            </div>
          </>
        ) : (
          <>
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-zinc-700">标题</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.title || ''}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">状态</div>
              <select
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={draft.status || 'enabled'}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              >
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
            {type === 'products' ? (
              <div>
                <div className="text-xs font-medium text-zinc-700">价格</div>
                <input
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={draft.price || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                />
              </div>
            ) : null}
            {type === 'products' || type === 'cases' ? (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-zinc-700">封面</div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="mt-2 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-800 disabled:opacity-60"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                    if (f) onUploadCover(f)
                    e.currentTarget.value = ''
                  }}
                />
                <div className="mt-3 text-xs font-medium text-zinc-700">封面 URL</div>
                <input
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={draft.coverUrl || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, coverUrl: e.target.value }))}
                />
              </div>
            ) : null}
            {type === 'products' ? (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-zinc-700">描述</div>
                <textarea
                  className="mt-2 h-24 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={draft.description || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </div>
            ) : null}
            {type === 'cases' ? (
              <>
                <div className="md:col-span-2">
                  <div className="text-xs font-medium text-zinc-700">摘要</div>
                  <textarea
                    className="mt-2 h-20 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                    value={draft.summary || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                  />
                </div>
              </>
            ) : null}
            {type === 'cases' || type === 'posts' ? (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-zinc-700">内容</div>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={draft.content || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                />
              </div>
            ) : null}
            {type === 'products' || type === 'cases' || type === 'posts' ? (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-zinc-700">图片</div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  className="mt-2 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-800 disabled:opacity-60"
                  onChange={(e) => {
                    onUploadImages(e.target.files)
                    e.currentTarget.value = ''
                  }}
                />
                <div className="mt-3 text-xs font-medium text-zinc-700">图片 URLs（每行一条）</div>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={draft.imagesText || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, imagesText: e.target.value }))}
                />
              </div>
            ) : null}
            {type === 'cases' ? (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-zinc-700">标签（每行一条）</div>
                <textarea
                  className="mt-2 h-20 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={draft.tagsText || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, tagsText: e.target.value }))}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          onClick={onClose}
        >
          取消
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          disabled={uploading}
          onClick={() => onSave(buildPayload(type, draft))}
        >
          保存
        </button>
      </div>
    </Modal>
  )
}
