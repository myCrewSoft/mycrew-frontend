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
      className={`flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl no-underline transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-[#2563eb] to-[#5ac8fa] font-bold text-white shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="origin-center scale-90 text-[9px] tracking-tight">
        {label}
      </span>
    </Link>
  )
}

export default ModuleNavItem
