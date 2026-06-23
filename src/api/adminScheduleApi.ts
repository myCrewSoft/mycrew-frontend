import type { AdminSchdListResponse, AdminSchdRequest, AdminSchdResponse } from '../types'
import axiosInstance from './axiosInstance'
import type { ApiResponse, PageInfo } from './axiosInstance'

export interface AdminSchdSearchParams {
  schdClsfCdList?: string[]
  keyword?: string
  beginDt?: string
  endDt?: string
  page?: number
  size?: number
  sort?: string
}

export interface AdminSchdPageResponse {
  content: AdminSchdListResponse[]
  pagination: PageInfo
}

const ADMIN_SCHEDULE_PREFIX = 'api/admin/schedules'

export const adminScheduleApi = {

  getSchdList: (params: AdminSchdSearchParams) =>
    axiosInstance.get<ApiResponse<AdminSchdPageResponse>>(ADMIN_SCHEDULE_PREFIX, {
      params: {
        ...params,
        schdClsfCdList: params.schdClsfCdList?.join(','),
      },
    }),

  getSchd: (schdId: number) =>
    axiosInstance.get<ApiResponse<AdminSchdResponse>>(`${ADMIN_SCHEDULE_PREFIX}/${schdId}`),

  createSchd: (body: AdminSchdRequest) =>
    axiosInstance.post<ApiResponse<number>>(ADMIN_SCHEDULE_PREFIX, body),

  modifySchd: (schdId: number, body: AdminSchdRequest) =>
    axiosInstance.put<ApiResponse<void>>(`${ADMIN_SCHEDULE_PREFIX}/${schdId}`, body),

  deleteSchd: (schdId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${ADMIN_SCHEDULE_PREFIX}/${schdId}`),
}