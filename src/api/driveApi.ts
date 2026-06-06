//드라이브 API 함수 모음
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { DriveRenameRequestDto, DriveResponseDto } from '../types/drive.dto'

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

  // 드라이브 목록 조회
  getMyDriveList: (prntDriveItemId?: number) =>
    axiosInstance.get<ApiResponse<DriveResponseDto[]>>('/api/drive', {
      params: { prntDriveItemId }
    }),
  
  // 폴더명 수정
  renameFolder: (driveItemId: number, reqDto: DriveRenameRequestDto) =>
    axiosInstance.patch<ApiResponse<DriveResponseDto>>(`/api/drive/folders/${driveItemId}/name`, reqDto),

  // 즐겨찾기 등록/해제 
  toggleBookmark: (driveItemId: number) =>
    axiosInstance.patch<ApiResponse<DriveResponseDto>>(`/api/drive/items/${driveItemId}/bookmark`),

  //단건 삭제
  deleteItem : (driveItemId:number) => 
    axiosInstance.patch<ApiResponse<string>>(`/api/drive/items/${driveItemId}/delete`),

  //휴지통 목록 조회
  getTrashList: () =>
    axiosInstance.get<ApiResponse<DriveResponseDto[]>>('/api/drive/trash'),

  // 휴지통 단건 복구
  restoreItem: (driveItemId: number) =>
    axiosInstance.patch<ApiResponse<void>>(`/api/drive/items/${driveItemId}/restore`),

  // 영구삭제
  hardDeleteItem: (driveItemId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/drive/items/${driveItemId}`),

  //파일 다운로드
  downloadFile: (driveItemId: number) =>
    axiosInstance.get(`/api/drive/files/${driveItemId}/download`, {
      responseType: 'blob',
    }),
}