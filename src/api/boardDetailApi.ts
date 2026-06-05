import type { BoardKind } from '../types/board'
import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { BoardResponse } from '../types'

const boardTypeCdByKind: Record<Exclude<BoardKind, 'department'>, string> = {
  notice: 'NOTICE',
  free: 'FREE',
  anonymous: 'ANON',
}

interface GetBoardDetailParams {
  boardType: BoardKind
  boardId: number
  deptCd?: string
}

export const boardDetailApi = {
  getBoardDetail: ({
    boardType,
    boardId,
    deptCd,
  }: GetBoardDetailParams): Promise<AxiosResponse<ApiResponse<BoardResponse>>> => {
    if (boardType === 'department' && deptCd) {
      return axiosInstance.get(
        `/api/boards/dept/${encodeURIComponent(deptCd)}/${boardId}`,
      )
    }

    const boardTypeCd = boardType === 'department'
      ? 'DEPT'
      : boardTypeCdByKind[boardType]

    return axiosInstance.get(`/api/boards/${boardTypeCd}/${boardId}`)
  },
}
