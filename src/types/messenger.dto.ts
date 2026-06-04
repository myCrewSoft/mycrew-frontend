// 메신저 DTO 임시 타입 파일입니다.
// 백엔드에서 프론트 화면에 맞춘 응답 DTO를 만들면 generated.ts 타입 별칭으로 교체하면 됩니다.
// 예) import { components } from './generated';
// 예) export type ChatRoomResponseDto = components['schemas']['ChatRoomResponseDto'];

export interface ChatRoomResponseDto {
  id: number;
  name: string;
  type: 'direct' | 'group' | 'project';
  avatar: string;
  description: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  status?: 'online' | 'away' | 'offline';
  jobTitle?: string;
  department?: string;
}

export interface ChatMessageResponseDto {
  id: number;
  senderName: string;
  content: string;
  time: string;
  mine: boolean;
  read?: boolean;
}

export interface ChatMemberResponseDto {
  id: number;
  name: string;
  department: string;
  jobTitle: string;
}

export interface CreateChatRoomRequestDto {
  chatName?: string;
  chatDescription?: string;
  participantIds: number[];
}
