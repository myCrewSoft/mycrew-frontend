import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  ChatMessageResponseDto,
  ChatRoomResponseDto,
  CreateChatRoomRequestDto,
} from '../types/messenger.dto'

const messengerApi = {
  getChats: (): Promise<AxiosResponse<ApiResponse<ChatRoomResponseDto[]>>> =>
    axiosInstance.get('/chats'),

  getMessages: (
    chatId: number,
  ): Promise<AxiosResponse<ApiResponse<ChatMessageResponseDto[]>>> =>
    axiosInstance.get(`/chats/${chatId}/messages`),

  // 참여자 검색은 공통 EmployeeSearchPicker가 /api/employees/lookup으로 처리합니다.
  createChat: (
    payload: CreateChatRoomRequestDto,
  ): Promise<AxiosResponse<ApiResponse<ChatRoomResponseDto>>> =>
    axiosInstance.post('/chats', payload),
}

export default messengerApi
