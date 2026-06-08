/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SubSidebarMenuItemProps {
  icon?: LucideIcon
  label: string
  path: string
  active?: boolean
  children?: any[]
}

const isPathActive = (pathname: string, itemPath: string) =>
  pathname === itemPath || pathname.startsWith(`${itemPath}/`)

const isMenuActive = (pathname: string, search: string, item: any) =>
  item.activeKey
    ? `${pathname}${search}` === item.activeKey
    : isPathActive(pathname, item.path)

const SubSidebarMenuItem = ({
  icon: Icon,
  label,
  path,
  active = false,
  children,
}: SubSidebarMenuItemProps) => {
  const location = useLocation()
  const hasChildren = Boolean(children?.length)
  const hasActiveChild = children?.some((child) =>
    isMenuActive(location.pathname, location.search, child),
  )
  const [isExpandedByUser, setIsExpandedByUser] = useState(false)
  const isExpanded = Boolean(hasActiveChild || isExpandedByUser)

  return (
    <div className="flex flex-col gap-1">
      {hasChildren ? (
        <button
          type="button"
          onClick={() => setIsExpandedByUser((current) => !current)}
          className={`flex h-12 w-full items-center gap-3.5 rounded-2xl px-4 text-left text-[15px] font-semibold transition-colors ${
            active
              ? 'bg-blue-200 text-blue-700'
              : 'text-slate-600 hover:bg-blue-100 hover:text-slate-900'
          }`}
        >
          {Icon && <Icon size={18} />}
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
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
      )}

      {hasChildren && isExpanded && (
        <div className="ml-6 flex flex-col gap-1">
          {children!.map((child) => {
            const isChildActive =
              isMenuActive(location.pathname, location.search, child)

            return (
              <Link
                key={child.activeKey ?? child.path}
                to={child.activeKey ?? child.path}
                className={`flex h-10 items-center rounded-xl px-3 text-sm font-medium no-underline transition-colors ${
                  isChildActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SubSidebarMenuItem
