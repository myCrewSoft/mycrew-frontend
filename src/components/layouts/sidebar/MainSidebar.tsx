import { Link, useLocation } from 'react-router-dom'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Cloud,
  FileText,
  GraduationCap,
  Kanban,
  Mail,
  Network,
  ShieldCheck,
  Video,
  type LucideIcon,
} from 'lucide-react'
import ModuleNavItem from './ModuleNavItem'
import Button from '../../common/button/Button'

interface MenuItem {
  icon: LucideIcon
  label: string
  path: string
}

interface MainSidebarProps {
  isSubOpen: boolean
  onToggleSub: () => void
  onOpenSub: () => void
}

const menuItems: MenuItem[] = [
  { icon: Mail, label: '메일', path: '/mail' },
  { icon: FileText, label: '전자결재', path: '/approval' },
  { icon: Cloud, label: '드라이브', path: '/drive' },
  { icon: Kanban, label: '프로젝트', path: '/project' },
  { icon: Video, label: '회의', path: '/meeting' },
  { icon: Clock, label: '근태', path: '/attendance' },
  { icon: Calendar, label: '일정', path: '/calendar' },
  { icon: GraduationCap, label: '교육', path: '/education' },
  { icon: Network, label: '조직관리', path: '/organization' },
  { icon: ClipboardList, label: '게시판', path: '/board' },
]

const adminMenuItem: MenuItem = {
  icon: ShieldCheck,
  label: '관리자',
  path: '/admin',
}

const MainSidebar = ({
  isSubOpen,
  onToggleSub,
  onOpenSub,
}: MainSidebarProps) => {
  const location = useLocation()

  return (
    <>
      <aside className="flex h-screen w-16 flex-shrink-0 flex-col justify-between bg-[#0d1527] py-4 text-white">
        <div className="flex w-full flex-col items-center">
          <Link
            to="/"
            className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#5ac8fa] text-xl font-black text-white no-underline shadow-md transition-transform hover:scale-105"
          >
            M
          </Link>

          <nav className="flex w-full flex-col gap-1 px-1">
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

        <div className="w-full px-1">
          <Link
            to={adminMenuItem.path}
            className={`flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl no-underline transition-all duration-200 ${
              location.pathname.startsWith(adminMenuItem.path)
                ? 'bg-gradient-to-r from-[#2563eb] to-[#5ac8fa] font-bold text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} />
            <span className="origin-center scale-90 text-[9px] tracking-tight">
              {adminMenuItem.label}
            </span>
          </Link>
        </div>
      </aside>

      <aside
        className={`relative h-full flex-shrink-0 border-r border-slate-100 bg-[#f8fafc] transition-all duration-300 ease-in-out ${
          isSubOpen
            ? 'w-52 p-4 opacity-100'
            : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'
        }`}
      >
        <div className="w-44">
          <h2 className="mb-4 text-xl font-bold">안녕하세요</h2>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSub}
          className="absolute -right-3 top-6 z-50 min-w-0 border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600"
          leftIcon={
            isSubOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
          }
          aria-label={isSubOpen ? '서브 사이드바 닫기' : '서브 사이드바 열기'}
        />
      </aside>

      {!isSubOpen && (
        <div className="absolute left-16 top-6 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenSub}
            className="min-w-0 rounded-l-none rounded-r-md border-l-0 border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600"
            leftIcon={<ChevronRight size={14} />}
            aria-label="서브 사이드바 열기"
          />
        </div>
      )}
    </>
  )
}

export default MainSidebar
