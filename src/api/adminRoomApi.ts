import axiosInstance from './axiosInstance'
import type { AxiosResponse } from 'axios'
import type { ApiResponse } from './axiosInstance'
import type { ConfRmListItem, ConfRmStatsSummary } from '../types'

const ADMIN_RM_PREFIX = 'api/admin/rooms'

export const confRmAdminApi = {

    getConfRmStats: (): Promise<AxiosResponse<ApiResponse<ConfRmStatsSummary>>> => {
        return axiosInstance.get(`${ADMIN_RM_PREFIX}/stats`)
    },

    getConfRmList: (): Promise<AxiosResponse<ApiResponse<ConfRmListItem[]>>> => {
        return axiosInstance.get(ADMIN_RM_PREFIX)
    },
}