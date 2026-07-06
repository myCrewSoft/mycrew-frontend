import type { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
  actions?: ReactNode
}

const FilterBar = ({ children, actions }: FilterBarProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap gap-3">{children}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export default FilterBar
