import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type {
  FirstLoginRequest,
  GoogleAuthorizeResponse,
  LoginRequest,
  LoginResponse,
} from '../types/auth';

export const authApi = {
  login: (request: LoginRequest) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', request),
  logout: () => axiosInstance.post<ApiResponse<string>>('/api/v1/auth/logout'),
  getGoogleAuthorizeUrl: (context?: 'mail') =>
    axiosInstance.get<ApiResponse<GoogleAuthorizeResponse>>(
      '/api/mail/oauth/google/authorize',
      { params: context ? { context } : undefined },
    ),
  completeFirstLogin: (request: FirstLoginRequest) =>
    axiosInstance.patch<ApiResponse<string>>(
      '/api/v1/auth/first-login',
      request,
    ),
};
