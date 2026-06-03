// 메신저 탭에서 사용할 수 있는 값만 모아둔 타입입니다.
// 문자열을 아무거나 쓰지 못하게 막아주기 때문에 오타를 TypeScript가 잡아줍니다.
export type ChatTab = 'all' | 'group' | 'project'

// 실제 채팅방 종류입니다.
// 백엔드는 M1(1:1), M2(그룹), M3(프로젝트) 같은 코드값을 내려줄 수 있습니다.
export type ChatRoomType = string

// 프로필 아이콘 오른쪽 아래에 표시할 사용자/방 상태입니다.
// 백엔드는 STS1~STS4 같은 상태 코드값을 내려줄 수 있습니다.
export type ChatStatus = string

// 오른쪽 영역이 기존 채팅 화면인지, 새 대화 생성 화면인지 구분합니다.
export type MessengerViewMode = 'chat' | 'create'

// 왼쪽 채팅방 목록과 오른쪽 채팅방 헤더에서 사용하는 채팅방 데이터 모양입니다.
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

// 오른쪽 대화 영역에서 말풍선 1개를 표현할 때 사용하는 데이터 모양입니다.
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

// 새 대화 생성 폼에서 선택할 수 있는 구성원 데이터 모양입니다.
export interface ChatMember {
  id: number
  name: string
  department: string
  jobTitle: string
}
