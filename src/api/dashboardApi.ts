import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  AdminAttendanceWidgetResponseDto,
  AdminDashboardWidgetData,
  AdminImportantScheduleWidgetResponseDto,
  AdminNoticeWidgetResponseDto,
  AdminProjectStatusWidgetResponseDto,
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
