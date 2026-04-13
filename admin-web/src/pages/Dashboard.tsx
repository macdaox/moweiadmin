import { useEffect, useState } from 'react'
import { adminStats } from '@/api/admin'
import { useAuth } from '@/store/auth'
import type { AdminStats } from '@/api/types'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="group rounded-2xl border border-zinc-200 bg-white p-4 hover:border-zinc-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{value}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const token = useAuth((s) => s.token)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!token) return
      try {
        const r = await adminStats(token)
        if (mounted) setStats(r)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : '加载失败')
      }
    })()
    return () => {
      mounted = false
    }
  }, [token])

  return (
    <div>
      <div className="mb-5">
        <div className="text-lg font-semibold text-zinc-900">控制台</div>
        <div className="mt-1 text-sm text-zinc-500">概览与快捷入口</div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="商品" value={stats ? stats.products : 0} to="/content?type=products" />
        <StatCard label="案例" value={stats ? stats.cases : 0} to="/content?type=cases" />
        <StatCard label="动态" value={stats ? stats.posts : 0} to="/content?type=posts" />
        <StatCard label="门店名片" value={stats ? stats.storeCards : 0} to="/content?type=storeCards" />
        <StatCard label="名片线索" value={stats ? stats.leads : 0} to="/leads" />
      </div>
    </div>
  )
}

