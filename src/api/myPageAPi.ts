import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type { GoogleAuthorizeResponse } from '../types/auth';
import type {
  ChangeEmailRequest,
  ChangeJobDutyRequest,
  ChangePasswordRequest,
  ChangeProfileInfoRequest,
  EmployeeMyPage,
} from '../types/myPage';

// 파일 저장소의 이미지 서빙 URL을 만든다. (GET /api/files/images/{id})
export const buildFileImageUrl = (fileId?: number | null): string | null => {
  if (!fileId) return null;
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';
  return `${apiBaseUrl}/api/files/images/${fileId}`;
};

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
  changeJobDuty: (request: ChangeJobDutyRequest) =>
    axiosInstance.patch<ApiResponse<string>>('/api/mypage/job-duty', request),

  // 개인정보(이름/휴대전화/주소)를 변경한다. (PATCH /api/mypage/profile-info)
  changeProfileInfo: (request: ChangeProfileInfoRequest) =>
    axiosInstance.patch<ApiResponse<string>>('/api/mypage/profile-info', request),

  // 전자서명 이미지를 업로드/변경한다. 백엔드가 fileService를 경유해 저장하고
  // 새로 저장된 파일 ID(Long)를 반환한다. (PATCH /api/mypage/signature)
  changeSignature: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.patch<ApiResponse<number>>(
      '/api/mypage/signature',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  // 프로필 이미지를 업로드/변경한다. 새로 저장된 파일 ID(Long)를 반환한다.
  // (PATCH /api/mypage/profile-image)
  changeProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.patch<ApiResponse<number>>(
      '/api/mypage/profile-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
