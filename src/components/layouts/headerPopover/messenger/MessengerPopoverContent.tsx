import { useEffect, useMemo, useState } from 'react'
import type { ChatMember, ChatTab, MessengerViewMode } from './messenger.types'
import MessengerChatPanel from './MessengerChatPanel'
import MessengerCreateForm from './MessengerCreateForm'
import MessengerRoomList from './MessengerRoomList'
import { useMessengerSocketContext } from './MessengerSocketProvider'
import { matchesChatTab } from './messenger.utils'
import { useMessengerData } from './useMessengerData'

// 공통 사원 검색 API가 병합되면 이 배열 대신 실제 검색 결과를 전달합니다.
const EMPTY_MEMBERS: ChatMember[] = []

const MessengerPopoverContent = () => {
  // 메신저 API 상태를 관리하는 커스텀 훅입니다.
  // 내부에서 useApi를 사용하므로 AA 가이드의 API 호출 규칙을 따릅니다.
  const {
    messages: apiMessages,
    loadMessages,
    markAsRead,
    createChat,
  } = useMessengerData()
  const {
    rooms: socketRooms,
    messagesByRoomId,
    reloadRooms,
    sendMessage,
    markRoomAsRead,
    setActiveChatId,
  } = useMessengerSocketContext()

  // viewMode는 오른쪽 영역이 기존 채팅 화면인지, 새 대화 생성 폼인지 구분합니다.
  const [viewMode, setViewMode] = useState<MessengerViewMode>('chat')

  // activeTab은 현재 선택된 탭입니다. 전체, 그룹, 프로젝트 중 하나가 들어갑니다.
  const [activeTab, setActiveTab] = useState<ChatTab>('all')

  // selectedRoomId는 왼쪽 목록에서 선택한 채팅방 id이며 선택 전에는 null입니다.
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  // messageText는 아래 입력창에 사용자가 입력 중인 메시지입니다.
  const [messageText, setMessageText] = useState('')

  // 아래 상태들은 새 대화 생성 폼에서 사용하는 값입니다.
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])

  // Provider가 관리하는 최신 채팅방 목록을 화면용 배열로 사용합니다.
  const roomSource = useMemo(() => socketRooms, [socketRooms])

  // 선택한 채팅방의 과거 메시지 REST 응답을 빈 배열로 보정합니다.
  const messageSource = useMemo(() => apiMessages ?? [], [apiMessages])

  // 탭이 바뀔 때마다 보여줄 채팅방 목록을 계산합니다.
  const filteredRooms = useMemo(() => {
    return roomSource.filter((room) => matchesChatTab(room, activeTab))
  }, [activeTab, roomSource])

  // 현재 선택된 채팅방 id로 상세 표시할 방을 찾습니다.
  const selectedRoom = roomSource.find((room) => room.id === selectedRoomId)

  // REST로 불러온 이전 메시지와 WebSocket으로 받은 새 메시지를 합쳐서 화면에 보여줍니다.
  const visibleMessages = useMemo(
    () => [
      ...messageSource,
      ...(selectedRoomId ? (messagesByRoomId[selectedRoomId] ?? []) : []),
    ],
    [messageSource, messagesByRoomId, selectedRoomId],
  )

  const handleCreateChat = () => {
    // 대화 시작 버튼을 누르면 백엔드 채팅방 생성 API를 호출합니다.
    // 성공 후 새 채팅방으로 이동하거나 목록을 다시 조회하는 처리는 다음 단계에서 이어 붙이면 됩니다.
    void createChat({
      chatName: newRoomName.trim(),
      chatDescription: newRoomDescription.trim(),
      participantIds: selectedMemberIds,
    }).then(() => {
      // 새 채팅방이 생성되면 전역 방 목록을 다시 불러와 새 topic도 구독할 수 있게 합니다.
      reloadRooms()
    })
  }

  const handleSendMessage = () => {
    const content = messageText.trim()

    if (!content) return

    if (!selectedRoomId) return

    // WebSocket publish payload는 백엔드 ChatMessageRequest와 같은 모양입니다.
    const sent = sendMessage(selectedRoomId, { content })

    if (sent) {
      setMessageText('')
    }
  }

  // 사용자가 채팅방을 선택하면 해당 방의 이전 메시지를 REST로 조회합니다.
  useEffect(() => {
    setActiveChatId(selectedRoomId)

    if (!selectedRoomId) return

    markRoomAsRead(selectedRoomId)
    void loadMessages(selectedRoomId).then((response) => {
      const lastMessage = response.data?.at(-1)

      if (!lastMessage) {
        reloadRooms()
        return
      }

      // 방을 확인한 시점의 마지막 메시지 id를 백엔드에 알려 실제 읽음 상태를 갱신합니다.
      void markAsRead(selectedRoomId, lastMessage.id).finally(() => {
        reloadRooms()
      })
    })
    return () => {
      setActiveChatId(null)
    }
  }, [
    loadMessages,
    markAsRead,
    markRoomAsRead,
    reloadRooms,
    selectedRoomId,
    setActiveChatId,
  ])

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
          members={EMPTY_MEMBERS}
          selectedMemberIds={selectedMemberIds}
          onChangeRoomName={setNewRoomName}
          onChangeRoomDescription={setNewRoomDescription}
          onChangeMemberSearch={setMemberSearch}
          onChangeSelectedMembers={setSelectedMemberIds}
          onCreate={handleCreateChat}
          onCancel={() => setViewMode('chat')}
        />
      ) : selectedRoom ? (
        <MessengerChatPanel
          room={selectedRoom}
          messages={visibleMessages}
          messageText={messageText}
          onChangeMessageText={setMessageText}
          onSendMessage={handleSendMessage}
        />
      ) : (
        // 선택된 채팅방이 없을 때 오른쪽 영역을 비워 레이아웃을 유지합니다.
        <section className="flex min-w-0 flex-1 bg-white" />
      )}
    </div>
  )
}

export default MessengerPopoverContent
