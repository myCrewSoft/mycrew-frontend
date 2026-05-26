import type { ChatRoom, ChatStatus } from './messenger.types'

// 상태값에 따라 프로필 아이콘 오른쪽 아래에 표시할 점 색상을 정합니다.
// 텍스트로 "온라인", "자리비움"을 쓰지 않고 작은 색상 점으로 상태를 표현하기 위한 매핑입니다.
export const statusDotClassName: Record<ChatStatus, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  offline: 'bg-slate-300',
}

// 오른쪽 대화방 헤더에서 이름 옆에 작게 붙일 직급/부서 텍스트를 만듭니다.
// 왼쪽 목록은 좁기 때문에 이 보조 정보는 오른쪽 헤더에서만 보여줍니다.
export const getDirectRoomMeta = (room: ChatRoom) =>
  [room.jobTitle, room.department].filter(Boolean).join(' · ')

// 왼쪽 대화방 목록에서는 직급은 빼고 부서명만 작게 보여줍니다.
// 목록은 폭이 좁아서 정보를 많이 넣으면 쉽게 깨지기 때문입니다.
export const getRoomListDepartment = (room: ChatRoom) =>
  room.type === 'direct' ? room.department : undefined
