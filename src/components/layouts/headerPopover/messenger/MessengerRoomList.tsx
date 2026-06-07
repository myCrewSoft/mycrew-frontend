import { PencilLine } from 'lucide-react'
import { useState } from 'react'
import Badge from '../../../common/dataDisplay/badge/Badge'
import SearchInput from '../../../common/form/searchInput/SearchInput'
import type { ChatRoom, ChatTab } from './messenger.types'
import {
  getProfileImageUrlByFileId,
  getRoomListDepartment,
  getStatusDotClassName,
  isDirectChatRoom,
  isGroupChatRoom,
  isProjectChatRoom,
  isTaskChatRoom,
} from './messenger.utils'

// 왼쪽 목록 상단에 표시할 탭입니다.
// '전체'는 필터 없이 모두 보여주고, '그룹'과 '업무'는 채팅방 type으로 필터링합니다.
const chatTabs: { value: ChatTab; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'group', label: '그룹' },
  { value: 'work', label: '업무' },
]

const getSafeText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const getRoomAvatarStyle = (room: ChatRoom) => {
  if (isGroupChatRoom(room)) {
    return {
      label: '단체',
      className: 'bg-indigo-100 text-indigo-600',
    }
  }

  if (isProjectChatRoom(room)) {
    return {
      label: '프로젝트',
      className: 'bg-violet-100 text-violet-600',
    }
  }

  if (isTaskChatRoom(room)) {
    return {
      label: '업무',
      className: 'bg-emerald-100 text-emerald-600',
    }
  }

  return {
    label: getSafeText(room.name).charAt(0) || '?',
    className: 'bg-blue-100 text-blue-600',
  }
}

const getParticipantCount = (room: ChatRoom) => {
  const count = room.participantCount

  return typeof count === 'number' && Number.isFinite(count) ? count : null
}

const RoomAvatar = ({
  room,
  avatarStyle,
}: {
  room: ChatRoom
  avatarStyle: ReturnType<typeof getRoomAvatarStyle>
}) => {
  const [imageFailed, setImageFailed] = useState(false)
  const profileImageUrl = isDirectChatRoom(room)
    ? getProfileImageUrlByFileId(room.prflImgFileId)
    : null
  const showProfileImage = Boolean(profileImageUrl) && !imageFailed

  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold ${avatarStyle.className}`}
    >
      {/* 1:1 채팅방은 ChatRoomResponse.prflImgFileId를 파일 이미지 URL로 변환해서 표시합니다. */}
      {showProfileImage ? (
        <img
          src={profileImageUrl ?? ''}
          alt={`${room.name} 프로필`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="max-w-[32px] truncate px-1">{avatarStyle.label}</span>
      )}

      {/* status 값이 있을 때 프로필 오른쪽 아래에 작은 상태 점을 보여줍니다. */}
      {room.status && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${getStatusDotClassName(room.status)}`}
        />
      )}
    </div>
  )
}

interface MessengerRoomListProps {
  activeTab: ChatTab
  rooms: ChatRoom[]
  selectedRoomId: number | null
  createMode: boolean
  onChangeTab: (tab: ChatTab) => void
  onSelectRoom: (roomId: number) => void
  onClickCreate: () => void
}

const MessengerRoomList = ({
  activeTab,
  rooms,
  selectedRoomId,
  createMode,
  onChangeTab,
  onSelectRoom,
  onClickCreate,
}: MessengerRoomListProps) => {
  return (
    <aside className="flex w-[250px] flex-col border-r border-slate-200">
      <div className="h-16 border-b border-slate-200 p-3">
        {/* 공통 SearchInput을 재사용해서 메신저 검색창 디자인을 통일합니다. */}
        <SearchInput placeholder="검색" aria-label="메신저 검색" />
      </div>

      <div className="grid h-9 grid-cols-3 border-b border-slate-200">
        {/* 탭은 왼쪽 영역 전체 너비를 3등분해서 사용합니다. */}
        {chatTabs.map((tab) => {
          const selected = activeTab === tab.value

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChangeTab(tab.value)}
              className={`relative text-sm font-semibold transition-colors ${
                selected
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.label}

              {/* 선택된 탭 아래에 파란 선을 보여줘서 현재 탭을 명확하게 표시합니다. */}
              {selected && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rooms.map((room) => {
          // 새 대화 폼을 보는 중에는 기존 채팅방이 선택된 것처럼 보이지 않게 합니다.
          const selected = !createMode && room.id === selectedRoomId
          const avatarStyle = getRoomAvatarStyle(room)
          const latestMessage = getSafeText(room.lastMessage)
          const participantCount = getParticipantCount(room)

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room.id)}
              className={`flex min-h-[64px] w-full gap-3 rounded-lg p-2 text-left transition-colors ${
                selected ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <RoomAvatar room={room} avatarStyle={avatarStyle} />

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                    <p className="min-w-0 truncate text-sm font-bold text-slate-900">
                      {room.name}
                    </p>

                    {/* 1:1 채팅방일 때만 부서명을 작고 연하게 보여줍니다. */}
                    {getRoomListDepartment(room) && (
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {getRoomListDepartment(room)}
                      </span>
                    )}

                    {/* 1:1이 아닌 채팅방은 제목 옆에 참여자 수를 작고 연하게 표시합니다. */}
                    {!isDirectChatRoom(room) && participantCount !== null && (
                      <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                        {participantCount}명
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-[10px] text-slate-400">
                    {room.lastTime}
                  </span>
                </div>

                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <p
                    className={`min-w-0 flex-1 truncate text-xs ${
                      latestMessage
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {latestMessage}
                  </p>

                  {/* unreadCount가 1개 이상일 때만 읽지 않은 메시지 배지를 표시합니다. */}
                  {room.unreadCount > 0 && (
                    <Badge variant="danger" size="count">
                      {room.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-slate-200 p-3">
        {/* 이 버튼을 누르면 오른쪽 영역이 새 대화 생성 폼으로 바뀝니다. */}
        <button
          type="button"
          onClick={onClickCreate}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        >
          <PencilLine size={16} />
          새 대화
        </button>
      </div>
    </aside>
  )
}

export default MessengerRoomList
