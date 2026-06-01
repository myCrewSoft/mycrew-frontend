import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type { LoginRequest, LoginResponse } from '../types/auth';

export const authApi = {
  login: (request: LoginRequest) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', request),
};
