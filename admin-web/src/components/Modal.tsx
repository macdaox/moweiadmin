import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({
  open,
  title,
  children,
  onClose,
  width = 'max-w-2xl'
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        className={cn('w-full rounded-xl bg-white shadow-xl', width)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

