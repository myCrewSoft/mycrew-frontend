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
