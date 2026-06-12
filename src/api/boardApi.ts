import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance' // 프로젝트 구조에 맞게 경로 확인 필요
import type { BoardKind, BoardListParams } from '../types/board'
import type {
  BoardCreateRequest,
  BoardSideBarResponse,
  PageBoardResponse,
} from '../types'

export type BoardMutationRequest = Omit<BoardCreateRequest, 'frstRgtrId'>

const boardTypeCdByKind: Record<Exclude<BoardKind, 'department'>, string> = {
  notice: 'NOTICE',
  free: 'FREE',
  anonymous: 'ANON',
}

interface UpdateBoardParams {
  type: BoardKind
  boardId: number
  departmentCode?: string
  request: BoardMutationRequest
}

/**
 * 게시판 관련 API 모음집
 */
export const boardApi = {
  /**
   * 게시글 목록 조회 (페이징, 검색 포함)
   */
  getBoards: (
    { type, page = 1, keyword = '', departmentCode }: BoardListParams
  ): Promise<AxiosResponse<ApiResponse<PageBoardResponse>>> => {
    const boardTypeCd = type === 'department' ? 'DEPT' : boardTypeCdByKind[type]
    const isDepartment = type === 'department' && departmentCode
    const endpoint = isDepartment
      ? `/api/boards/DEPT/${encodeURIComponent(departmentCode)}`
      : `/api/boards/${boardTypeCd}`

    return axiosInstance.get(endpoint, {
      params: {
        page: Math.max(page - 1, 0),
        size: 10,
        keyword: keyword.trim() || undefined,
        boardTypeCd: isDepartment ? undefined : boardTypeCd,
      },
    })
  },

  /**
   * 게시글 등록
   */
  createBoard: (
    request: BoardMutationRequest,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.post('/api/boards', request)
  },

  /**
   * 게시글 수정
   */
  updateBoard: ({
    boardId,
    request,
  }: UpdateBoardParams): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.put(`/api/boards/${boardId}`, request)
  },

  /**
   * 게시글 삭제
   */
  deleteBoard: (boardId: number): Promise<AxiosResponse<ApiResponse<null>>> => {
    return axiosInstance.delete(`/api/boards/${boardId}`)
  },

  /**
   * 현재 사용자가 권한을 가진 사이드바용 게시판 목록 조회
   */
  getBoardSideBar: (): Promise<AxiosResponse<ApiResponse<BoardSideBarResponse[]>>> => {
    return axiosInstance.get('/api/boards/sidebar')
  },
}
