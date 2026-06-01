import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance' // 프로젝트 구조에 맞게 경로 확인 필요
import type { BoardKind, BoardListParams, BoardListResponse } from '../types/board'
import type { BoardSideBarResponse } from '../types'

const boardEndpointByType: Record<BoardKind, string> = {
  notice: '/notices',
  department: '/boards',
  free: '/boards',
  anonymous: '/boards',
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
  ): Promise<AxiosResponse<ApiResponse<BoardListResponse>>> => {
    return axiosInstance.get(boardEndpointByType[type], {
      params: {
        page,
        keyword: keyword || undefined,
        boardType: type,
        departmentCode: departmentCode || undefined,
      },
    })
  },

  /**
   * 현재 사용자가 권한을 가진 사이드바용 게시판 목록 조회
   */
  getBoardSideBar: (): Promise<AxiosResponse<ApiResponse<BoardSideBarResponse[]>>> => {
    return axiosInstance.get('/api/boards/sidebar')
  },
}