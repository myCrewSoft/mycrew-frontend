import type { components } from './generated'

export type DashboardGeneratedSchemas = components['schemas']

export type DashboardWidgetKey =
  | 'attendance'
  | 'approval'
  | 'todaySchedule'
  | 'meeting'
  | 'reservation'
  | 'task'
  | 'projectProgress'
  | 'board'
  | 'mail'
  | 'messenger'
  | 'notification'

export type DashboardBoardType = 'NOTICE' | 'DEPT' | 'PROJ'

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

export interface DashboardServerLayoutItem {
  key: DashboardWidgetKey
  x: number
  y: number
  w: number
  h: number
}

export interface DashboardLayoutJson {
  widgets: DashboardServerLayoutItem[]
}

export type DashboardLayoutResponseDto = components['schemas']['DashboardLayoutResponse']
export type DashboardLayoutRequestDto = components['schemas']['DashboardLayoutRequest']
export type AttendanceWidgetResponseDto = components['schemas']['AttendanceWidgetResponse']
export type ApprovalWidgetResponseDto = components['schemas']['ApprovalWidgetResponse']
export type TodayScheduleWidgetResponseDto = components['schemas']['ScheduleWidgetResponse']
export type MeetingWidgetResponseDto = components['schemas']['MeetingWidgetResponse']
export type ReservationWidgetResponseDto = components['schemas']['ReservationWidgetResponse']
export type TaskWidgetResponseDto = components['schemas']['TaskWidgetResponse']
export type ProjectProgressWidgetResponseDto = components['schemas']['ProjectWidgetResponse']
export type BoardWidgetResponseDto = components['schemas']['BoardWidgetResponse']
export type MailWidgetResponseDto = components['schemas']['MailWidgetResponse']
export type MessengerWidgetResponseDto = components['schemas']['MessengerWidgetResponse']
export type NotificationWidgetResponseDto = components['schemas']['NotificationWidgetResponse']

export interface DashboardWidgetResponseMap {
  attendance: AttendanceWidgetResponseDto
  approval: ApprovalWidgetResponseDto
  todaySchedule: TodayScheduleWidgetResponseDto
  meeting: MeetingWidgetResponseDto
  reservation: ReservationWidgetResponseDto
  task: TaskWidgetResponseDto
  projectProgress: ProjectProgressWidgetResponseDto
  board: BoardWidgetResponseDto
  mail: MailWidgetResponseDto
  messenger: MessengerWidgetResponseDto
  notification: NotificationWidgetResponseDto
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
