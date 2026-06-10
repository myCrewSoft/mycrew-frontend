import type { BoardKind } from '../types/board'
import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  BoardCommentCreateRequest,
  BoardCommentUpdateRequest,
  BoardResponse,
} from '../types'

export type BoardCommentMutationRequest =
  Omit<BoardCommentCreateRequest, 'commentPrtId'> & {
    commentPrtId: number | null
  }

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

const pendingDetailRequests = new Map<
  string,
  Promise<AxiosResponse<ApiResponse<BoardResponse>>>
>()

const getBoardDetailRequestKey = ({
  boardType,
  boardId,
  deptCd = '',
}: GetBoardDetailParams) => `${boardType}:${deptCd}:${boardId}`

export const boardDetailApi = {
  getBoardDetail: ({
    boardType,
    boardId,
    deptCd,
  }: GetBoardDetailParams): Promise<AxiosResponse<ApiResponse<BoardResponse>>> => {
    const requestKey = getBoardDetailRequestKey({ boardType, boardId, deptCd })
    const pendingRequest = pendingDetailRequests.get(requestKey)

    if (pendingRequest) {
      return pendingRequest
    }

    let promise: Promise<AxiosResponse<ApiResponse<BoardResponse>>>

    const boardTypeCd = boardType === 'department'
      ? 'DEPT'
      : boardTypeCdByKind[boardType]

    if (boardType === 'department' && deptCd) {
      promise = axiosInstance.get(
        `/api/boards/DEPT/${encodeURIComponent(deptCd)}/${boardId}`,
      )
    } else {
      promise = axiosInstance.get(`/api/boards/${boardTypeCd}/${boardId}`)
    }

    pendingDetailRequests.set(requestKey, promise)

    void promise.finally(() => {
      const currentRequest = pendingDetailRequests.get(requestKey)

      if (currentRequest === promise) {
        pendingDetailRequests.delete(requestKey)
      }
    }).catch(() => undefined)

    return promise
  },

  createBoardComment: (
    request: BoardCommentMutationRequest,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.post('/api/boards/comments', request)
  },

  updateBoardComment: (
    request: BoardCommentUpdateRequest,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.put('/api/boards/comments', request)
  },
}
