import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import chatbotApi from './chatBotApi'
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

interface BoardRiskStreamParams {
  boardId: number
  message: string
  requestId: string
  onMessage: (message: string) => void
  signal?: AbortSignal
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
   * 내 게시글 목록 조회 (현재 사용자가 작성한 글, 페이징·검색 포함)
   */
  getMyPosts: (
    page = 1,
    keyword = '',
  ): Promise<AxiosResponse<ApiResponse<PageBoardResponse>>> => {
    return axiosInstance.get('/api/boards/mine', {
      params: {
        page: Math.max(page - 1, 0),
        size: 10,
        keyword: keyword.trim() || undefined,
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

  /**
   * 게시글 위험도 분석
   *
   * SSE 스트림은 Axios의 일반 JSON 응답과 처리 방식이 달라 기존 chatBotApi의
   * 인증 갱신 및 스트림 파서를 재사용합니다. 게시글 분석 타입은 항상 PORK로 고정합니다.
   */
  streamBoardRiskAnalysis: ({
    boardId,
    message,
    requestId,
    onMessage,
    signal,
  }: BoardRiskStreamParams): Promise<void> => {
    return chatbotApi.streamChat(
      {
        boardId,
        message,
        requestId,
        aiType: 'PORK',
      },
      { onMessage },
      signal,
    )
  },

  /**
   * 진행 중인 게시글 위험도 분석 중단
   */
  stopBoardRiskAnalysis: (requestId: string): Promise<void> => {
    return chatbotApi.stopStream(requestId)
  },
}
