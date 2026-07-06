import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import type { ReactNode } from 'react'
import IconButton from '../button/IconButton'
import type { ToastItem, ToastVariant } from './toast.types'

interface ToastViewportProps {
  items: ToastItem[]
  onClose: (id: string) => void
}

const variantStyle: Record<ToastVariant, string> = {
  info: 'border-blue-100 text-blue-600',
  success: 'border-emerald-100 text-emerald-600',
  danger: 'border-red-100 text-red-500',
}

const iconMap: Record<ToastVariant, ReactNode> = {
  info: <Info size={18} />,
  success: <CircleCheck size={18} />,
  danger: <CircleAlert size={18} />,
}

const ToastViewport = ({ items, onClose }: ToastViewportProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-3">
      {items.map((item) => {
        const variant = item.variant ?? 'info'

        return (
          <div
            key={item.id}
            className={`flex gap-3 rounded-xl border bg-white p-4 shadow-xl ${variantStyle[variant]}`}
          >
            <div className="mt-0.5">{iconMap[variant]}</div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>

              {item.description && (
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {item.description}
                </p>
              )}
            </div>

            <IconButton
              size="sm"
              aria-label="토스트 닫기"
              onClick={() => onClose(item.id)}
              className="border-0 shadow-none"
            >
              <X size={16} />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}

export default ToastViewport