import { Link, useLocation } from 'react-router-dom'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Cloud,
  FileText,
  GraduationCap,
  Kanban,
  List,
  ListChecks,
  Mail,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Video,
  type LucideIcon,
} from 'lucide-react'
import Button from '../../common/button/Button'
import ModuleNavItem from './ModuleNavItem'
import SubSidebarActionButton from './SubSidebarActionButton'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'

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

const subMenuItems: MenuItem[] = [
  { icon: List, label: '프로젝트 목록', path: '/project/list' },
  { icon: ClipboardList, label: '업무', path: '/project/tasks' },
  { icon: ListChecks, label: '해야할 일', path: '/project/todo' },
  { icon: Clock, label: '진행 중', path: '/project/progress' },
  { icon: Search, label: '검토 중', path: '/project/review' },
  { icon: Check, label: '완료', path: '/project/done' },
  { icon: Sparkles, label: '프로젝트 AI', path: '/project/ai' },
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
      <aside className="flex h-screen w-24 flex-shrink-0 flex-col justify-between bg-[#0d1527] px-2 py-5 text-white">
        <div className="flex w-full flex-col items-center">
          <Link
            to="/"
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

      <aside
        className={`relative h-full flex-shrink-0 border-r border-slate-100 bg-[#f8fafc] transition-all duration-300 ease-in-out ${
          isSubOpen
            ? 'w-72 p-6 opacity-100'
            : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'
        }`}
      >
        <div className="flex h-full w-full flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">업무 관리</h2>
          </div>

          <div className="flex flex-col gap-2.5">
            <SubSidebarActionButton variant="primary">
              업무 추가
            </SubSidebarActionButton>
            <SubSidebarActionButton>프로젝트 생성</SubSidebarActionButton>
          </div>

          <SubSidebarSection title="프로젝트">
            {subMenuItems.map((item) => (
              <SubSidebarMenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                active={location.pathname.startsWith(item.path)}
              />
            ))}
          </SubSidebarSection>
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
        <div className="absolute left-24 top-6 z-50">
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
