import {
  CalendarClock,
  List,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../common/button/Button'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'

const navigationGroups = [
  {
    title: '회의 목록',
    icon: List,
    items: [
      { label: '예약된 회의', path: '/meeting/scheduled' },
      { label: '진행 중인 회의', path: '/meeting/list' },
      { label: '지난 회의', path: '/meeting/history' },
    ],
  },
]

const MeetingSubSidebarContent = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = `${location.pathname}${location.search}`

  const isNavigationActive = (path: string) => {
    if (path.includes('?')) return currentPath.startsWith(path)

    return location.pathname === path
  }

  const openSchedulePanel = () => {
    // 예약 폼도 MeetingPage의 슬라이드 오버 패널을 재사용합니다.
    navigate('/meeting/scheduled?action=reserve')
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">회의</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          온라인과 오프라인 회의를 관리합니다.
        </p>
      </div>

      <section className="flex flex-col gap-2.5">
        <Button
          variant="outline"
          leftIcon={<CalendarClock size={15} />}
          onClick={openSchedulePanel}
          className="h-11 w-full px-3 text-sm"
        >
          예약
        </Button>
      </section>

      <nav className="[&_section]:gap-2 [&_section>div]:gap-1">
        {navigationGroups.map((group) => {
          const GroupIcon = group.icon

          return (
            <SubSidebarSection key={group.title} title={group.title}>
              {group.items.map((item) => {
                const active = isNavigationActive(item.path)

                return (
                  <SubSidebarMenuItem
                    key={item.path}
                    icon={GroupIcon}
                    label={item.label}
                    path={item.path}
                    active={active}
                  />
                )
              })}
            </SubSidebarSection>
          )
        })}
      </nav>
    </div>
  )
}

export default MeetingSubSidebarContent
