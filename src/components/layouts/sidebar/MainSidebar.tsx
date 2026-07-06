import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import ModuleNavItem from './ModuleNavItem'
import { adminMenuItem, menuItems } from './sidebar.config'

const MainSidebar = () => {
  const location = useLocation()

  return (
    <aside className="flex h-screen w-24 flex-shrink-0 flex-col justify-between bg-[#0d1527] px-2 py-5 text-white">
      <div className="flex w-full flex-col items-center">
        <Link
          to="/dashboard"
          className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#5ac8fa] text-3xl font-black text-white no-underline shadow-md transition-transform hover:scale-105"
        >
          M
        </Link>

        <nav className="flex w-full flex-col gap-1">
          {menuItems.map((item) => (
            <ModuleNavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname.startsWith(item.path)}
            />
          ))}
        </nav>
      </div>

      <div className="w-full">
        <Link
          to={adminMenuItem.path}
          className={`flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
            location.pathname.startsWith(adminMenuItem.path)
              ? 'bg-gradient-to-r from-[#2563eb] to-[#5ac8fa] font-bold text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck size={24} />
          <span className="text-[11px] font-semibold leading-none tracking-tight">
            {adminMenuItem.label}
          </span>
        </Link>
      </div>
    </aside>
  )
}

export default MainSidebar
