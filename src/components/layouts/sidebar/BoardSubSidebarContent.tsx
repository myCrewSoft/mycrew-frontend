import { Building2, Megaphone, MessageSquare, ShieldQuestion } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const boardMenus = [
  {
    icon: Megaphone,
    label: '공지사항',
    path: '/board/notices',
    activeClassName: 'bg-white text-red-500 shadow-sm',
  },
  {
    icon: Building2,
    label: '부서게시판',
    path: '/board/departments',
    activeClassName: 'bg-white text-blue-600 shadow-sm',
  },
  {
    icon: MessageSquare,
    label: '자유게시판',
    path: '/board/free',
    activeClassName: 'bg-white text-emerald-600 shadow-sm',
  },
  {
    icon: ShieldQuestion,
    label: '익명게시판',
    path: '/board/anonymous',
    activeClassName: 'bg-white text-violet-600 shadow-sm',
  },
]

const BoardSubSidebarContent = () => {
  return (
    <div className="flex h-full w-full flex-col bg-[#0d2a4d] px-4 py-8 text-white">
      <h2 className="mb-7 px-2 text-xl font-bold">게시판</h2>

      <nav className="flex flex-col gap-2">
        {boardMenus.map((menu) => {
          const Icon = menu.icon

          return (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold no-underline transition-colors ${
                  isActive
                    ? menu.activeClassName
                    : 'text-slate-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{menu.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default BoardSubSidebarContent
