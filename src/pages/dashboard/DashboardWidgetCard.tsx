import {
  Bell,
  ChevronRight,
  ExternalLink,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react'
import type {
  AdminAttendanceWidgetItem,
  AdminAttendanceWidgetResponseDto,
  AdminImportantScheduleWidgetItem,
  AdminImportantScheduleWidgetResponseDto,
  AdminNoticeWidgetResponseDto,
  AdminProjectStatusWidgetResponseDto,
  AttendanceWidgetResponseDto,
  DashboardBoardType,
  DashboardVariant,
  DashboardWidgetKey,
  DashboardWidgetResponseMap,
} from '../../types/dashboard'
import { DASHBOARD_WIDGET_CONFIG_MAP } from './dashboard.config'

interface DashboardWidgetCardProps {
  widgetKey: DashboardWidgetKey
  dataMap: DashboardWidgetResponseMap
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
  leading?: 'dot' | 'checkbox' | 'file'
  trailing?: string
}

const statusLabel: Record<AttendanceWidgetResponseDto['status'], string> = {
  beforeWork: '출근 전',
  working: '근무 중',
  afterWork: '퇴근',
  vacation: '휴가',
}

const badgeToneStyle: Record<NonNullable<ListRowProps['badgeTone']>, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-rose-50 text-rose-600 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const formatMinutes = (minutes = 0) => {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${hour}시간 ${String(minute).padStart(2, '0')}분`
}

const ListRow = ({
  title,
  meta,
  badge,
  badgeTone = 'blue',
  leading = 'dot',
  trailing,
}: ListRowProps) => (
  <li className="group flex min-w-0 items-center justify-between gap-3 rounded-md px-1.5 py-2 transition-colors hover:bg-slate-50">
    <div className="flex min-w-0 items-center gap-3">
      {leading === 'checkbox' && (
        <span className="h-4 w-4 flex-shrink-0 rounded border border-slate-300 bg-white" />
      )}
      {leading === 'file' && (
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600">
          <ExternalLink size={14} />
        </span>
      )}
      {leading === 'dot' && (
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]" />
      )}

      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold leading-5 text-slate-900">
          {title}
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

const WidgetFooter = ({ label }: { label: string }) => (
  <div className="mt-auto border-t border-slate-100 px-4 py-3">
    <button
      type="button"
      className="dashboard-widget-action flex w-full items-center justify-between text-[13px] font-bold text-slate-500 transition-colors hover:text-blue-700"
    >
      {label}
      <ChevronRight size={16} />
    </button>
  </div>
)

const DashboardWidgetCard = ({
  widgetKey,
  dataMap,
  editMode,
  variant = 'user',
  onRemove,
}: DashboardWidgetCardProps) => {
  const config = DASHBOARD_WIDGET_CONFIG_MAP[widgetKey]
  const Icon = config.icon
  const title =
    variant === 'admin' ? adminWidgetTitle[widgetKey] ?? config.title : config.title

  return (
    <section className="dashboard-widget-card flex h-full flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-white/70">
      <header className="dashboard-widget-drag-handle flex h-[54px] items-center justify-between gap-3 border-b border-slate-100 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-5 flex-shrink-0 items-center justify-center text-slate-400">
            {editMode ? <GripVertical size={16} /> : <GripVertical size={15} />}
          </span>
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Icon size={15} />
          </span>
          <h2 className="truncate text-[15px] font-black text-slate-950">
            {title}
          </h2>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          {widgetKey === 'messenger' && !editMode && (
            <button
              type="button"
              title="검색"
              aria-label="메신저 검색"
              className="dashboard-widget-action flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700"
            >
              <Search size={16} />
            </button>
          )}

          {editMode ? (
            <button
              type="button"
              title="위젯 삭제"
              aria-label={`${config.title} 삭제`}
              onClick={() => onRemove(widgetKey)}
              className="dashboard-widget-action flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              type="button"
              title="더보기"
              aria-label={`${config.title} 더보기`}
              className="dashboard-widget-action flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        {renderWidgetBody(widgetKey, widgetState, boardType, onBoardTypeChange, variant)}
      </div>
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
            <div className="grid grid-cols-2 gap-2">
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
  widgetState: DashboardWidgetStateMap[DashboardWidgetKey] | undefined,
  boardType: DashboardBoardType,
  onBoardTypeChange: (boardType: DashboardBoardType) => void,
  variant: DashboardVariant,
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
      return (
        <>
          <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
            <span className="text-[13px] font-black text-amber-800">대기 문서</span>
            <strong className="text-2xl font-black text-amber-700">
              {data.pendingCount}
            </strong>
          </div>
          {data.documents.length ? (
            <ul className="space-y-1">
              {data.documents.map((document) => (
                <ListRow
                  key={document.id}
                  title={document.title}
                  meta={`${document.requesterName} · ${document.requestedAt}`}
                  badge={document.dday}
                  badgeTone={document.dday === 'D-Day' ? 'red' : 'amber'}
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
            {dataMap.todaySchedule.schedules.map((schedule) => (
              <ListRow
                key={schedule.id}
                title={schedule.title}
                meta={`${schedule.startAt} - ${schedule.endAt}${schedule.location ? ` · ${schedule.location}` : ''}`}
                badge="오늘"
                badgeTone="blue"
              />
            ))}
          </ul>
          <WidgetFooter label="전체 일정 보기" />
        </>
      )

    case 'meetingSchedule':
      return (
        <>
          <ul className="space-y-1">
            {dataMap.meetingSchedule.meetings.map((meeting, index) => (
              <ListRow
                key={meeting.id}
                title={meeting.title}
                meta={`${meeting.startAt} - ${meeting.endAt}${meeting.location ? ` · ${meeting.location}` : ''}`}
                badge={`+${index + 2}`}
                badgeTone="slate"
              />
            ))}
          </ul>
          <WidgetFooter label="전체 회의 일정 보기" />
        </>
      )

    case 'reservationStatus':
      return (
        <>
          <ul className="space-y-1">
            {dataMap.reservationStatus.reservations.map((reservation) => (
              <ListRow
                key={reservation.id}
                title={reservation.resourceName}
                meta={`${reservation.startAt} - ${reservation.endAt}`}
                badge={reservation.status === 'confirmed' ? '확정' : '대기'}
                badgeTone={reservation.status === 'confirmed' ? 'green' : 'amber'}
              />
            ))}
          </ul>
          <WidgetFooter label="전체 예약 보기" />
        </>
      )

    case 'notice':
      return (
        <>
          <ul className="space-y-1">
            {dataMap.notice.notices.map((notice) => (
              <ListRow
                key={notice.id}
                title={notice.title}
                meta={`${notice.writerName} · ${notice.createdAt}`}
                badge={notice.isNew ? 'NEW' : undefined}
                badgeTone="blue"
              />
            ))}
          </ul>
          <WidgetFooter label="공지사항 전체 보기" />
        </>
      )

    case 'departmentBoard':
      return (
        <>
          <ul className="space-y-1">
            {dataMap.departmentBoard.posts.map((post) => (
              <ListRow
                key={post.id}
                title={post.title}
                meta={`${post.writerName} · ${post.createdAt}`}
                badge={post.isNew ? 'NEW' : undefined}
                badgeTone="blue"
              />
            ))}
          </ul>
          <WidgetFooter label="부서 게시글 전체 보기" />
        </>
      )

    case 'unreadNotification':
      return (
        <>
          <div className="mb-2 flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 ring-1 ring-blue-100">
            <span className="inline-flex items-center gap-2 text-[13px] font-black text-blue-800">
              <Bell size={15} />
              미확인 알림
            </span>
            <strong className="text-2xl font-black tracking-tight text-blue-700">
              {dataMap.unreadNotification.count}
            </strong>
          </div>
          <ul className="space-y-1">
            {dataMap.unreadNotification.notifications.map((notification) => (
              <ListRow
                key={notification.id}
                title={notification.title}
                meta={`${notification.content} · ${notification.createdAt}`}
              />
            ))}
          </ul>
        </>
      )

    case 'messenger':
      return (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[13px] font-black text-slate-700">
              <MessageSquare size={15} />
              안 읽은 메시지
            </span>
            <strong className="rounded-full bg-blue-50 px-2.5 py-1 text-[13px] font-black text-blue-700 ring-1 ring-blue-100">
              {dataMap.messenger.unreadCount}
            </strong>
          </div>
          <ul className="space-y-1">
            {dataMap.messenger.rooms.map((room) => (
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
          <WidgetFooter label="메신저 열기" />
        </>
      )

    case 'attendance':
      return (
        <>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
              <div>
                <p className="text-[12px] font-black text-emerald-700">현재 상태</p>
                <strong className="mt-1 block text-2xl font-black tracking-tight text-emerald-700">
                  {statusLabel[dataMap.attendance.status]}
                </strong>
              </div>
              <button
                type="button"
                className="dashboard-widget-action rounded-md bg-blue-600 px-3 py-2 text-[13px] font-black text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                퇴근 처리
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="출근" value={dataMap.attendance.checkInAt ?? '-'} />
              <Metric
                label="총 근무시간"
                value={formatMinutes(dataMap.attendance.workDurationMinutes)}
                accent
              />
              <Metric label="휴가 사용" value="0일" />
            </div>
          </div>
        </>
      )

    case 'quickLinks':
      return (
        <div className="grid grid-cols-2 gap-2">
          {dataMap.quickLinks.links.map((link) => (
            <a
              key={link.id}
              href={link.path}
              className="dashboard-widget-action flex min-h-[70px] flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-black text-slate-700 no-underline transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ExternalLink size={17} />
              {link.label}
            </a>
          ))}
        </div>
      )

    case 'approval':
      return (
        <>
          <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
            <span className="text-[13px] font-black text-amber-800">대기 문서</span>
            <strong className="text-2xl font-black text-amber-700">
              {dataMap.approval.pendingCount}
            </strong>
          </div>
          <ul className="space-y-1">
            {dataMap.approval.documents.map((document) => (
              <ListRow
                key={document.id}
                title={document.title}
                meta={`${document.requesterName} · ${document.requestedAt}`}
              />
            ))}
          </ul>
        </>
      )

    case 'projectProgress':
      return (
        <ul className="space-y-3">
          {dataMap.projectProgress.projects.map((project) => (
            <li key={project.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
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
                  style={{ width: `${project.progressRate}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )

    case 'recentDrive':
      return (
        <>
          <ul className="space-y-1">
            {dataMap.recentDrive.files.map((file) => (
              <ListRow
                key={file.id}
                title={file.fileName}
                meta={`${file.ownerName} · ${file.updatedAt}`}
                leading="file"
              />
            ))}
          </ul>
          <WidgetFooter label="드라이브 열기" />
        </>
      )

    case 'aiSummary':
      return (
        <div className="flex flex-1 flex-col justify-between gap-4">
          <p className="rounded-lg bg-violet-50 p-4 text-[14px] font-semibold leading-6 text-slate-700 ring-1 ring-violet-100">
            {dataMap.aiSummary.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            {dataMap.aiSummary.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-violet-700 ring-1 ring-violet-100"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )

    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          <Bell size={16} className="mr-2" />
          위젯 데이터가 없습니다.
        </div>
      )
  }
}

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

export default DashboardWidgetCard
