//드라이브 API 함수 모음
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { DriveResponseDto } from '../types/drive.dto'

export const driveApi = {

  // 폴더 생성
  createFolder: (data: { itemNm: string; prntDriveItemId?: number }) =>
    axiosInstance.post<ApiResponse<DriveResponseDto>>('/api/drive/folders', data),

  // 파일 업로드
  uploadFile: (file: File, prntDriveItemId?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    if (prntDriveItemId !== undefined) {
      formData.append('prntDriveItemId', String(prntDriveItemId))
    }
    return axiosInstance.post<ApiResponse<DriveResponseDto>>(
      '/api/drive/files',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  //드라이브 목록 조회
  getMyDriveList : () => 
      axiosInstance.get<ApiResponse<DriveResponseDto[]>>('/api/drive'),


}