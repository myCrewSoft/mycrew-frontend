import type { components } from './generated'

export type DashboardGeneratedSchemas = components['schemas']

export type DashboardWidgetKey =
  | 'todaySchedule'
  | 'meetingSchedule'
  | 'reservationStatus'
  | 'notice'
  | 'departmentBoard'
  | 'unreadNotification'
  | 'messenger'
  | 'attendance'
  | 'quickLinks'
  | 'approval'
  | 'projectProgress'
  | 'recentDrive'
  | 'aiSummary'

export interface DashboardLayoutItem {
  i: DashboardWidgetKey
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

export interface DashboardLayoutResponseDto {
  dashboardLayoutId: number
  empId: number
  layoutJson: DashboardLayoutItem[]
  createdAt: string
  lastModifiedAt: string | null
}

export interface DashboardLayoutRequestDto {
  layoutJson: DashboardLayoutItem[]
}

export interface ScheduleWidgetItem {
  id: number
  title: string
  startAt: string
  endAt: string
  location?: string
  category?: string
}

export interface TodayScheduleWidgetResponseDto {
  schedules: ScheduleWidgetItem[]
}

export interface MeetingScheduleWidgetResponseDto {
  meetings: ScheduleWidgetItem[]
}

export interface ReservationStatusWidgetResponseDto {
  reservations: {
    id: number
    resourceName: string
    startAt: string
    endAt: string
    status: 'confirmed' | 'waiting' | 'cancelled'
  }[]
}

export interface BoardWidgetItem {
  id: number
  title: string
  writerName: string
  createdAt: string
  isNew?: boolean
}

export interface NoticeWidgetResponseDto {
  notices: BoardWidgetItem[]
}

export interface DepartmentBoardWidgetResponseDto {
  posts: BoardWidgetItem[]
}

export interface UnreadNotificationWidgetResponseDto {
  count: number
  notifications: {
    id: number
    title: string
    content: string
    createdAt: string
    type: 'schedule' | 'board' | 'message' | 'approval' | 'system'
  }[]
}

export interface MessengerWidgetResponseDto {
  unreadCount: number
  rooms: {
    roomId: number
    roomName: string
    lastMessage: string
    lastMessageAt: string
    unreadCount: number
  }[]
}

export interface AttendanceWidgetResponseDto {
  status: 'beforeWork' | 'working' | 'afterWork' | 'vacation'
  checkInAt?: string
  checkOutAt?: string
  workDurationMinutes?: number
}

export interface QuickLinksWidgetResponseDto {
  links: {
    id: string
    label: string
    path: string
    icon: 'mail' | 'calendar' | 'reservation' | 'board' | 'drive'
  }[]
}

export interface ApprovalWidgetResponseDto {
  pendingCount: number
  documents: {
    id: number
    title: string
    requesterName: string
    requestedAt: string
  }[]
}

export interface ProjectProgressWidgetResponseDto {
  projects: {
    id: number
    name: string
    progressRate: number
    dueDate: string
  }[]
}

export interface RecentDriveWidgetResponseDto {
  files: {
    id: number
    fileName: string
    updatedAt: string
    ownerName: string
  }[]
}

export interface AiSummaryWidgetResponseDto {
  summary: string
  keywords: string[]
}

export interface DashboardWidgetResponseMap {
  todaySchedule: TodayScheduleWidgetResponseDto
  meetingSchedule: MeetingScheduleWidgetResponseDto
  reservationStatus: ReservationStatusWidgetResponseDto
  notice: NoticeWidgetResponseDto
  departmentBoard: DepartmentBoardWidgetResponseDto
  unreadNotification: UnreadNotificationWidgetResponseDto
  messenger: MessengerWidgetResponseDto
  attendance: AttendanceWidgetResponseDto
  quickLinks: QuickLinksWidgetResponseDto
  approval: ApprovalWidgetResponseDto
  projectProgress: ProjectProgressWidgetResponseDto
  recentDrive: RecentDriveWidgetResponseDto
  aiSummary: AiSummaryWidgetResponseDto
}

export type DashboardWidgetData = DashboardWidgetResponseMap[DashboardWidgetKey]

export type DashboardWidgetStateMap = Partial<{
  [K in DashboardWidgetKey]: {
    data: DashboardWidgetResponseMap[K] | null
    loading: boolean
    error: string | null
  }
}>

// ===== 관리자 대시보드 위젯 (조직 전체 현황) =====
// 백엔드 신규 엔드포인트 /api/admin/dashboard/widgets/* 응답 타입.
// (사용자 위젯과 데이터 구조가 다르므로 별도 정의)

export type DashboardVariant = 'user' | 'admin'

/** 사원 근태 현황 위젯 항목 (지각/조퇴/결근 등 특이사항) */
export interface AdminAttendanceWidgetItem {
  empId: number
  empNm: string
  deptNm: string | null
  jbpsNm: string | null
  status: string | null
  statusName: string | null
  checkInAt: string | null
  checkOutAt: string | null
  lateMin: number | null
  earlyLeaveMin: number | null
}

export interface AdminAttendanceWidgetResponseDto {
  count: number
  employees: AdminAttendanceWidgetItem[]
}

/** 중요 일정 위젯 항목 (전사·간부 일정 통합) */
export interface AdminImportantScheduleWidgetItem {
  id: number
  title: string
  scheduleTypeCode: string | null
  scheduleTypeName: string | null
  startAt: string | null
  endAt: string | null
  allDay: boolean
}

export interface AdminImportantScheduleWidgetResponseDto {
  schedules: AdminImportantScheduleWidgetItem[]
}

/** 프로젝트 현황 위젯 - 상태별 집계 항목 */
export interface AdminProjectStatusCount {
  statusCode: string
  statusName: string
  count: number
}

export interface AdminProjectStatusWidgetResponseDto {
  totalCount: number
  statusCounts: AdminProjectStatusCount[]
}

/** 공지사항 위젯 항목 */
export interface AdminNoticeWidgetItem {
  id: number
  title: string
  writerName: string | null
  createdAt: string | null
}

export interface AdminNoticeWidgetResponseDto {
  notices: AdminNoticeWidgetItem[]
}

export type AdminDashboardWidgetData =
  | AdminAttendanceWidgetResponseDto
  | AdminImportantScheduleWidgetResponseDto
  | AdminProjectStatusWidgetResponseDto
  | AdminNoticeWidgetResponseDto
