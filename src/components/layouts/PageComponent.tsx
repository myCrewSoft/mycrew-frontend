import type { ReactNode } from 'react'

interface PageComponentProps {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}

const PageComponent = ({
  title,
  description,
  actions,
  children,
}: PageComponentProps) => {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>

          {description && (
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-shrink-0 flex-wrap gap-2 md:justify-end">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="border-t border-slate-100 px-6 py-5">
          {children}
        </div>
      )}
    </section>
  )
}

export default PageComponent
