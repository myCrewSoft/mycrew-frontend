import type { DriveResponseDto } from "../types/drive.dto";
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

export const projectDriveApi = {
    //해당 프로젝트 목록 조회
    getProjectDriveList : (projId : number, prntDriveItemId?: number, page = 0) =>
        axiosInstance.get<ApiResponse<DriveResponseDto[]>>(`/api/project/drive/${projId}`,
            {
                params : {prntDriveItemId, page}
            }
        ),

    // 폴더 생성
    createFolder: (projId: number, data: { itemNm: string; prntDriveItemId?: number }) =>
        axiosInstance.post<ApiResponse<string>>(
        `/api/project/drive/${projId}/folders`,
        data
        ),

    // 파일 업로드
    uploadFile: (projId: number, file: File, prntDriveItemId?: number) => {
        const formData = new FormData()
        formData.append('file', file)
        if (prntDriveItemId !== undefined) {
        formData.append('prntDriveItemId', String(prntDriveItemId))
        }
        return axiosInstance.post<ApiResponse<string>>(
        `/api/project/drive/${projId}/files`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
        )
    },

    //폴더명 수정
    renameFolder: (driveitemId:number, itemNm:string) => 
        axiosInstance.patch<ApiResponse<string>>(`/api/project/drive/folders/${driveitemId}/name`, {itemNm}),

    //즐겨찾기 등록/해제
    toggleBookmark: (driveItemId:number) =>
        axiosInstance.patch<ApiResponse<string>>(`/api/project/drive/items/${driveItemId}/bookmark`),

    //논리 삭제
    deleteItem: (driveItemId:number) =>
        axiosInstance.patch<ApiResponse<string>>(`/api/project/drive/items/${driveItemId}/delete`),

    // 파일 다운로드
    downloadFile: (driveItemId: number) =>
        axiosInstance.get(`/api/project/drive/files/${driveItemId}/download`, {
            responseType: 'blob'
        })
    
}