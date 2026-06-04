import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  ApprovalWidgetResponseDto,
  AttendanceWidgetResponseDto,
  DashboardLayoutRequestDto,
  DashboardLayoutResponseDto,
  DepartmentBoardWidgetResponseDto,
  MeetingScheduleWidgetResponseDto,
  MessengerWidgetResponseDto,
  NoticeWidgetResponseDto,
  ProjectProgressWidgetResponseDto,
  QuickLinksWidgetResponseDto,
  RecentDriveWidgetResponseDto,
  ReservationStatusWidgetResponseDto,
  TodayScheduleWidgetResponseDto,
  UnreadNotificationWidgetResponseDto,
  AiSummaryWidgetResponseDto,
} from '../types/dashboard'

export const dashboardApi = {
  getLayout: (): Promise<AxiosResponse<ApiResponse<DashboardLayoutResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/layout')
  },

  saveLayout: (
    payload: DashboardLayoutRequestDto,
  ): Promise<AxiosResponse<ApiResponse<DashboardLayoutResponseDto>>> => {
    return axiosInstance.put('/api/dashboard/layout', payload)
  },

  resetLayout: (): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.delete('/api/dashboard/layout')
  },

  getTodaySchedule: (): Promise<AxiosResponse<ApiResponse<TodayScheduleWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/today-schedule')
  },

  getMeetingSchedule: (): Promise<AxiosResponse<ApiResponse<MeetingScheduleWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/meeting-schedule')
  },

  getReservationStatus: (): Promise<AxiosResponse<ApiResponse<ReservationStatusWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/reservation-status')
  },

  getNotice: (): Promise<AxiosResponse<ApiResponse<NoticeWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/notice')
  },

  getDepartmentBoard: (): Promise<AxiosResponse<ApiResponse<DepartmentBoardWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/department-board')
  },

  getUnreadNotification: (): Promise<AxiosResponse<ApiResponse<UnreadNotificationWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/unread-notification')
  },

  getMessenger: (): Promise<AxiosResponse<ApiResponse<MessengerWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/messenger')
  },

  getAttendance: (): Promise<AxiosResponse<ApiResponse<AttendanceWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/attendance')
  },

  getQuickLinks: (): Promise<AxiosResponse<ApiResponse<QuickLinksWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/quick-links')
  },

  getApproval: (): Promise<AxiosResponse<ApiResponse<ApprovalWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/approval')
  },

  getProjectProgress: (): Promise<AxiosResponse<ApiResponse<ProjectProgressWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/project-progress')
  },

  getRecentDrive: (): Promise<AxiosResponse<ApiResponse<RecentDriveWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/recent-drive')
  },

  getAiSummary: (): Promise<AxiosResponse<ApiResponse<AiSummaryWidgetResponseDto>>> => {
    return axiosInstance.get('/api/dashboard/widgets/ai-summary')
  },
}
