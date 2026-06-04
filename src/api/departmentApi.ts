import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { DepartmentLookupResponse } from '../types'

export const departmentApi = {
  lookupDepartments: (): Promise<
    AxiosResponse<ApiResponse<DepartmentLookupResponse[]>>
  > => {
    return axiosInstance.get('/api/departments/lookup')
  },
}
