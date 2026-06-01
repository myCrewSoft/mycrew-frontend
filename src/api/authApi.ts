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
  getGoogleAuthorizeUrl: () =>
    axiosInstance.get<ApiResponse<GoogleAuthorizeResponse>>(
      '/api/v1/mail/oauth/google/authorize',
    ),
  completeFirstLogin: (request: FirstLoginRequest) =>
    axiosInstance.patch<ApiResponse<string>>(
      '/api/v1/auth/first-login',
      request,
    ),
  logout: () => axiosInstance.post<ApiResponse<string>>('/api/v1/auth/logout'),
};
