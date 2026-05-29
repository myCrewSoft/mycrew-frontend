import type { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type { AdminAccessResponse } from '../types/admin';
import type {
  AdminEmployeeListItem,
  AdminEmployeeRegisterRequest,
  AdminEmployeeSearchParams,
} from '../types/adminEmployee';

export const adminApi = {
  getAccess: (): Promise<AxiosResponse<ApiResponse<AdminAccessResponse>>> => {
    return axiosInstance.get('/api/admin/access');
  },
  getEmployees: (
    params: AdminEmployeeSearchParams = {},
  ): Promise<AxiosResponse<ApiResponse<AdminEmployeeListItem[]>>> => {
    return axiosInstance.get('/api/admin/members', { params });
  },
  registerEmployee: (
    request: AdminEmployeeRegisterRequest,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.post('/api/admin/members', request);
  },
};
