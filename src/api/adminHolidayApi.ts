import type { HolidayManualRequest, HolidayResponse } from '../types'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

const ADMIN_HOLIDAY_PREFIX = 'api/admin/holidays'

export const adminHolidayApi = {

  getHolidayList: (year: number) =>
    axiosInstance.get<ApiResponse<HolidayResponse[]>>(ADMIN_HOLIDAY_PREFIX, {
      params: { year },
    }),

  getHoliday: (holidayId: number) =>
    axiosInstance.get<ApiResponse<HolidayResponse>>(`${ADMIN_HOLIDAY_PREFIX}/${holidayId}`),

  syncHolidays: (year: number) =>
    axiosInstance.post<ApiResponse<number>>(`${ADMIN_HOLIDAY_PREFIX}/sync`, null, {
      params: { year },
      timeout: 60_000,
    }),

  createHoliday: (body: HolidayManualRequest) =>
    axiosInstance.post<ApiResponse<number>>(ADMIN_HOLIDAY_PREFIX, body),

  modifyHoliday: (holidayId: number, body: HolidayManualRequest) =>
    axiosInstance.put<ApiResponse<void>>(`${ADMIN_HOLIDAY_PREFIX}/${holidayId}`, body),

  deleteHoliday: (holidayId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`${ADMIN_HOLIDAY_PREFIX}/${holidayId}`),
}