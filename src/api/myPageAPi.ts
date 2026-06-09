import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type { GoogleAuthorizeResponse } from '../types/auth';
import type {
  ChangeEmailRequest,
  ChangeJobDutyRequest,
  ChangePasswordRequest,
  ChangeSignatureRequest,
  EmployeeMyPage,
} from '../types/myPage';

export const mypageApi = {
  getMyPage: () =>
    axiosInstance.get<ApiResponse<EmployeeMyPage>>('/api/mypage'),
  changePassword: (request: ChangePasswordRequest) =>
    axiosInstance.patch<ApiResponse<string>>('/api/mypage/password', request),
  changeEmail: (request: ChangeEmailRequest) =>
    axiosInstance.patch<ApiResponse<GoogleAuthorizeResponse>>(
      '/api/mypage/email',
      request,
    ),
  changeSignature: (request: ChangeSignatureRequest) =>
    axiosInstance.patch<ApiResponse<string>>('/api/mypage/signature', request),
  changeJobDuty: (request: ChangeJobDutyRequest) =>
    axiosInstance.patch<ApiResponse<string>>('/api/mypage/job-duty', request),
};
