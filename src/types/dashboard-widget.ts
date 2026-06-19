import type { DashboardWidgetKey } from './dashboard'
import type {
  ApprovalWidgetResponse,
  AttendanceWidgetResponse,
  BoardWidgetResponse,
  MailWidgetResponse,
  MeetingWidgetResponse,
  MessengerWidgetResponse,
  NotificationWidgetResponse,
  ProjectWidgetResponse,
  ReservationWidgetResponse,
  ScheduleWidgetResponse,
  TaskWidgetResponse,
} from './index'

export interface DashboardWidgetResponseMap {
  attendance: AttendanceWidgetResponse
  approval: ApprovalWidgetResponse
  todaySchedule: ScheduleWidgetResponse
  meeting: MeetingWidgetResponse
  reservation: ReservationWidgetResponse
  task: TaskWidgetResponse
  projectProgress: ProjectWidgetResponse
  board: BoardWidgetResponse
  mail: MailWidgetResponse
  messenger: MessengerWidgetResponse
  notification: NotificationWidgetResponse
}

export type DashboardWidgetData = DashboardWidgetResponseMap[DashboardWidgetKey]

export type DashboardWidgetStateMap = Partial<{
  [K in DashboardWidgetKey]: {
    data: DashboardWidgetResponseMap[K] | null
    loading: boolean
    error: string | null
  }
}>
