import type { AdminMtngAnalyticsResponse, AdminMtngDetailResponse, AdminMtngListPageResponse, AdminMtngListRequest, AdminMtngStatsResponse } from "../types"
import axiosInstance, { type ApiResponse } from "./axiosInstance"

const ADMIN_MTNG_PREFIX = 'api/admin/meetings'

const getAdminMtngList = (params?: AdminMtngListRequest) => {
  return axiosInstance.get<ApiResponse<AdminMtngListPageResponse>>(
    ADMIN_MTNG_PREFIX,
    { params },
  )
}

const getAdminMtngDetail = (mtngId: number) => {
  return axiosInstance.get<ApiResponse<AdminMtngDetailResponse>>(
    `${ADMIN_MTNG_PREFIX}/${mtngId}`,
  )
}

const getAdminMtngStats = () => {
  return axiosInstance.get<ApiResponse<AdminMtngStatsResponse>>(
    `${ADMIN_MTNG_PREFIX}/stats`,
  )
}

const getAdminMtngAnalytics = () => {
  return axiosInstance.get<ApiResponse<AdminMtngAnalyticsResponse>>(
    `${ADMIN_MTNG_PREFIX}/analytics`,
  )
}

const forceEndMtng = (mtngId: number) => {
  return axiosInstance.patch<ApiResponse<null>>(
    `${ADMIN_MTNG_PREFIX}/${mtngId}/force-end`,
  )
}

export const adminMtngApi = {
  getAdminMtngList,
  getAdminMtngDetail,
  getAdminMtngStats,
  getAdminMtngAnalytics,
  forceEndMtng,
}