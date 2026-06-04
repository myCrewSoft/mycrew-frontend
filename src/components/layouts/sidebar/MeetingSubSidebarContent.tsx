import {
  CalendarClock,
  ChevronRight,
  FileText,
  List,
  Play,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../common/button/Button'
import Badge from '../../common/dataDisplay/badge/Badge'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'

const upcomingMeetings = [
  {
    id: 1002,
    title: '신규 기능 기획 논의',
    time: '오늘 16:30',
    participants: 4,
    status: '예약됨',
  },
  {
    id: 1003,
    title: '월간 전사 회의',
    time: '내일 10:00',
    participants: 12,
    status: '예약됨',
  },
]

const pendingMinutes = [
  {
    id: 1001,
    title: 'Q2 개발팀 스프린트 리뷰',
    status: '결재 대기',
    count: '2명 남음',
  },
  {
    id: 1005,
    title: '인사팀 면접 조율 미팅',
    status: '초안',
    count: '요청 전',
  },
]

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

  const openInstantMeeting = () => {
    // 실제 즉시 회의 생성 로직은 MeetingPage가 query string을 읽어 처리합니다.
    navigate('/meeting/list?action=instant')
  }

  const openSchedulePanel = () => {
    // 예약 폼도 MeetingPage의 슬라이드 오버 패널을 재사용합니다.
    navigate('/meeting/scheduled?action=reserve')
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">화상회의</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          회의 일정과 회의록 상태를 빠르게 확인합니다.
        </p>
      </div>

      <section className="flex flex-col gap-2.5">
        <Button
          leftIcon={<Play size={15} />}
          onClick={openInstantMeeting}
          className="h-11 w-full px-3 text-sm"
        >
          바로 시작
        </Button>
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <CalendarClock size={15} />
            </span>
            <h3 className="text-sm font-bold text-slate-950">다가오는 회의</h3>
          </div>
          <Badge variant="outline">{upcomingMeetings.length}건</Badge>
        </div>

        <div className="flex flex-col gap-2">
          {upcomingMeetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => navigate(`/meeting/scheduled?detailMeetingId=${meeting.id}`)}
              title={meeting.title}
              className="group rounded-lg border border-slate-100 bg-white px-3 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {meeting.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={13} />
                      {meeting.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} />
                      {meeting.participants}명
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="flex-shrink-0 text-slate-300 transition-colors group-hover:text-blue-600"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <FileText size={15} />
            </span>
            <h3 className="text-sm font-bold text-slate-950">
              결재 대기 회의록
            </h3>
          </div>
          <Badge variant="warning">{pendingMinutes.length}건</Badge>
        </div>

        <div className="flex flex-col gap-2">
          {pendingMinutes.map((minutes) => (
            <button
              key={minutes.id}
              type="button"
              onClick={() => navigate(`/meeting/minutes?minutesMeetingId=${minutes.id}`)}
              title={minutes.title}
              className="group rounded-lg border border-slate-100 bg-white px-3 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {minutes.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-700">
                      {minutes.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ·
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {minutes.count}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="flex-shrink-0 text-slate-300 transition-colors group-hover:text-blue-600"
                />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default MeetingSubSidebarContent
