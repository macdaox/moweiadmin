import type { ContentType } from '@/api/types'
import { cn } from '@/lib/utils'

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg px-3 py-2 text-sm',
        active ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function ContentTabs({ type, onChange }: { type: ContentType; onChange: (t: ContentType) => void }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Tab active={type === 'products'} label="商品" onClick={() => onChange('products')} />
      <Tab active={type === 'cases'} label="案例" onClick={() => onChange('cases')} />
      <Tab active={type === 'designs'} label="效果图" onClick={() => onChange('designs')} />
      <Tab active={type === 'posts'} label="动态" onClick={() => onChange('posts')} />
      <Tab active={type === 'storeCards'} label="门店名片" onClick={() => onChange('storeCards')} />
    </div>
  )
}
