import type { ReactNode } from 'react'

interface SubSidebarSectionProps {
  title?: string
  children: ReactNode
}

const SubSidebarSection = ({ title, children }: SubSidebarSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      {title && (
        <h3 className="px-3 text-[13px] font-bold text-slate-400">{title}</h3>
      )}
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  )
}

export default SubSidebarSection
