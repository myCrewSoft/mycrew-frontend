import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { ScheduleRequestDto, ScheduleResponseDto } from '../types'

export interface ScheduleListParams {
  beginDt: string
  endDt: string
}

export const scheduleApi = {
  getSchedules: (
    params: ScheduleListParams,
  ): Promise<AxiosResponse<ApiResponse<ScheduleResponseDto[]>>> => {
    return axiosInstance.get('/api/schedules', { params })
  },

  createSchedule: (
    payload: ScheduleRequestDto,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.post('/api/schedules', payload)
  },

  updateSchedule: (
    scheduleId: string | number,
    payload: ScheduleRequestDto,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.put(`/api/schedules/${scheduleId}`, payload)
  },

  deleteSchedule: (
    scheduleId: string | number,
  ): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.delete(`/api/schedules/${scheduleId}`)
  },
}
