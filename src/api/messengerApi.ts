import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  AddParticipantsRequest,
  ChatMessageResponse,
  ChatRoomResponse,
  CreateChatRoomRequest,
  RemoveParticipantsRequest,
  UpdateChatRoomRequest,
} from '../types'

const CHAT_API_PREFIX = '/api/chats'

const messengerApi = {
  // 채팅방 목록 조회입니다.
  // 백엔드: GET /api/chats
  getChats: (): Promise<AxiosResponse<ApiResponse<ChatRoomResponse[]>>> =>
    axiosInstance.get(CHAT_API_PREFIX),

  // 채팅방 단건 조회입니다.
  // 백엔드: GET /api/chats/{chtrmId}
  getChat: (
    chatId: number,
  ): Promise<AxiosResponse<ApiResponse<ChatRoomResponse>>> =>
    axiosInstance.get(`${CHAT_API_PREFIX}/${chatId}`),

  // 특정 채팅방의 메시지 목록 조회입니다.
  // 백엔드: GET /api/chats/{chtrmId}/messages
  getMessages: (
    chatId: number,
  ): Promise<AxiosResponse<ApiResponse<ChatMessageResponse[]>>> =>
    axiosInstance.get(`${CHAT_API_PREFIX}/${chatId}/messages`),

  // 채팅방 생성 요청입니다.
  createChat: (
    payload: CreateChatRoomRequest,
  ): Promise<AxiosResponse<ApiResponse<number>>> =>
    axiosInstance.post(CHAT_API_PREFIX, payload),

  // 채팅방 이름/설명 수정 요청입니다.
  updateChat: (
    chatId: number,
    payload: UpdateChatRoomRequest,
  ): Promise<AxiosResponse<ApiResponse<ChatRoomResponse>>> =>
    axiosInstance.put(`${CHAT_API_PREFIX}/${chatId}`, payload),

  // 채팅방 삭제 요청입니다.
  deleteChat: (
    chatId: number,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> =>
    axiosInstance.delete(`${CHAT_API_PREFIX}/${chatId}`),

  // 채팅방 참여자 추가 요청입니다.
  addParticipants: (
    chatId: number,
    payload: AddParticipantsRequest,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> =>
    axiosInstance.post(`${CHAT_API_PREFIX}/${chatId}/participants`, payload),

  // 채팅방 참여자 삭제 요청입니다.
  removeParticipants: (
    chatId: number,
    payload: RemoveParticipantsRequest,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> =>
    axiosInstance.delete(`${CHAT_API_PREFIX}/${chatId}/participants`, {
      data: payload,
    }),

  // 내 메신저 참여 상태 변경 요청입니다.
  updateParticipantStatus: (
    ptcptSttusCd: string,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> =>
    axiosInstance.patch(`${CHAT_API_PREFIX}/status/${ptcptSttusCd}`),

  // 마지막으로 확인한 메시지 ID를 백엔드에 알려서 읽음 처리합니다.
  // 백엔드: PATCH /api/chats/{chtrmId}/read/{msgId}
  markAsRead: (
    chatId: number,
    messageId: number,
  ): Promise<AxiosResponse<ApiResponse<unknown>>> =>
    axiosInstance.patch(`${CHAT_API_PREFIX}/${chatId}/read/${messageId}`),
}

export default messengerApi
