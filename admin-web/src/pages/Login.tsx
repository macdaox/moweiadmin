import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '@/api/admin'
import { useAuth } from '@/store/auth'
import { Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setAuth = useAuth((s) => s.setAuth)
  const token = useAuth((s) => s.token)
  const nav = useNavigate()

  const canSubmit = useMemo(() => !!email.trim() && !!password, [email, password])

  useEffect(() => {
    if (token) nav('/', { replace: true })
  }, [token, nav])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-semibold text-zinc-900">后台登录</div>
              <div className="text-xs text-zinc-500">登录后管理内容与线索</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-medium text-zinc-700">邮箱</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                type="email"
                autoComplete="username"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">密码</div>
              <input
                className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

            <button
              type="button"
              disabled={!canSubmit || loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={async () => {
                setError('')
                setLoading(true)
                try {
                  const r = await adminLogin({ email, password })
                  setAuth(r.token, r.email)
                  nav('/', { replace: true })
                } catch (e) {
                  setError(e instanceof Error ? e.message : '登录失败')
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="text-xs text-zinc-500">默认开发账号：admin@example.com / admin123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
