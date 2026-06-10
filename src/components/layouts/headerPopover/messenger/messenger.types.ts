import type {
  ChatMessageResponse,
  ChatParticipantResponse,
  ChatRoomResponse,
} from '../../../../types'

// 메신저 화면에서 탭, 방 타입, 화면 모드를 문자열 리터럴로 제한합니다.
// 오타가 나면 TypeScript가 바로 알려주기 때문에 조건 분기와 props 전달이 안전해집니다.
export type ChatTab = 'all' | 'group' | 'work'

// 프로필 아이콘 오른쪽 아래에 표시할 사용자/방 상태입니다.
// 백엔드는 STS1~STS4 같은 상태 코드값을 내려줄 수 있습니다.
export type ChatStatus = string

export type MessengerViewMode = 'chat' | 'create' | 'info'

// 화면 컴포넌트도 백엔드 ChatRoomResponse를 그대로 사용합니다.
// generated.ts 직접 import 대신 src/types/index.ts의 별칭을 통해 가져옵니다.
export type ChatRoom = ChatRoomResponse

// 참여자 정보도 백엔드 ChatParticipantResponse를 그대로 사용합니다.
export type ChatParticipant = ChatParticipantResponse

// 메시지 말풍선도 백엔드 ChatMessageResponse를 그대로 사용합니다.
export type ChatMessage = ChatMessageResponse
