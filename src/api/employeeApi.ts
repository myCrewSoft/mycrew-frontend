import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { EmployeeLookupRequest, EmployeeLookupResponse } from '../types'

export type EmployeeLookupParams = Partial<EmployeeLookupRequest>

export const employeeApi = {
  lookupEmployees: (
    params: EmployeeLookupParams,
  ): Promise<AxiosResponse<ApiResponse<EmployeeLookupResponse[]>>> => {
    return axiosInstance.get('/api/employees/lookup', { params })
  },
}
