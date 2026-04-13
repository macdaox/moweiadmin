import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ListChecks, NotebookPen, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '@/store/auth'

function Item({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
          isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
        )
      }
    >
      <span className="h-4 w-4">{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export default function AppShell() {
  const { email, clear } = useAuth()
  const nav = useNavigate()
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="w-64 border-r border-zinc-200 bg-white p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold text-zinc-900">后台管理</div>
            <div className="text-xs text-zinc-500">商品 / 案例 / 动态 / 名片 / 线索</div>
          </div>
          <nav className="space-y-1">
            <Item to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="控制台" />
            <Item to="/content" icon={<NotebookPen className="h-4 w-4" />} label="内容管理" />
            <Item to="/leads" icon={<ListChecks className="h-4 w-4" />} label="线索管理" />
            <Item to="/settings" icon={<SettingsIcon className="h-4 w-4" />} label="基础设置" />
          </nav>
          <div className="mt-6 rounded-lg border border-zinc-200 p-3">
            <div className="text-xs text-zinc-500">当前账号</div>
            <div className="mt-1 truncate text-sm text-zinc-900">{email || '-'}</div>
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                clear()
                nav('/login', { replace: true })
              }}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
