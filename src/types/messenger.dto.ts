import type { components } from './generated'

// 메신저 DTO 타입 별칭입니다.
// generated.ts는 자동 생성 파일이므로 직접 수정하지 않고, 이 파일에서 필요한 DTO만 꺼내 씁니다.
export type CreateChatRoomRequestDto =
  components['schemas']['CreateChatRoomRequest']

// ChatMessageRequestDto는 REST 요청 DTO가 아니라 WebSocket publish payload입니다.
// OpenAPI generated.ts에 포함되지 않으므로 프론트에서 웹소켓 전송용 타입으로 직접 관리합니다.
export interface ChatMessageRequestDto {
  content: string
}

export type ChatMessageResponseDto = components['schemas']['ChatMessageResponse']

export type ChatRoomResponseDto = components['schemas']['ChatRoomResponse']

export interface CreateChatRoomRequestDto {
  chatName?: string;
  chatDescription?: string;
  participantIds: number[];
}
