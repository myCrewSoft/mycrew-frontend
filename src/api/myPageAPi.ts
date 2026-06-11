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
  // 전자서명 이미지를 업로드하고 새 파일 ID를 받아온다.
  // GET /api/files/{id} 로 조회되는 파일 저장소에 업로드하는 엔드포인트.
  // 백엔드 업로드 경로가 다르면 이 메서드만 수정하면 된다.
  uploadStampImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<ApiResponse<number | { fileId?: number; atchFileId?: number }>>(
      '/api/files',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
