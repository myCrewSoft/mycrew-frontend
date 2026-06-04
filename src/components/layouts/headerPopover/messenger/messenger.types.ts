// 메신저 화면에서 탭, 방 타입, 화면 모드를 문자열 리터럴로 제한합니다.
// 오타가 나면 TypeScript가 바로 알려주기 때문에 조건 분기와 props 전달이 안전해집니다.
export type ChatTab = 'all' | 'group' | 'project'

// 실제 채팅방 종류입니다.
// 백엔드는 M1(1:1), M2(그룹), M3(프로젝트) 같은 코드값을 내려줄 수 있습니다.
export type ChatRoomType = string

// 프로필 아이콘 오른쪽 아래에 표시할 사용자/방 상태입니다.
// 백엔드는 STS1~STS4 같은 상태 코드값을 내려줄 수 있습니다.
export type ChatStatus = string

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
  senderId: number
  senderName: string
  content: string
  time: string
  mine: boolean
  read?: boolean
  unreadCount?: number
}
