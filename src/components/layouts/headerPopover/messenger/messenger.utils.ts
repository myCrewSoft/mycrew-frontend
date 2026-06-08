import type { ChatRoom, ChatStatus, ChatTab } from './messenger.types'

const getRoomType = (room: ChatRoom) =>
  typeof room.type === 'string' ? room.type : ''

// 백엔드 채팅방 type 코드와 화면에서 쓰던 type 이름을 함께 판단합니다.
// generated.ts의 DTO를 그대로 쓰기 때문에, 여기서만 코드값 해석을 담당합니다.
export const isDirectChatRoom = (room: ChatRoom) =>
  getRoomType(room) === 'direct' || getRoomType(room) === 'M1'

export const isGroupChatRoom = (room: ChatRoom) =>
  getRoomType(room) === 'group' || getRoomType(room) === 'M2'

export const isWorkChatRoom = (room: ChatRoom) =>
  getRoomType(room) === 'work' ||
  getRoomType(room) === 'M3' ||
  getRoomType(room) === 'M4'

export const isProjectChatRoom = (room: ChatRoom) =>
  getRoomType(room) === 'project' || getRoomType(room) === 'M3'

export const isTaskChatRoom = (room: ChatRoom) =>
  getRoomType(room) === 'task' || getRoomType(room) === 'M4'

// 현재 선택된 탭에 맞는 채팅방인지 확인합니다.
// 탭 필터링 조건이 컴포넌트 안에 흩어지지 않도록 함수로 분리했습니다.
export const matchesChatTab = (room: ChatRoom, tab: ChatTab) => {
  if (tab === 'all') return true
  if (tab === 'group') return isGroupChatRoom(room)
  return isWorkChatRoom(room)
}

// 상태값에 따라 프로필 아이콘 오른쪽 아래에 표시할 점 색상을 정합니다.
// 화면용 문자열과 백엔드 코드값을 둘 다 받을 수 있게 처리합니다.
export const getStatusDotClassName = (status?: ChatStatus) => {
  switch (status) {
    case 'online':
    case 'STS1':
      return 'bg-emerald-500'
    case 'away':
    case 'STS2':
      return 'bg-amber-400'
    case 'busy':
    case 'STS3':
      return 'bg-red-500'
    case 'offline':
    case 'STS4':
      return 'bg-slate-300'
    default:
      return 'bg-slate-300'
  }
}

// 오른쪽 대화방 헤더에서 이름 옆에 작게 붙일 직급/부서 텍스트를 만듭니다.
// 왼쪽 목록은 좁기 때문에 이 보조 정보는 오른쪽 헤더에서만 보여줍니다.
export const getDirectRoomMeta = (room: ChatRoom) =>
  [room.jobTitle, room.department].filter(Boolean).join(' · ')

// 왼쪽 대화방 목록에서는 직급은 빼고 부서명만 작게 보여줍니다.
// 목록은 폭이 좁아서 정보를 많이 넣으면 쉽게 깨지기 때문입니다.
export const getRoomListDepartment = (room: ChatRoom) =>
  isDirectChatRoom(room) ? room.department : undefined

// 백엔드는 프로필 이미지를 URL이 아니라 첨부파일 ID(prflImgFileId)로 내려줍니다.
// 실제 파일 조회 API 경로가 바뀌면 메신저 화면 전체가 아니라 이 함수만 수정하면 됩니다.
export const getProfileImageUrlByFileId = (fileId?: number | null) => {
  if (!fileId) return null

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? ''

  return `${apiBaseUrl}/api/files/${fileId}`
}

// 백엔드가 내려주는 HH:mm 24시간 형식을 오전/오후 12시간 형식으로 바꿉니다.
// 예: 09:05 -> 오전 9:05, 14:32 -> 오후 2:32
export const formatMessengerTime = (time: string) => {
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return time
  }

  const period = hour < 12 ? '오전' : '오후'
  const hour12 = hour % 12 || 12
  const minutePadded = String(minute).padStart(2, '0')

  return `${period} ${hour12}:${minutePadded}`
}
