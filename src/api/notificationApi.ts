import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

export interface NotificationResponse {
  notificationId: number
  notificationTypeCode: string
  notificationTitle: string
  notificationContent: string
  sentAt: string
  confirmedAt: string | null
}

export const notificationApi = {
  // 헤더 알림창에서 보여줄 알림을 최대 50개까지 조회합니다.
  getNotifications: (): Promise<
    AxiosResponse<ApiResponse<NotificationResponse[]>>
  > => {
    return axiosInstance.get('/notifications', {
      params: { limit: 50 },
    })
  },

  // 알림창을 닫을 때 아직 읽지 않은 알림들을 모두 읽음 처리합니다.
  readAllNotifications: (): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.patch('/notifications/read-all')
  },

  // 실제 DELETE가 아니라 백엔드에서 ALRM_DEL_YN 값을 Y로 바꾸는 논리 삭제 요청입니다.
  deleteNotification: (
    notificationId: number,
  ): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.delete(`/notifications/${notificationId}`)
  },
}
