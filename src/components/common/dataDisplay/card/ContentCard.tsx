import type { ReactNode } from 'react'

interface ContentCardProps {
  title: string
  description?: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

const ContentCard = ({
  title,
  description,
  children,
  actions,
  className = '',
}: ContentCardProps) => {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-shrink-0 gap-2">{actions}</div>}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}

export default ContentCard
