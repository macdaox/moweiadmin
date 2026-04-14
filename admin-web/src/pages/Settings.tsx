import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/store/auth'
import Modal from '@/components/Modal'
import { createCategory, deleteCategory, getSettings, listCategories, updateCategory, updateSettings } from '@/api/admin'
import type { AppSettings, Category } from '@/api/types'

type Tab = 'categories' | 'app'
type DraftCategory = { id: string; name: string; icon: string; sort: number | null; status: 'enabled' | 'disabled' }

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={
        active
          ? 'rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white'
          : 'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50'
      }
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-600">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900'

export default function Settings() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('categories')
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)

  const initialCategory: DraftCategory = useMemo(() => ({ id: '', name: '', icon: '', sort: null, status: 'enabled' }), [])
  const [draft, setDraft] = useState<DraftCategory>(initialCategory)

  async function refreshCategories() {
    if (!token) return
    setLoading(true)
    try {
      const r = await listCategories(token, q, 200, 0)
      setCategories(r.items)
    } finally {
      setLoading(false)
    }
  }

  async function refreshSettings() {
    if (!token) return
    setLoading(true)
    try {
      const r = await getSettings(token)
      setSettings(r)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCategories()
  }, [token])

  useEffect(() => {
    refreshSettings()
  }, [token])

  useEffect(() => {
    const t = window.setTimeout(() => {
      refreshCategories()
    }, 250)
    return () => window.clearTimeout(t)
  }, [q])

  function openCreate() {
    setEditing(null)
    setDraft(initialCategory)
    setOpen(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setDraft({ id: c.id, name: c.name, icon: c.icon, sort: c.sort, status: c.status })
    setOpen(true)
  }

  async function submitCategory() {
    if (!token) return
    const payload = {
      name: String(draft.name || '').trim(),
      icon: String(draft.icon || '').trim(),
      sort: draft.sort,
      status: draft.status
    }
    if (!payload.name) return
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(token, editing.id, payload)
      } else {
        await createCategory(token, payload)
      }
      setOpen(false)
      await refreshCategories()
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteCategory(c: Category) {
    if (!token) return
    const ok = window.confirm(`确认删除分类「${c.name}」？删除后不可恢复。`)
    if (!ok) return
    setSaving(true)
    try {
      await deleteCategory(token, c.id)
      await refreshCategories()
    } finally {
      setSaving(false)
    }
  }

  async function submitSettings() {
    if (!token || !settings) return
    setSaving(true)
    try {
      await updateSettings(token, {
        shopName: settings.shopName,
        phone: settings.phone,
        wechatId: settings.wechatId,
        address: settings.address,
        latitude: settings.latitude,
        longitude: settings.longitude,
        homeNavTitle: settings.homeNavTitle,
        homeSearchPlaceholder: settings.homeSearchPlaceholder,
        homeCaseTitle: settings.homeCaseTitle,
        homeCaseSubTitle: settings.homeCaseSubTitle,
        homeDesignTitle: settings.homeDesignTitle,
        homeDesignSubTitle: settings.homeDesignSubTitle,
        homeProductsTitle: settings.homeProductsTitle
      })
      await refreshSettings()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-zinc-900">基础设置</div>
          <div className="mt-1 text-sm text-zinc-500">分类名称与小程序基础信息维护</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === 'categories'} label="商品分类" onClick={() => setTab('categories')} />
        <TabButton active={tab === 'app'} label="小程序信息" onClick={() => setTab('app')} />
      </div>

      {tab === 'categories' ? (
        <div className="mt-5 rounded-xl border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div className="flex flex-1 items-center gap-3">
              <input
                className={inputCls}
                placeholder="搜索分类名称"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <div className="text-xs text-zinc-500">{loading ? '加载中...' : `${categories.length} 条`}</div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm text-white hover:bg-zinc-800"
              onClick={openCreate}
            >
              新建分类
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">名称</th>
                  <th className="px-5 py-3 font-medium">图标</th>
                  <th className="px-5 py-3 font-medium">排序</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">更新时间</th>
                  <th className="px-5 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-100">
                    <td className="px-5 py-3 font-medium text-zinc-900">{c.name}</td>
                    <td className="px-5 py-3 text-zinc-700">{c.icon || '-'}</td>
                    <td className="px-5 py-3 text-zinc-700">{c.sort === null ? '-' : c.sort}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          c.status === 'enabled'
                            ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700'
                            : 'rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600'
                        }
                      >
                        {c.status === 'enabled' ? '启用' : '停用'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{new Date(c.updatedAt).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-zinc-900 hover:underline"
                          onClick={() => openEdit(c)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          onClick={() => onDeleteCategory(c)}
                          disabled={saving}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-zinc-500" colSpan={6}>
                      暂无数据
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="text-sm font-semibold text-zinc-900">门店信息</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label="门店名称">
              <input
                className={inputCls}
                value={settings?.shopName || ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, shopName: e.target.value } : s))}
              />
            </Field>
            <Field label="联系电话">
              <input
                className={inputCls}
                value={settings?.phone || ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, phone: e.target.value } : s))}
              />
            </Field>
            <Field label="微信号">
              <input
                className={inputCls}
                value={settings?.wechatId || ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, wechatId: e.target.value } : s))}
              />
            </Field>
            <Field label="地址">
              <input
                className={inputCls}
                value={settings?.address || ''}
                onChange={(e) => setSettings((s) => (s ? { ...s, address: e.target.value } : s))}
              />
            </Field>
            <Field label="纬度">
              <input
                className={inputCls}
                inputMode="decimal"
                value={settings?.latitude === null || !settings ? '' : String(settings.latitude)}
                onChange={(e) =>
                  setSettings((s) => {
                    if (!s) return s
                    const v = e.target.value.trim()
                    return { ...s, latitude: v ? Number(v) : null }
                  })
                }
              />
            </Field>
            <Field label="经度">
              <input
                className={inputCls}
                inputMode="decimal"
                value={settings?.longitude === null || !settings ? '' : String(settings.longitude)}
                onChange={(e) =>
                  setSettings((s) => {
                    if (!s) return s
                    const v = e.target.value.trim()
                    return { ...s, longitude: v ? Number(v) : null }
                  })
                }
              />
            </Field>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="text-sm font-semibold text-zinc-900">首页文案</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Field label="首页顶部标题（导航栏）">
                <input
                  className={inputCls}
                  placeholder="例如：XX家居（留空则不显示）"
                  value={settings?.homeNavTitle || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeNavTitle: e.target.value } : s))}
                />
              </Field>
              <Field label="搜索框占位文案">
                <input
                  className={inputCls}
                  value={settings?.homeSearchPlaceholder || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeSearchPlaceholder: e.target.value } : s))}
                />
              </Field>
              <Field label="案例区标题">
                <input
                  className={inputCls}
                  value={settings?.homeCaseTitle || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeCaseTitle: e.target.value } : s))}
                />
              </Field>
              <Field label="案例区副标题">
                <input
                  className={inputCls}
                  value={settings?.homeCaseSubTitle || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeCaseSubTitle: e.target.value } : s))}
                />
              </Field>
              <Field label="设计效果图区标题">
                <input
                  className={inputCls}
                  value={settings?.homeDesignTitle || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeDesignTitle: e.target.value } : s))}
                />
              </Field>
              <Field label="设计效果图区副标题">
                <input
                  className={inputCls}
                  value={settings?.homeDesignSubTitle || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeDesignSubTitle: e.target.value } : s))}
                />
              </Field>
              <Field label="商品区标题">
                <input
                  className={inputCls}
                  value={settings?.homeProductsTitle || ''}
                  onChange={(e) => setSettings((s) => (s ? { ...s, homeProductsTitle: e.target.value } : s))}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">{settings?.updatedAt ? `最后更新：${new Date(settings.updatedAt).toLocaleString()}` : ''}</div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              onClick={submitSettings}
              disabled={!settings || saving}
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      )}

      <Modal
        open={open}
        title={editing ? '编辑分类' : '新建分类'}
        onClose={() => {
          if (saving) return
          setOpen(false)
        }}
        width="max-w-xl"
      >
        <div className="grid gap-4">
          <Field label="分类名称（必填）">
            <input
              className={inputCls}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="图标（emoji，可选）">
              <input
                className={inputCls}
                value={draft.icon}
                onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
              />
            </Field>
            <Field label="排序（数字，可选）">
              <input
                className={inputCls}
                inputMode="numeric"
                value={draft.sort === null ? '' : String(draft.sort)}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  setDraft((d) => ({ ...d, sort: v ? Number(v) : null }))
                }}
              />
            </Field>
          </div>
          <Field label="状态">
            <select
              className={inputCls}
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as 'enabled' | 'disabled' }))}
            >
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
          </Field>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              onClick={submitCategory}
              disabled={saving || !String(draft.name || '').trim()}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
