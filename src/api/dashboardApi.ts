import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  ApprovalWidgetResponseDto,
  AttendanceWidgetResponseDto,
  BoardWidgetResponseDto,
  DashboardBoardType,
  DashboardLayoutRequestDto,
  DashboardLayoutResponseDto,
  DashboardWidgetData,
  DashboardWidgetKey,
  MailWidgetResponseDto,
  MeetingWidgetResponseDto,
  MessengerWidgetResponseDto,
  ProjectProgressWidgetResponseDto,
  NotificationWidgetResponseDto,
  ReservationWidgetResponseDto,
  TaskWidgetResponseDto,
  TodayScheduleWidgetResponseDto,
} from '../types/dashboard'

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
}
