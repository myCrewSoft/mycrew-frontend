import axiosInstance from './axiosInstance'
import type { BoardKind, BoardListParams, BoardListResponse } from '../types/board'

const boardEndpointByType: Record<BoardKind, string> = {
  notice: '/notices',
  department: '/boards',
  free: '/boards',
  anonymous: '/boards',
}

export const getBoards = async ({
  type,
  page = 1,
  keyword = '',
  departmentCode,
}: BoardListParams): Promise<BoardListResponse> => {
  const response = await axiosInstance.get(boardEndpointByType[type], {
    params: {
      page,
      keyword: keyword || undefined,
      boardType: type,
      departmentCode: departmentCode || undefined,
    },
  })

  return response.data
}
