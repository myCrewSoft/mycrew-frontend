// 메신저 화면에서 탭, 방 타입, 화면 모드를 문자열 리터럴로 제한합니다.
// 오타가 나면 TypeScript가 바로 알려주기 때문에 조건 분기와 props 전달이 안전해집니다.
export type ChatTab = 'all' | 'group' | 'project'

export type ChatRoomType = 'direct' | 'group' | 'project'

export type ChatStatus = 'online' | 'away' | 'offline'

export type MessengerViewMode = 'chat' | 'create'

export interface ChatRoom {
  id: number
  name: string
  type: ChatRoomType
  avatar: string
  description: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  status?: ChatStatus
  jobTitle?: string
  department?: string
}

export interface ChatMessage {
  id: number
  senderName: string
  content: string
  time: string
  mine: boolean
  read?: boolean
}
