import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}

const EmptyState = ({
  title,
  description,
  icon = <CircleAlert size={22} />,
  actions,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </div>
      <h2 className="mt-4 text-sm font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
      {actions && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

export default EmptyState
