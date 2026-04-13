import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8">
      <div className="text-lg font-semibold text-zinc-900">页面不存在</div>
      <div className="mt-2 text-sm text-zinc-500">你访问的页面不存在或已被移动。</div>
      <Link to="/" className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
        回到控制台
      </Link>
    </div>
  )
}

