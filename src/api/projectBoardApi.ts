import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { BoardResponse, PageBoardResponse } from '../types'

export interface ProjectBoardListParams {
  projectId: number
  page?: number
  size?: number
  keyword?: string
}

export const projectBoardApi = {
  getBoards: async ({
    projectId,
    page = 1,
    size = 10,
    keyword = '',
  }: ProjectBoardListParams): Promise<
    AxiosResponse<ApiResponse<PageBoardResponse>>
  > => {
    const response = await axiosInstance.get<PageBoardResponse>(
      `/api/boards/PROJ/${projectId}`,
      {
        params: {
          page: Math.max(page - 1, 0),
          size,
          keyword: keyword.trim() || undefined,
          boardTypeCd: 'PROJ',
        },
      },
    )

    return {
      ...response,
      data: {
        success: true,
        message: '',
        data: response.data,
      },
    }
  },

  getBoardDetail: (
    boardId: number,
  ): Promise<AxiosResponse<ApiResponse<BoardResponse>>> =>
    axiosInstance.get(`/api/boards/proj/${boardId}`),
}
