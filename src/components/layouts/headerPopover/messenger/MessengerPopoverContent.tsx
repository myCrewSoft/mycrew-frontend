import { useMemo, useState } from 'react'
import type { ChatTab, MessengerViewMode } from './messenger.types'
import MessengerChatPanel from './MessengerChatPanel'
import MessengerCreateForm from './MessengerCreateForm'
import MessengerRoomList from './MessengerRoomList'
import { useMessengerData } from './useMessengerData'

const MessengerPopoverContent = () => {
  // 메신저 API 상태를 관리하는 커스텀 훅입니다.
  // 내부에서 useApi를 사용하므로 AA 가이드의 API 호출 규칙을 따릅니다.
  const {
    rooms: apiRooms,
    messages: apiMessages,
    members: apiMembers,
    createChat,
  } = useMessengerData()

  // viewMode는 오른쪽 영역이 기존 채팅 화면인지, 새 대화 생성 폼인지 구분합니다.
  const [viewMode, setViewMode] = useState<MessengerViewMode>('chat')

  // activeTab은 현재 선택된 탭입니다. 전체, 그룹, 프로젝트 중 하나가 들어갑니다.
  const [activeTab, setActiveTab] = useState<ChatTab>('all')

  // selectedRoomId는 사용자가 왼쪽 목록에서 선택한 채팅방 id입니다. 아직 목록이 없을 수 있으므로 null을 허용합니다.
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  // messageText는 아래 입력창에 사용자가 입력 중인 메시지입니다.
  const [messageText, setMessageText] = useState('')

  // 아래 상태들은 새 대화 생성 폼에서 사용하는 값입니다.
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])

  // API 데이터가 아직 없으면 빈 배열로 처리합니다.
  // 연결 실패/빈 상태 전용 화면은 나중에 이 지점에서 붙이면 됩니다.
  const roomSource = apiRooms ?? []
  const messageSource = apiMessages ?? []
  const memberSource = apiMembers ?? []

  // 탭이 바뀔 때마다 보여줄 채팅방 목록을 계산합니다.
  const filteredRooms = useMemo(() => {
    if (activeTab === 'all') return roomSource
    return roomSource.filter((room) => room.type === activeTab)
  }, [activeTab, roomSource])

  // 현재 선택된 채팅방 정보를 찾습니다.
  // 현재 선택된 채팅방입니다. 아직 목록이 없거나 선택 전이면 undefined가 됩니다.
  const selectedRoom = roomSource.find((room) => room.id === selectedRoomId)

  // 검색어에 맞는 참여자만 보여줍니다.
  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim()

    if (!keyword) return memberSource

    return memberSource.filter((member) =>
      `${member.name} ${member.department} ${member.jobTitle}`.includes(keyword),
    )
  }, [memberSearch, memberSource])

  // 선택한 참여자 id 목록을 실제 참여자 객체 목록으로 바꿉니다.
  const selectedMembers = useMemo(
    () =>
      memberSource.filter((member) => selectedMemberIds.includes(member.id)),
    [memberSource, selectedMemberIds],
  )

  const handleToggleMember = (memberId: number) => {
    // 이미 선택된 구성원을 다시 누르면 제거하고, 선택되지 않은 구성원을 누르면 추가합니다.
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    )
  }

  const handleCreateChat = () => {
    // 대화 시작 버튼을 누르면 백엔드 채팅방 생성 API를 호출합니다.
    // 성공 후 새 채팅방으로 이동하거나 목록을 다시 조회하는 처리는 다음 단계에서 이어 붙이면 됩니다.
    void createChat({
      chatName: newRoomName.trim() || undefined,
      chatDescription: newRoomDescription.trim() || undefined,
      participantIds: selectedMemberIds,
    })
  }

  return (
    <div className="flex h-[560px] w-full overflow-hidden bg-white">
      {/* 왼쪽 목록은 항상 보이고, 오른쪽 영역만 채팅 화면/새 대화 폼으로 교체됩니다. */}
      <MessengerRoomList
        activeTab={activeTab}
        rooms={filteredRooms}
        selectedRoomId={selectedRoomId}
        createMode={viewMode === 'create'}
        onChangeTab={setActiveTab}
        onSelectRoom={(roomId) => {
          setSelectedRoomId(roomId)
          setViewMode('chat')
        }}
        onClickCreate={() => setViewMode('create')}
      />

      {viewMode === 'create' ? (
        <MessengerCreateForm
          roomName={newRoomName}
          roomDescription={newRoomDescription}
          memberSearch={memberSearch}
          members={filteredMembers}
          selectedMembers={selectedMembers}
          selectedMemberIds={selectedMemberIds}
          onChangeRoomName={setNewRoomName}
          onChangeRoomDescription={setNewRoomDescription}
          onChangeMemberSearch={setMemberSearch}
          onToggleMember={handleToggleMember}
          onCreate={handleCreateChat}
          onCancel={() => setViewMode('chat')}
        />
      ) : selectedRoom ? (
        <MessengerChatPanel
          room={selectedRoom}
          messages={messageSource}
          messageText={messageText}
          onChangeMessageText={setMessageText}
        />
      ) : (
        // 아직 선택된 채팅방이 없을 때의 자리입니다.
        // 나중에 연결 실패 화면 또는 빈 상태 화면을 이 영역에 교체해서 넣으면 됩니다.
        <section className="flex min-w-0 flex-1 bg-white" />
      )}
    </div>
  )
}

export default MessengerPopoverContent
