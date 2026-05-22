import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface ModuleNavItemProps {
  icon: LucideIcon
  label: string
  path: string
  active?: boolean
}

const ModuleNavItem = ({
  icon: Icon,
  label,
  path,
  active = false,
}: ModuleNavItemProps) => {
  return (
    <Link
      to={path}
      className={`flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#2563eb] to-[#5ac8fa] font-bold text-white shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={24} />
      <span className="text-[11px] font-semibold leading-none tracking-tight">
        {label}
      </span>
    </Link>
  )
}

export default ModuleNavItem
