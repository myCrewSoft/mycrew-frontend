import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type { EmployeeProfile } from '../types/profile';

export const profileApi = {
  getMyProfile: () =>
    axiosInstance.get<ApiResponse<EmployeeProfile>>('/api/mypage/profile'),
};
