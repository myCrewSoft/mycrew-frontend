import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

export interface BoardFileUploadRequest {
  file: File
  fileCn?: string
}

export const fileApi = {
  uploadBoardFile: ({
    file,
    fileCn,
  }: BoardFileUploadRequest): Promise<AxiosResponse<ApiResponse<number>>> => {
    const formData = new FormData()
    formData.append('file', file)

    if (fileCn?.trim()) {
      formData.append('fileCn', fileCn.trim())
    }

    return axiosInstance.post('/api/files/boards', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getImage: (atchFileDtlId: number) =>
    axiosInstance.get(`/api/files/images/${atchFileDtlId}`, {
      responseType: 'blob',
    }),
}

export const getImage = fileApi.getImage
