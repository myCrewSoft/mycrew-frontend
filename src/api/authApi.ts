import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';

export interface LoginRequest {
  empId: number;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  empId: number;
  authVersion: number;
  firstLoginRequired: boolean;
}

export const authApi = {
  login: (request: LoginRequest) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', request),
};
