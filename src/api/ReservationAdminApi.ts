import axiosInstance, { type ApiResponse } from './axiosInstance'
import type { RsrvListItem, RsrvSearchRequest, RsrvStatsSummary } from '../types/index'
import type { AxiosResponse } from 'axios'

const ADMIN_RSRV_PREFIX = 'api/admin/reservations'

export const getReservationStats = (
): Promise<AxiosResponse<ApiResponse<RsrvStatsSummary>>> => {
    return axiosInstance.get(`${ADMIN_RSRV_PREFIX}/stats`)
}

export const getReservationList = (
    params: RsrvSearchRequest
): Promise<AxiosResponse<ApiResponse<RsrvListItem[]>>> => {
    return axiosInstance.get(ADMIN_RSRV_PREFIX, { params })
}

export const cancelReservation = async (rsrvId: number): Promise<void> => {
    await axiosInstance.delete(`${ADMIN_RSRV_PREFIX}/${rsrvId}`)
}