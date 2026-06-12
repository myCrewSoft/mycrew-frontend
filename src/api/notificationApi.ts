import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  NotificationResponse,
  NotificationUnreadCountResponse,
} from '../types'

export const notificationApi = {
  getNotifications: (): Promise<
    AxiosResponse<ApiResponse<NotificationResponse[]>>
  > => {
    return axiosInstance.get('/api/notifications')
  },

  getUnreadCount: (): Promise<
    AxiosResponse<ApiResponse<NotificationUnreadCountResponse>>
  > => {
    return axiosInstance.get('/api/notifications/unread-count')
  },

  readAllNotifications: (): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.patch('/api/notifications/read-all')
  },

  deleteNotification: (
    alrmRcvrId: number,
  ): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.delete(`/api/notifications/${alrmRcvrId}`)
  },
}
