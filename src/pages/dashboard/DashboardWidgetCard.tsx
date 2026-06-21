import {
  Bell,
  ChevronRight,
  GripVertical,
  Mail,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { useNavigate, type NavigateFunction } from 'react-router-dom'
import type {
  AdminAttendanceWidgetItem,
  AdminAttendanceWidgetResponseDto,
  AdminImportantScheduleWidgetItem,
  AdminImportantScheduleWidgetResponseDto,
  AdminNoticeWidgetResponseDto,
  AdminProjectStatusWidgetResponseDto,
  DashboardBoardType,
  DashboardVariant,
  DashboardWidgetKey,
} from '../../types/dashboard'
import { DASHBOARD_WIDGET_CONFIG_MAP } from './dashboard.config'
import type {
  AttendanceWidgetResponse as AttendanceWidgetResponseDto,
  ScheduleWidgetResponse,
} from '../../types'
import type {
  DashboardWidgetResponseMap,
  DashboardWidgetStateMap,
} from '../../types/dashboard-widget'

interface DashboardWidgetCardProps {
  widgetKey: DashboardWidgetKey
  widgetState?: DashboardWidgetStateMap[DashboardWidgetKey]
  boardType: DashboardBoardType
  editMode: boolean
  variant?: DashboardVariant
  onRemove: (widgetKey: DashboardWidgetKey) => void
  onBoardTypeChange: (boardType: DashboardBoardType) => void
}

// 관리자 변형(variant='admin')에서 위젯 헤더에 표시할 제목 오버라이드
const adminWidgetTitle: Partial<Record<DashboardWidgetKey, string>> = {
  attendance: '사원 근태 현황',
  todaySchedule: '중요 일정',
  projectProgress: '프로젝트 현황',
  board: '공지사항',
}

// 관리자 근태 상태 코드 → 뱃지 색상
const attendanceStatusTone: Record<string, 'amber' | 'red' | 'slate'> = {
  LATE: 'amber',
  EARLY: 'amber',
  ABSENT: 'red',
}

interface ListRowProps {
  title: string
  meta?: string
  badge?: string
  badgeTone?: 'blue' | 'green' | 'amber' | 'red' | 'slate'
  leading?: 'dot' | 'checkbox'
  trailing?: string
  onClick?: () => void
}

interface ApprovalWidgetDocumentItem {
  id: number
  title: string
  requesterName: string
  requestedAt: string
  dday: string
}

type ScheduleWidgetItem = ScheduleWidgetResponse['schedules'][number]
type NotificationWidgetItem =
  DashboardWidgetResponseMap['notification']['notifications'][number]

const statusLabel: Record<string, string> = {
  beforeWork: '출근 전',
  working: '근무 중',
  afterWork: '퇴근',
  vacation: '휴가',
  off: '퇴근',
  absent: '미출근',
}

const boardTabs: { value: DashboardBoardType; label: string }[] = [
  { value: 'NOTICE', label: '공지' },
  { value: 'DEPT', label: '부서' },
  { value: 'PROJ', label: '프로젝트' },
]

const badgeToneStyle: Record<NonNullable<ListRowProps['badgeTone']>, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-rose-50 text-rose-600 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const widgetHeaderBadgeToneStyle: Record<NonNullable<ListRowProps['badgeTone']>, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-rose-50 text-rose-600 ring-rose-100',
  slate: 'bg-slate-50 text-slate-600 ring-slate-200',
}

interface WidgetHeaderBadgeData {
  label: string
  value: number
  tone?: NonNullable<ListRowProps['badgeTone']>
}

const isAdminDashboard = (variant: DashboardVariant): boolean => variant === 'admin'

const formatMinutes = (minutes = 0) => {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${hour}시간 ${String(minute).padStart(2, '0')}분`
}

const getAttendanceStatus = (status: AttendanceWidgetResponseDto['status']) =>
  statusLabel[status] ?? status ?? '-'

const getScheduleTarget = (
  schedule: DashboardWidgetResponseMap['todaySchedule']['schedules'][number],
) => {
  if (schedule.scheduleTypeCode === 'C004') return schedule.deptNm
  if (schedule.scheduleTypeCode === 'C005') return schedule.projNm
  if (schedule.scheduleTypeCode === 'C006') return schedule.taskNm
  return ''
}

const WidgetHeaderBadge = ({
  label,
  value,
  tone = 'blue',
}: WidgetHeaderBadgeData) => (
  <span
    className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-black ring-1 ${widgetHeaderBadgeToneStyle[tone]}`}
  >
    <span>{label}</span>
    <strong className="tabular-nums">{value}</strong>
  </span>
)

const getWidgetHeaderBadge = (
  widgetKey: DashboardWidgetKey,
  widgetState: DashboardWidgetStateMap[DashboardWidgetKey] | undefined,
  variant: DashboardVariant,
): WidgetHeaderBadgeData | null => {
  const data = widgetState?.data
  if (!data) return null
  if (isAdminDashboard(variant)) return null

  if (variant === 'admin') {
    switch (widgetKey) {
      case 'attendance': {
        const adminData = data as unknown as AdminAttendanceWidgetResponseDto
        return { label: '특이', value: adminData.count, tone: 'amber' }
      }
      case 'todaySchedule': {
        const adminData = data as unknown as AdminImportantScheduleWidgetResponseDto
        return { label: '일정', value: adminData.schedules.length, tone: 'green' }
      }
      case 'projectProgress': {
        const adminData = data as unknown as AdminProjectStatusWidgetResponseDto
        return { label: '전체', value: adminData.totalCount, tone: 'blue' }
      }
      case 'board': {
        const adminData = data as unknown as AdminNoticeWidgetResponseDto
        return { label: '공지', value: adminData.notices.length, tone: 'blue' }
      }
      default:
        break
    }
  }

  switch (widgetKey) {
    case 'approval': {
      const approvalData = data as DashboardWidgetResponseMap['approval']
      return { label: '대기', value: approvalData.pendingCount, tone: 'amber' }
    }
    case 'todaySchedule': {
      const scheduleData = data as DashboardWidgetResponseMap['todaySchedule']
      return { label: '일정', value: scheduleData.schedules.length, tone: 'green' }
    }
    case 'meeting': {
      const meetingData = data as DashboardWidgetResponseMap['meeting']
      return { label: '회의', value: meetingData.meetings.length, tone: 'green' }
    }
    case 'reservation': {
      const reservationData = data as DashboardWidgetResponseMap['reservation']
      return { label: '예약', value: reservationData.reservations.length, tone: 'green' }
    }
    case 'task': {
      const taskData = data as DashboardWidgetResponseMap['task']
      return { label: '업무', value: taskData.tasks.length, tone: 'slate' }
    }
    case 'mail': {
      const mailData = data as DashboardWidgetResponseMap['mail']
      return { label: '미확인', value: mailData.unreadCount, tone: 'blue' }
    }
    case 'messenger': {
      const messengerData = data as DashboardWidgetResponseMap['messenger']
      return { label: '미확인', value: messengerData.unreadCount, tone: 'blue' }
    }
    case 'notification': {
      const notificationData = data as DashboardWidgetResponseMap['notification']
      return { label: '미확인', value: notificationData.count, tone: 'red' }
    }
    default:
      return null
  }
}

const isUnreadNotification = (notification: NotificationWidgetItem) => {
  const record = notification as NotificationWidgetItem & Record<string, unknown>
  if (typeof record.read === 'boolean') return !record.read
  if (typeof record.isRead === 'boolean') return !record.isRead
  if (typeof record.readYn === 'string') return record.readYn !== 'Y'
  if (typeof record.unreadYn === 'string') return record.unreadYn === 'Y'
  if (typeof record.readAt === 'string' || record.readAt === null) return !record.readAt
  return true
}

const hasWidgetItems = (data: unknown, key: string) => {
  const value = (data as Record<string, unknown>)[key]
  return Array.isArray(value) && value.length > 0
}

const isWidgetBodyEmpty = (
  widgetKey: DashboardWidgetKey,
  widgetState: DashboardWidgetStateMap[DashboardWidgetKey] | undefined,
  variant: DashboardVariant,
) => {
  if (!widgetState || widgetState.loading || widgetState.error) return false
  const data = widgetState.data
  if (isAdminDashboard(variant)) return false
  if (!data) return true

  if (variant === 'admin') {
    switch (widgetKey) {
      case 'attendance':
        return !hasWidgetItems(data, 'employees')
      case 'todaySchedule':
        return !hasWidgetItems(data, 'schedules')
      case 'projectProgress':
        return !hasWidgetItems(data, 'statusCounts')
      case 'board':
        return !hasWidgetItems(data, 'notices')
      default:
        break
    }
  }

  switch (widgetKey) {
    case 'approval':
      return !hasWidgetItems(data, 'documents')
    case 'todaySchedule':
      return !hasWidgetItems(data, 'schedules')
    case 'meeting':
      return !hasWidgetItems(data, 'meetings')
    case 'reservation':
      return !hasWidgetItems(data, 'reservations')
    case 'task':
      return !hasWidgetItems(data, 'tasks')
    case 'projectProgress':
      return !hasWidgetItems(data, 'projects')
    case 'board':
      return !hasWidgetItems(data, 'posts')
    case 'mail':
      return !hasWidgetItems(data, 'mails')
    case 'messenger':
      return !hasWidgetItems(data, 'rooms')
    case 'notification': {
      const notificationData = data as DashboardWidgetResponseMap['notification']
      return (
        notificationData.count <= 0 ||
        !notificationData.notifications.filter(isUnreadNotification).length
      )
    }
    default:
      return false
  }
}

const getBoardPostPath = (boardType: DashboardBoardType, postId: number) => {
  if (boardType === 'DEPT') return `/boards/departments/${postId}`
  if (boardType === 'PROJ') return '/project'
  return `/boards/notices/${postId}`
}

const getNotificationPath = (type: string) => {
  const normalizedType = type.toLowerCase()
  if (normalizedType.includes('approval')) return '/approval/received/requests'
  if (normalizedType.includes('schedule')) return '/calendar'
  if (normalizedType.includes('meeting')) return '/meeting/scheduled'
  if (normalizedType.includes('reservation')) return '/reservations'
  if (normalizedType.includes('mail')) return '/mail/inbox'
  if (normalizedType.includes('board') || normalizedType.includes('notice')) {
    return '/boards/notices'
  }
  return '/dashboard'
}

const ListRow = ({
  title,
  meta,
  badge,
  badgeTone = 'blue',
  leading = 'dot',
  trailing,
  onClick,
}: ListRowProps) => (
  <li
    className={`group flex min-w-0 items-center justify-between gap-3 rounded-md px-1.5 py-2 transition-colors hover:bg-slate-50 ${
      onClick ? 'cursor-pointer focus-within:bg-slate-50' : ''
    }`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onClick()
            }
          }
        : undefined
    }
  >
    <div className="flex min-w-0 items-center gap-3">
      {leading === 'checkbox' && (
        <span className="h-4 w-4 flex-shrink-0 rounded border border-slate-300 bg-white" />
      )}
      {leading === 'dot' && (
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]" />
      )}

      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold leading-5 text-slate-900">
          {title || '-'}
        </p>
        {meta && (
          <p className="mt-0.5 truncate text-[12px] font-medium leading-5 text-slate-500">
            {meta}
          </p>
        )}
      </div>
    </div>

    <div className="flex flex-shrink-0 items-center gap-2">
      {trailing && (
        <span className="text-[12px] font-semibold text-slate-500">
          {trailing}
        </span>
      )}
      {badge && (
        <span
          className={`rounded-full px-2.5 py-1 text-[12px] font-black ring-1 ${badgeToneStyle[badgeTone]}`}
        >
          {badge}
        </span>
      )}
    </div>
  </li>
)

const WidgetFooter = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <div className="mt-auto border-t border-slate-100 px-4 py-3">
    <button
      type="button"
      className="dashboard-widget-action flex w-full items-center justify-between text-[13px] font-bold text-slate-500 transition-colors hover:text-blue-700"
      onClick={onClick}
    >
      {label}
      <ChevronRight size={16} />
    </button>
  </div>
)

const Metric = ({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) => (
  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
    <p className="text-[11px] font-bold text-slate-500">{label}</p>
    <p
      className={`mt-1 truncate text-[14px] font-black ${
        accent ? 'text-blue-700' : 'text-slate-900'
      }`}
    >
      {value}
    </p>
  </div>
)

const EmptyState = ({ label = '표시할 데이터가 없습니다.' }: { label?: string }) => (
  <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-400">
    {label}
  </div>
)

const LoadingState = () => (
  <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-500">
    불러오는 중
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg bg-rose-50 px-4 text-center text-sm font-bold text-rose-600">
    {message}
  </div>
)

const DashboardWidgetCard = ({
  widgetKey,
  widgetState,
  boardType,
  editMode,
  variant = 'user',
  onRemove,
  onBoardTypeChange,
}: DashboardWidgetCardProps) => {
  const navigate = useNavigate()
  const config = DASHBOARD_WIDGET_CONFIG_MAP[widgetKey]
  const Icon = config.icon
  const title =
    variant === 'admin' ? adminWidgetTitle[widgetKey] ?? config.title : config.title
  const headerBadge = getWidgetHeaderBadge(widgetKey, widgetState, variant)
  const bodyEmpty = isWidgetBodyEmpty(widgetKey, widgetState, variant)

  return (
    <section className="dashboard-widget-card flex h-full flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-white/70">
      <header className="dashboard-widget-drag-handle flex h-[54px] items-center justify-between gap-3 border-b border-slate-100 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-7 w-5 flex-shrink-0 items-center justify-center text-slate-400">
            <GripVertical size={editMode ? 16 : 15} />
          </span>
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Icon size={15} />
          </span>
          <h2 className="truncate text-[15px] font-black text-slate-950">
            {title}
          </h2>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          {headerBadge && (
            <WidgetHeaderBadge
              label={headerBadge.label}
              value={headerBadge.value}
              tone={headerBadge.tone}
            />
          )}

          {editMode && (
            <button
              type="button"
              title="위젯 삭제"
              aria-label={`${config.title} 삭제`}
              onClick={() => onRemove(widgetKey)}
              className="dashboard-widget-action flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {!bodyEmpty && (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
          {renderWidgetBody(
            widgetKey,
            widgetState,
            boardType,
            onBoardTypeChange,
            variant,
            navigate,
          )}
        </div>
      )}
    </section>
  )
}

const attendanceDetail = (emp: AdminAttendanceWidgetItem) => {
  if (emp.lateMin && emp.lateMin > 0) return `지각 ${emp.lateMin}분`
  if (emp.earlyLeaveMin && emp.earlyLeaveMin > 0) return `조퇴 ${emp.earlyLeaveMin}분`
  return emp.checkInAt ?? undefined
}

const scheduleRange = (schedule: AdminImportantScheduleWidgetItem) => {
  if (schedule.allDay) return `${schedule.startAt ?? ''} · 종일`
  return `${schedule.startAt ?? ''} - ${schedule.endAt ?? ''}`
}

const joinMeta = (parts: (string | null | undefined)[]) => {
  const text = parts.filter((part) => Boolean(part)).join(' · ')
  return text || undefined
}

/**
 * 관리자 변형 전용 렌더러. 전용 데이터가 있는 4개 위젯만 처리하고,
 * 그 외 위젯 키는 null을 반환해 사용자 렌더러로 폴백한다.
 */
const renderAdminWidgetBody = (
  widgetKey: DashboardWidgetKey,
  data: NonNullable<DashboardWidgetStateMap[DashboardWidgetKey]>['data'],
) => {
  switch (widgetKey) {
    case 'attendance': {
      const adminData = data as unknown as AdminAttendanceWidgetResponseDto
      return (
        <>
          <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
            <span className="text-[13px] font-black text-amber-800">특이사항 사원</span>
            <strong className="text-2xl font-black text-amber-700">
              {adminData.count}명
            </strong>
          </div>
          {adminData.employees.length ? (
            <ul className="space-y-1">
              {adminData.employees.map((emp) => (
                <ListRow
                  key={emp.empId}
                  title={emp.empNm}
                  meta={joinMeta([emp.deptNm, emp.jbpsNm])}
                  badge={emp.statusName ?? undefined}
                  badgeTone={attendanceStatusTone[emp.status ?? ''] ?? 'slate'}
                  trailing={attendanceDetail(emp)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="오늘 특이사항이 없습니다." />
          )}
        </>
      )
    }

    case 'todaySchedule': {
      const adminData = data as unknown as AdminImportantScheduleWidgetResponseDto
      return adminData.schedules.length ? (
        <ul className="space-y-1">
          {adminData.schedules.map((schedule) => (
            <ListRow
              key={schedule.id}
              title={schedule.title}
              meta={scheduleRange(schedule)}
              badge={schedule.scheduleTypeName ?? undefined}
              badgeTone={schedule.scheduleTypeCode === 'C001' ? 'blue' : 'green'}
            />
          ))}
        </ul>
      ) : (
        <EmptyState label="예정된 중요 일정이 없습니다." />
      )
    }

    case 'projectProgress': {
      const adminData = data as unknown as AdminProjectStatusWidgetResponseDto
      return (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
            <span className="text-[13px] font-black text-blue-800">전체 프로젝트</span>
            <strong className="text-2xl font-black text-blue-700">
              {adminData.totalCount}개
            </strong>
          </div>
          {adminData.statusCounts.length ? (
            <div
              className="grid min-h-0 flex-1 gap-2 overflow-y-auto"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))',
                gridAutoRows: 'min-content',
              }}
            >
              {adminData.statusCounts.map((status) => (
                <Metric
                  key={status.statusCode}
                  label={status.statusName}
                  value={`${status.count}개`}
                  accent={status.statusCode === '02'}
                />
              ))}
            </div>
          ) : (
            <EmptyState label="등록된 프로젝트가 없습니다." />
          )}
        </div>
      )
    }

    case 'board': {
      const adminData = data as unknown as AdminNoticeWidgetResponseDto
      return (
        <>
          {adminData.notices.length ? (
            <ul className="space-y-1">
              {adminData.notices.map((notice) => (
                <ListRow
                  key={notice.id}
                  title={notice.title}
                  meta={joinMeta([notice.writerName, notice.createdAt])}
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="등록된 공지사항이 없습니다." />
          )}
          <WidgetFooter label="공지사항 전체 보기" />
        </>
      )
    }

    default:
      return null
  }
}

const renderWidgetBody = (
  widgetKey: DashboardWidgetKey,
  widgetState: DashboardWidgetStateMap[DashboardWidgetKey] | undefined,
  boardType: DashboardBoardType,
  onBoardTypeChange: (boardType: DashboardBoardType) => void,
  variant: DashboardVariant,
  navigate: NavigateFunction,
) => {
  if (widgetState?.loading && !widgetState.data) return <LoadingState />
  if (widgetState?.error && !widgetState.data) return <ErrorState message={widgetState.error} />
  if (!widgetState?.data) return <EmptyState />

  // 관리자 변형: 전용 데이터가 있는 위젯은 관리자 렌더러로 처리하고,
  // 그 외 위젯은 아래 사용자 렌더러로 폴백한다.
  if (variant === 'admin') {
    const adminBody = renderAdminWidgetBody(widgetKey, widgetState.data)
    if (adminBody) return adminBody
  }

  switch (widgetKey) {
    case 'attendance': {
      const data = widgetState.data as DashboardWidgetResponseMap['attendance']
      return (
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
            <div>
              <p className="text-[12px] font-black text-emerald-700">현재 상태</p>
              <strong className="mt-1 block text-2xl font-black tracking-tight text-emerald-700">
                {getAttendanceStatus(data.status)}
              </strong>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-emerald-700 ring-1 ring-emerald-100">
              근무
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="출근" value={data.checkInAt ?? '-'} />
            <Metric label="퇴근" value={data.checkOutAt ?? '-'} />
            <Metric label="근무 시간" value={formatMinutes(data.workDurationMinutes)} accent />
          </div>
        </div>
      )
    }

    case 'approval': {
      const data = widgetState.data as DashboardWidgetResponseMap['approval']
      const documents = data.documents as ApprovalWidgetDocumentItem[]
      return (
        <>
          <div className="hidden">
            <span className="text-[13px] font-black text-amber-800">대기 문서</span>
            <strong className="text-2xl font-black text-amber-700">
              {data.pendingCount}
            </strong>
          </div>
          {documents.length ? (
            <ul className="space-y-1">
              {documents.map((document) => (
                <ListRow
                  key={document.id}
                  title={document.title}
                  meta={`${document.requesterName} · ${document.requestedAt}`}
                  badge={document.dday}
                  badgeTone={document.dday === 'D-Day' ? 'red' : 'amber'}
                  onClick={() => navigate('/approval/received/requests')}
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="대기 중인 문서가 없습니다." />
          )}
        </>
      )
    }

    case 'todaySchedule': {
      const data = widgetState.data as DashboardWidgetResponseMap['todaySchedule']
      return data.schedules.length ? (
        <>
          <ul className="space-y-1">
            {data.schedules.map((schedule: ScheduleWidgetItem) => {
              const target = getScheduleTarget(schedule)
              return (
                <ListRow
                  key={schedule.id}
                  title={schedule.title}
                  meta={`${schedule.startAt} - ${schedule.endAt}${target ? ` · ${target}` : ''}`}
                  badge="오늘"
                  badgeTone="blue"
                  onClick={() => navigate('/calendar')}
                />
              )
            })}
          </ul>
          <WidgetFooter label="전체 일정 보기" onClick={() => navigate('/calendar')} />
        </>
      ) : (
        <EmptyState label="오늘 일정이 없습니다." />
      )
    }

    case 'meeting': {
      const data = widgetState.data as DashboardWidgetResponseMap['meeting']
      return data.meetings.length ? (
        <>
          <ul className="space-y-1">
            {data.meetings.map((meeting) => (
              <ListRow
                key={meeting.id}
                title={meeting.title}
                meta={`${meeting.startAt} - ${meeting.endAt}${meeting.location ? ` · ${meeting.location}` : ''}`}
                onClick={() => navigate(`/meeting/scheduled?detailMeetingId=${meeting.id}`)}
              />
            ))}
          </ul>
          <WidgetFooter label="전체 회의 보기" onClick={() => navigate('/meeting/scheduled')} />
        </>
      ) : (
        <EmptyState label="오늘 회의가 없습니다." />
      )
    }

    case 'reservation': {
      const data = widgetState.data as DashboardWidgetResponseMap['reservation']
      return data.reservations.length ? (
        <>
          <ul className="space-y-1">
            {data.reservations.map((reservation) => (
              <ListRow
                key={reservation.id}
                title={reservation.resourceName}
                meta={`${reservation.startAt} - ${reservation.endAt}`}
                badge={reservation.status === 'confirmed' ? '확정' : '대기'}
                badgeTone={reservation.status === 'confirmed' ? 'green' : 'amber'}
                onClick={() => navigate('/reservations')}
              />
            ))}
          </ul>
          <WidgetFooter label="전체 예약 보기" onClick={() => navigate('/reservations')} />
        </>
      ) : (
        <EmptyState label="오늘 예약이 없습니다." />
      )
    }

    case 'task': {
      const data = widgetState.data as DashboardWidgetResponseMap['task']
      return data.tasks.length ? (
        <ul className="space-y-1">
          {data.tasks.map((task) => (
            <ListRow
              key={task.id}
              title={task.title}
              meta={`마감일 ${task.dueDate}`}
              badge={task.status}
              badgeTone="slate"
              leading="checkbox"
              onClick={() => navigate('/project')}
            />
          ))}
        </ul>
      ) : (
        <EmptyState label="표시할 업무가 없습니다." />
      )
    }

    case 'projectProgress': {
      const data = widgetState.data as DashboardWidgetResponseMap['projectProgress']
      return data.projects.length ? (
        <ul className="space-y-3">
          {data.projects.map((project) => (
            <li
              key={project.id}
              className="cursor-pointer rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100 transition-colors hover:bg-slate-100"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/project/${project.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/project/${project.id}`)
                }
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[14px] font-black text-slate-900">
                  {project.name}
                </p>
                <span className="text-[12px] font-black text-blue-700">
                  {project.progressRate}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.min(project.progressRate, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                마감일 {project.dueDate}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState label="진행 중인 프로젝트가 없습니다." />
      )
    }

    case 'board': {
      const data = widgetState.data as DashboardWidgetResponseMap['board']
      return (
        <>
          <div className="mb-2 grid grid-cols-3 rounded-md bg-slate-100 p-1">
            {boardTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onBoardTypeChange(tab.value)}
                className={`dashboard-widget-action h-8 rounded text-[12px] font-black transition-colors ${
                  boardType === tab.value
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {data.posts.length ? (
            <ul className="space-y-1">
              {data.posts.map((post) => (
                <ListRow
                  key={post.id}
                  title={post.title}
                  meta={`${post.writerName} · ${post.createdAt}`}
                  badge={post.new ? 'NEW' : undefined}
                  badgeTone="blue"
                  onClick={() => navigate(getBoardPostPath(boardType, post.id))}
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="게시글이 없습니다." />
          )}
        </>
      )
    }

    case 'mail': {
      const data = widgetState.data as DashboardWidgetResponseMap['mail']
      return (
        <>
          <div className="hidden">
            <span className="inline-flex items-center gap-2 text-[13px] font-black text-slate-700">
              <Mail size={15} />
              안 읽은 메일
            </span>
            <strong className="rounded-full bg-blue-50 px-2.5 py-1 text-[13px] font-black text-blue-700 ring-1 ring-blue-100">
              {data.unreadCount}
            </strong>
          </div>
          {data.mails.length ? (
            <ul className="space-y-1">
              {data.mails.map((mail) => (
                <ListRow
                  key={mail.id}
                  title={mail.subject}
                  meta={`${mail.senderName} · ${mail.receivedAt}`}
                  badge={mail.read ? undefined : '미읽음'}
                  badgeTone="blue"
                  onClick={() => navigate(`/mail/inbox?mailId=${mail.id}`)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="최근 메일이 없습니다." />
          )}
          <WidgetFooter label="메일함 열기" onClick={() => navigate('/mail/inbox')} />
        </>
      )
    }

    case 'messenger': {
      const data = widgetState.data as DashboardWidgetResponseMap['messenger']
      return (
        <>
          <div className="hidden">
            <span className="inline-flex items-center gap-2 text-[13px] font-black text-slate-700">
              <MessageSquare size={15} />
              안 읽은 메시지
            </span>
            <strong className="rounded-full bg-blue-50 px-2.5 py-1 text-[13px] font-black text-blue-700 ring-1 ring-blue-100">
              {data.unreadCount}
            </strong>
          </div>
          {data.rooms.length ? (
            <ul className="space-y-1">
              {data.rooms.map((room) => (
                <ListRow
                  key={room.roomId}
                  title={room.roomName}
                  meta={room.lastMessage}
                  trailing={room.lastMessageAt}
                  badge={room.unreadCount ? String(room.unreadCount) : undefined}
                  badgeTone="blue"
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="채팅방이 없습니다." />
          )}
        </>
      )
    }

    case 'notification': {
      const data = widgetState.data as DashboardWidgetResponseMap['notification']
      const unreadNotifications = data.notifications.filter(isUnreadNotification)
      return (
        <>
          <div className="hidden">
            <span className="inline-flex items-center gap-2 text-[13px] font-black text-blue-800">
              <Bell size={15} />
              미확인 알림
            </span>
            <strong className="text-2xl font-black tracking-tight text-blue-700">
              {data.count}
            </strong>
          </div>
          {unreadNotifications.length ? (
            <ul className="space-y-1">
              {unreadNotifications.map((notification) => (
                <ListRow
                  key={notification.id}
                  title={notification.title}
                  meta={`${notification.content} · ${notification.createdAt}`}
                  badge={notification.type}
                  badgeTone="slate"
                  onClick={() => navigate(getNotificationPath(notification.type))}
                />
              ))}
            </ul>
          ) : (
            <EmptyState label="알림이 없습니다." />
          )}
        </>
      )
    }

    default:
      return <EmptyState />
  }
}

export default DashboardWidgetCard
