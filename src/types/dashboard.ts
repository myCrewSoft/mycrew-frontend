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

export type DashboardVariant = 'user' | 'admin'

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

export interface AdminProjectStatusCount {
  statusCode: string
  statusName: string
  count: number
}

export interface AdminProjectStatusWidgetResponseDto {
  totalCount: number
  statusCounts: AdminProjectStatusCount[]
}

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
