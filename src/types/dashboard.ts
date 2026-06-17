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
