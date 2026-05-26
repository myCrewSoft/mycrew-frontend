import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  ChatMemberResponseDto,
  ChatMessageResponseDto,
  ChatRoomResponseDto,
  CreateChatRoomRequestDto,
} from '../types/messenger.dto'

// 메신저 API 함수 모음입니다.
// 컴포넌트에서 axiosInstance를 직접 호출하지 않고, 도메인별 API 파일을 통해 호출하면 유지보수가 쉬워집니다.
const messengerApi = {
  // 채팅방 목록 조회입니다.
  // 백엔드: GET /chats
  getChats: (): Promise<AxiosResponse<ApiResponse<ChatRoomResponseDto[]>>> =>
    axiosInstance.get('/chats'),

  // 특정 채팅방의 메시지 목록 조회입니다.
  // 백엔드: GET /chats/{chatId}/messages
  getMessages: (
    chatId: number,
  ): Promise<AxiosResponse<ApiResponse<ChatMessageResponseDto[]>>> =>
    axiosInstance.get(`/chats/${chatId}/messages`),

  // 새 1:1 또는 그룹 채팅방 생성입니다.
  // participantIds가 1명이면 1:1, 2명 이상이면 그룹으로 백엔드에서 판단하게 설계합니다.
  createChat: (
    payload: CreateChatRoomRequestDto,
  ): Promise<AxiosResponse<ApiResponse<ChatRoomResponseDto>>> =>
    axiosInstance.post('/chats', payload),

  // 새 대화 생성 폼에서 사용할 참여자 검색입니다.
  // 백엔드 endpoint가 확정되면 URI만 맞춰주면 됩니다.
  searchMembers: (
    keyword: string,
  ): Promise<AxiosResponse<ApiResponse<ChatMemberResponseDto[]>>> =>
    axiosInstance.get('/members/search', { params: { keyword } }),
}

export default messengerApi
