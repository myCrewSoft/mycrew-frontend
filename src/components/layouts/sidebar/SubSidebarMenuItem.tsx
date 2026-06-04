import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface SubSidebarMenuItemProps {
  icon?: LucideIcon
  label: string
  path: string
  active?: boolean
}

const SubSidebarMenuItem = ({
  icon: Icon,
  label,
  path,
  active = false,
}: SubSidebarMenuItemProps) => {
  return (
    <Link
      to={path}
      className={`flex h-12 items-center gap-3.5 rounded-2xl px-4 text-[15px] font-semibold no-underline transition-colors ${
        active
          ? 'bg-blue-200 text-blue-700'
          : 'text-slate-600 hover:bg-blue-100 hover:text-slate-900'
      }`}
    >
      {Icon && <Icon size={18} />}
      <span className="truncate">{label}</span>
    </Link>
  )
}

export default SubSidebarMenuItem
