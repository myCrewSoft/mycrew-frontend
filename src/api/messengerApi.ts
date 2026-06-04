import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  ChatMessageResponseDto,
  ChatRoomResponseDto,
  CreateChatRoomRequestDto,
} from '../types/messenger.dto'

const messengerApi = {
  // 채팅방 목록 조회입니다.
  // 백엔드: GET /api/chats
  getChats: (): Promise<AxiosResponse<ApiResponse<ChatRoomResponseDto[]>>> =>
    axiosInstance.get('/api/chats'),

  // 특정 채팅방의 메시지 목록 조회입니다.
  // 백엔드: GET /api/chats/{chtrmId}/messages
  getMessages: (
    chatId: number,
  ): Promise<AxiosResponse<ApiResponse<ChatMessageResponseDto[]>>> =>
    axiosInstance.get(`/api/chats/${chatId}/messages`),

  // 참여자 검색은 공통 EmployeeSearchPicker가 /api/employees/lookup으로 처리합니다.
  createChat: (
    payload: CreateChatRoomRequestDto,
  ): Promise<AxiosResponse<ApiResponse<number>>> =>
    axiosInstance.post('/api/chats', payload),

  // 마지막으로 확인한 메시지 ID를 백엔드에 알려서 읽음 처리합니다.
  // 백엔드: PATCH /api/chats/{chtrmId}/read/{msgId}
  markAsRead: (
    chatId: number,
    messageId: number,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> =>
    axiosInstance.patch(`/api/chats/${chatId}/read/${messageId}`),
}

export default messengerApi
