/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../common/button/Button'
import ApprovalSubSidebarContent from './ApprovalSubSidebarContent'
import CalendarSubSidebarContent from './CalendarSubSidebarContent'
import MeetingSubSidebarContent from './MeetingSubSidebarContent'
import ReservationSubSidebarContent from './ReservationSubSidebarContent'
import AttendanceSubSidebarContent from './AttendanceSubSidebarContent'
import MailSubSidebarContent from './MailSubSidebarContent'
import SubSidebarActionButton from './SubSidebarActionButton'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'
import { getSidebarKey, subSidebarConfigs } from './sidebar.config'
import { useBoardSidebar } from '../../../hooks/useBoardSidebar'
import mergeBoardSections from '../../../utils/boardMenuUtil'
import DriveSubSidebarContent from './DriveSubSidebarContent'
import EducationSubSidebarContent from './EducationSubSidebarContent'
import ProjectSubSidebarContent from './ProjectSubSideBarContent'
import MyPageSubSidebarContent from './MyPageSubSidebarContent'

interface SubSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const isPathActive = (pathname: string, itemPath: string) =>
  pathname === itemPath || pathname.startsWith(`${itemPath}/`)

const isMenuActive = (pathname: string, search: string, item: any) =>
  item.activeKey
    ? `${pathname}${search}` === item.activeKey
    : isPathActive(pathname, item.path)

const getBoardCreatePath = (pathname: string) => {
  const departmentMatch = pathname.match(/^\/boards\/dept\/([^/]+)/)

  if (departmentMatch) {
    return `/boards/dept/${departmentMatch[1]}?mode=create`
  }

  if (pathname.startsWith('/boards/departments')) {
    return '/boards/departments?mode=create'
  }

  if (pathname.startsWith('/boards/free')) {
    return '/boards/free?mode=create'
  }

  if (
    pathname.startsWith('/boards/anonymous') ||
    pathname.startsWith('/boards/anon')
  ) {
    return '/boards/anonymous?mode=create'
  }

  return '/boards/notices?mode=create'
}

// 특정 메뉴에서 기본 메뉴 목록이 아니라 전용 UI를 보여주고 싶을 때 사용하는 매핑입니다.
// 추가할 경우 아래와 동일하게 추가할 것
// 예: /calendar 경로에서는 CalendarSubSidebarContent를 렌더링합니다.
const customSidebarContentMap: Record<string, ComponentType> = {
  mail: MailSubSidebarContent,
  approval: ApprovalSubSidebarContent,
  calendar: CalendarSubSidebarContent,
  meeting: MeetingSubSidebarContent,
  reservations: ReservationSubSidebarContent,
  drive: DriveSubSidebarContent,
  attendance: AttendanceSubSidebarContent,
  project: ProjectSubSidebarContent,
  education: EducationSubSidebarContent,
  mypage: MyPageSubSidebarContent,
}

const hiddenSubSidebarKeys = new Set(['organization'])

const SubSidebar = ({ isOpen, onToggle }: SubSidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()

  // 현재 URL의 첫 번째 경로를 기준으로 어떤 서브사이드바를 보여줄지 결정합니다.
  // 예: /calendar/my → calendar, /project/list → project
  const sidebarKey = getSidebarKey(location.pathname)

  // 현재 경로에 맞는 기본 설정을 가져옵니다.
  // 설정이 없으면 undefined가 됩니다.
  const sidebarConfig = subSidebarConfigs[sidebarKey]

  // 현재 경로에 맞는 전용 서브사이드바 컴포넌트가 있는지 확인합니다.
  const CustomSidebarContent = customSidebarContentMap[sidebarKey]

 const {boardMenuItems} =useBoardSidebar(sidebarKey)

  if (hiddenSubSidebarKeys.has(sidebarKey)) {
    return null
  }

  const handleActionClick = (actionLabel: string) => {
    if (sidebarKey === 'board' && actionLabel.includes('글')) {
      navigate(getBoardCreatePath(location.pathname))
    }
  }

  // 전용 컴포넌트도 없고 기본 설정도 없으면 서브사이드바와 여닫기 버튼 렌더링 X
  if (!CustomSidebarContent && !sidebarConfig) {
    return null
  }
  const getMergedSections =()=>{
    const baseSections = sidebarConfig ?[...sidebarConfig.sections] :[]

   if (sidebarKey === 'board') {
      return mergeBoardSections(baseSections, boardMenuItems )
    }
    return baseSections
  }
  return (
    <div
      className={`relative h-full flex-shrink-0 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-72' : 'w-0'
      }`}
    >
      <aside
        className={`h-full border-r border-slate-100 bg-[#f8fafc] transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-full p-6 opacity-100'
            : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'
        }`}
      >
        {/* 전용 서브사이드바가 있으면 전용 컴포넌트를 보여줍니다. */}
        {CustomSidebarContent ? (
          <CustomSidebarContent />
        ) : (
          // 전용 컴포넌트가 없으면 sidebar.config.ts 기반으로 기본 메뉴형 서브사이드바를 보여줍니다.
          <div className="flex h-full w-full flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                {sidebarConfig.title}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {sidebarConfig.actions.map((action) => (
                <SubSidebarActionButton
                  key={action.label}
                  variant={action.variant}
                  onClick={() => handleActionClick(action.label)}
                >
                  {action.label}
                </SubSidebarActionButton>
              ))}
            </div>

            {getMergedSections().map((section:any) => (
              <SubSidebarSection key={section.title} title={section.title}>
                {section.items.map((item:any) => (
                  <SubSidebarMenuItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    children={item.children}
                    active={
                      isMenuActive(location.pathname, location.search, item) ||
                      item.children?.some((child: any) =>
                        isMenuActive(location.pathname, location.search, child),
                      )
                    }
                  />
                ))}
              </SubSidebarSection>
            ))}
          </div>
        )}

      </aside>

      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="absolute left-full top-6 z-50 min-w-0 -translate-x-1/2 rounded-full border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600"
        leftIcon={
          isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
        }
        aria-label={isOpen ? '서브 사이드바 닫기' : '서브 사이드바 열기'}
      />
    </div>
  )
}

export default SubSidebar
