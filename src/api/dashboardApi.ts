import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  DashboardBoardType,
  DashboardWidgetKey,
  AdminAttendanceWidgetResponseDto,
  AdminDashboardWidgetData,
  AdminImportantScheduleWidgetResponseDto,
  AdminNoticeWidgetResponseDto,
  AdminProjectStatusWidgetResponseDto,
} from '../types/dashboard'
import type {
  ApprovalWidgetResponse as ApprovalWidgetResponseDto,
  AttendanceWidgetResponse as AttendanceWidgetResponseDto,
  BoardWidgetResponse as BoardWidgetResponseDto,
  DashboardLayoutRequest as DashboardLayoutRequestDto,
  DashboardLayoutResponse as DashboardLayoutResponseDto,
  MailWidgetResponse as MailWidgetResponseDto,
  MeetingWidgetResponse as MeetingWidgetResponseDto,
  MessengerWidgetResponse as MessengerWidgetResponseDto,
  NotificationWidgetResponse as NotificationWidgetResponseDto,
  ProjectWidgetResponse as ProjectProgressWidgetResponseDto,
  ReservationWidgetResponse as ReservationWidgetResponseDto,
  ScheduleWidgetResponse as TodayScheduleWidgetResponseDto,
  TaskWidgetResponse as TaskWidgetResponseDto,
} from '../types'
import type { DashboardWidgetData } from '../types/dashboard-widget'

export const dashboardApi = {
  getLayout: (): Promise<AxiosResponse<ApiResponse<DashboardLayoutResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/layout')
  },

  saveLayout: (
    payload: DashboardLayoutRequestDto,
  ): Promise<AxiosResponse<ApiResponse<void>>> => {
    return axiosInstance.put('/api/dashboard/layout', payload)
  },

  getTodaySchedule: (): Promise<AxiosResponse<ApiResponse<TodayScheduleWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/schedule')
  },

  getMeeting: (): Promise<AxiosResponse<ApiResponse<MeetingWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/meeting')
  },

  getReservation: (): Promise<AxiosResponse<ApiResponse<ReservationWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/reservation')
  },

  getTask: (): Promise<AxiosResponse<ApiResponse<TaskWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/task')
  },

  getBoard: (
    boardTypeCd: DashboardBoardType,
  ): Promise<AxiosResponse<ApiResponse<BoardWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/board', {
      params: { boardTypeCd },
    })
  },

  getNotification: (): Promise<AxiosResponse<ApiResponse<NotificationWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/notification')
  },

  getMessenger: (): Promise<AxiosResponse<ApiResponse<MessengerWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/messenger')
  },

  getMail: (): Promise<AxiosResponse<ApiResponse<MailWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/mail')
  },

  getAttendance: (): Promise<AxiosResponse<ApiResponse<AttendanceWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/attendance')
  },

  getApproval: (): Promise<AxiosResponse<ApiResponse<ApprovalWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/approval')
  },

  getProjectProgress: (): Promise<AxiosResponse<ApiResponse<ProjectProgressWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/project')
  },

  getWidget: (
    widgetKey: DashboardWidgetKey,
    boardTypeCd: DashboardBoardType = 'NOTICE',
  ): Promise<AxiosResponse<ApiResponse<DashboardWidgetData>>> => {
    switch (widgetKey) {
      case 'attendance':
        return dashboardApi.getAttendance()
      case 'approval':
        return dashboardApi.getApproval()
      case 'todaySchedule':
        return dashboardApi.getTodaySchedule()
      case 'meeting':
        return dashboardApi.getMeeting()
      case 'reservation':
        return dashboardApi.getReservation()
      case 'task':
        return dashboardApi.getTask()
      case 'projectProgress':
        return dashboardApi.getProjectProgress()
      case 'board':
        return dashboardApi.getBoard(boardTypeCd)
      case 'mail':
        return dashboardApi.getMail()
      case 'messenger':
        return dashboardApi.getMessenger()
      case 'notification':
        return dashboardApi.getNotification()
      default:
        throw new Error(`Unknown dashboard widget: ${widgetKey}`)
    }
  },

  // ===== 관리자 대시보드 위젯 (조직 전체 현황) =====

  getAdminAttendance: (): Promise<
    AxiosResponse<ApiResponse<AdminAttendanceWidgetResponseDto>>
  > => {
    return axiosInstance.get('/api/admin/dashboard/widgets/attendance')
  },

  getAdminImportantSchedule: (): Promise<
    AxiosResponse<ApiResponse<AdminImportantScheduleWidgetResponseDto>>
  > => {
    return axiosInstance.get('/api/admin/dashboard/widgets/schedule')
  },

  getAdminProjectStatus: (): Promise<
    AxiosResponse<ApiResponse<AdminProjectStatusWidgetResponseDto>>
  > => {
    return axiosInstance.get('/api/admin/dashboard/widgets/project')
  },

  getAdminNotice: (): Promise<
    AxiosResponse<ApiResponse<AdminNoticeWidgetResponseDto>>
  > => {
    return axiosInstance.get('/api/admin/dashboard/widgets/notice')
  },

  /**
   * 관리자 대시보드 위젯 디스패처.
   * 관리자 전용 데이터가 있는 위젯(근태/중요일정/프로젝트현황/공지)은 관리자 엔드포인트를 호출하고,
   * 그 외 위젯은 사용자 엔드포인트로 위임한다.
   */
  getAdminWidget: (
    widgetKey: DashboardWidgetKey,
    boardTypeCd: DashboardBoardType = 'NOTICE',
  ): Promise<AxiosResponse<ApiResponse<AdminDashboardWidgetData | DashboardWidgetData>>> => {
    switch (widgetKey) {
      case 'attendance':
        return dashboardApi.getAdminAttendance()
      case 'todaySchedule':
        return dashboardApi.getAdminImportantSchedule()
      case 'projectProgress':
        return dashboardApi.getAdminProjectStatus()
      case 'board':
        return dashboardApi.getAdminNotice()
      default:
        return dashboardApi.getWidget(widgetKey, boardTypeCd)
    }
  },
}
