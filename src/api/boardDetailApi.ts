import axiosInstance from './axiosInstance'
import type { BoardKind } from '../types/board'
import type { BoardComment, BoardDetail } from '../types/boardDetail'

const detailEndpointByType: Record<BoardKind, string> = {
  notice: '/api/notices',
  department: '/api/boards',
  free: '/api/boards',
  anonymous: '/api/boards',
}

export const getBoardDetail = async (
  boardType: BoardKind,
  boardId: number,
): Promise<BoardDetail> => {
  const response = await axiosInstance.get(`${detailEndpointByType[boardType]}/${boardId}`)
  return response.data?.data ?? response.data
}

export const getBoardComments = async (boardId: number): Promise<BoardComment[]> => {
  const response = await axiosInstance.get(`/api/boards/${boardId}/comments`)
  return response.data?.data ?? response.data
}

export const createBoardComment = async (
  boardId: number,
  content: string,
): Promise<BoardComment> => {
  const response = await axiosInstance.post(`/api/boards/${boardId}/comments`, {
    content,
  })
  return response.data?.data ?? response.data
}

