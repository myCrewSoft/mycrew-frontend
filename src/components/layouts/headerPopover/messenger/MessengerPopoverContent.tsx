import { useEffect, useMemo, useRef, useState } from 'react'
import { fileApi } from '../../../../api/fileApi'
import type { ChatRoom, ChatTab, MessengerViewMode } from './messenger.types'
import MessengerChatPanel from './MessengerChatPanel'
import MessengerCreateForm from './MessengerCreateForm'
import MessengerRoomList from './MessengerRoomList'
import MessengerRoomInfoPanel from './MessengerRoomInfoPanel'
import { useMessengerSocketContext } from './MessengerSocketProvider'
import { matchesChatTab } from './messenger.utils'
import { useMessengerData } from './useMessengerData'
import type { ChatMessageResponse } from '../../../../types'

const mergeUniqueMessages = (messages: ChatMessageResponse[]) => {
  const savedMessageIds = new Set<number>()

  // REST 과거 메시지와 WebSocket 실시간 메시지를 합칠 때 같은 저장 메시지 id는 한 번만 보여줍니다.
  return messages.filter((message) => {
    if (message.id <= 0) return true

    if (savedMessageIds.has(message.id)) return false

    savedMessageIds.add(message.id)
    return true
  })
}

const applyRealtimeUnreadCounts = (
  messages: ChatMessageResponse[],
  selectedRoomId: number | null,
  messageUnreadCountsById: Record<number, number>,
  lastReadMessageIdByRoomId: Record<number, number>,
) => {
  const lastReadMessageId =
    selectedRoomId !== null ? lastReadMessageIdByRoomId[selectedRoomId] : undefined

  // READ_CHANGED 이벤트는 REST로 불러온 메시지에도 덮어씌워야 화면 숫자가 실시간으로 사라집니다.
  return messages.map((message) => {
    const exactUnreadCount = messageUnreadCountsById[message.id]

    if (exactUnreadCount !== undefined) {
      return { ...message, unreadCount: exactUnreadCount }
    }

    if (
      lastReadMessageId !== undefined &&
      message.mine &&
      message.id > 0 &&
      message.id <= lastReadMessageId
    ) {
      return { ...message, unreadCount: 0 }
    }

    return message
  })
}

const MessengerPopoverContent = () => {
  const {
    messages: apiMessages,
    loadRoomDetail,
    loadMessages,
    markAsRead,
    createChat,
    updateChat,
    deleteChat,
    addParticipants,
    removeParticipants,
  } = useMessengerData()
  const {
    rooms: socketRooms,
    messagesByRoomId,
    messageUnreadCountsById,
    lastReadMessageIdByRoomId,
    reloadRooms,
    sendMessage,
    markRoomAsRead,
    setActiveChatId,
  } = useMessengerSocketContext()

  const [viewMode, setViewMode] = useState<MessengerViewMode>('chat')
  const [activeTab, setActiveTab] = useState<ChatTab>('all')

  // selectedRoomId는 왼쪽 목록에서 선택한 채팅방 id이며 선택 전에는 null입니다.
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [messageText, setMessageText] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [newRoomImageFile, setNewRoomImageFile] = useState<File | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [roomDetail, setRoomDetail] = useState<ChatRoom | null>(null)
  const lastMarkedReadMessageIdByRoomRef = useRef<Record<number, number>>({})

  // Provider가 관리하는 최신 채팅방 목록을 화면용 배열로 사용합니다.
  const roomSource = useMemo(() => socketRooms, [socketRooms])

  // 선택한 채팅방의 과거 메시지 REST 응답을 빈 배열로 보정합니다.
  const messageSource = useMemo(() => apiMessages ?? [], [apiMessages])

  const filteredRooms = useMemo(() => {
    return roomSource.filter((room) => matchesChatTab(room, activeTab))
  }, [activeTab, roomSource])

  // 현재 선택된 채팅방 id로 상세 표시할 방을 찾습니다.
  const selectedRoom = roomSource.find((room) => room.id === selectedRoomId)
  // 생성 직후에는 목록 재조회보다 단건 조회가 먼저 끝날 수 있으므로 채팅 패널도 상세 데이터를 fallback으로 사용합니다.
  const selectedRoomForChat = selectedRoom ?? (
    roomDetail?.id === selectedRoomId ? roomDetail : undefined
  )
  // 정보창은 목록 데이터보다 상세 조회 데이터를 우선 사용해야 참가자 목록까지 표시됩니다.
  const selectedRoomForInfo = roomDetail?.id === selectedRoomId ? roomDetail : selectedRoom

  // REST로 불러온 이전 메시지와 WebSocket으로 받은 새 메시지를 합쳐서 화면에 보여줍니다.
  const visibleMessages = useMemo(
    () =>
      applyRealtimeUnreadCounts(
        mergeUniqueMessages([
          ...messageSource,
          ...(selectedRoomId ? (messagesByRoomId[selectedRoomId] ?? []) : []),
        ]),
        selectedRoomId,
        messageUnreadCountsById,
        lastReadMessageIdByRoomId,
      ),
    [
      lastReadMessageIdByRoomId,
      messageSource,
      messageUnreadCountsById,
      messagesByRoomId,
      selectedRoomId,
    ],
  )

  const uploadRoomImage = async (file: File | null) => {
    if (!file) return null

    const response = await fileApi.uploadBoardFile({
      file,
      fileCn: '채팅방 이미지',
    })

    return response.data.data ?? null
  }

  const handleCreateChat = async () => {
    const chatRoomImageAtchFileId = await uploadRoomImage(newRoomImageFile)

    void createChat({
      chatName: newRoomName.trim(),
      chatDescription: newRoomDescription.trim(),
      chatRoomImageAtchFileId,
      participantIds: selectedMemberIds,
    }).then((response) => {
      const createdRoomId = response.data

      if (createdRoomId) {
        // 생성 성공 후에는 생성 폼을 닫고 새로 만들어진 채팅방을 바로 선택합니다.
        setSelectedRoomId(createdRoomId)
        setViewMode('chat')
        setNewRoomName('')
        setNewRoomDescription('')
        setNewRoomImageFile(null)
        setSelectedMemberIds([])

        // 목록 갱신 전에도 오른쪽 채팅방 헤더가 바로 보이도록 단건 상세를 먼저 가져옵니다.
        void loadRoomDetail(createdRoomId).then((detailResponse) => {
          if (detailResponse.data) {
            setRoomDetail(detailResponse.data)
          }
        })
      }

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

  const handleUpdateRoom = (payload: {
    chatName: string
    chatDescription: string
    imageFile: File | null
    removeImage: boolean
  }) => {
    if (!selectedRoomId) return

    void uploadRoomImage(payload.imageFile)
      .then((uploadedImageId) =>
        updateChat(selectedRoomId, {
          chatName: payload.chatName,
          chatDescription: payload.chatDescription,
          chatRoomImageAtchFileId: payload.removeImage
            ? null
            : (uploadedImageId ??
              selectedRoomForInfo?.chatRoomImageAtchFileId ??
              null),
        }),
      )
      .then(() => {
        // 이름/설명 수정 후 왼쪽 방 목록과 오른쪽 헤더 정보를 최신값으로 다시 불러옵니다.
        reloadRooms()
        void loadRoomDetail(selectedRoomId).then((response) => {
          if (response.data) {
            setRoomDetail(response.data)
          }
        })
      })
  }

  const handleAddParticipants = (participantIds: number[]) => {
    if (!selectedRoomId) return

    void addParticipants(selectedRoomId, { participantIds }).then(() => {
      // 참여자 변경 이벤트가 오더라도 REST 목록을 다시 맞춰 화면 정보를 안정적으로 갱신합니다.
      reloadRooms()
      void loadRoomDetail(selectedRoomId).then((response) => {
        if (response.data) {
          setRoomDetail(response.data)
        }
      })
    })
  }

  const handleRemoveParticipants = (participantIds: number[]) => {
    if (!selectedRoomId) return

    void removeParticipants(selectedRoomId, { participantIds }).then(() => {
      reloadRooms()
      void loadRoomDetail(selectedRoomId).then((response) => {
        if (response.data) {
          setRoomDetail(response.data)
        }
      })
    })
  }

  const handleLeaveRoom = () => {
    if (!selectedRoomId) return

    void deleteChat(selectedRoomId).then(() => {
      // 나간 방은 더 이상 선택 상태로 두면 안 되므로 오른쪽 패널을 비우고 목록을 갱신합니다.
      setSelectedRoomId(null)
      setViewMode('chat')
      reloadRooms()
    })
  }

  const handleOpenRoomInfo = () => {
    if (!selectedRoomId) return

    setViewMode('info')
    // 채팅방 정보창에는 참가자 목록이 필요하므로 단건 조회 결과를 별도로 저장합니다.
    void loadRoomDetail(selectedRoomId).then((response) => {
      if (response.data) {
        setRoomDetail(response.data)
      }
    })
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

  useEffect(() => {
    if (!selectedRoomId) return

    const lastMessage = visibleMessages.at(-1)

    // 현재 보고 있는 방에 상대 메시지가 새로 도착하면 바로 읽음 처리 API를 호출합니다.
    // 이 PATCH가 성공하면 백엔드가 READ_CHANGED를 방 topic 전체로 broadcast합니다.
    if (!lastMessage || lastMessage.mine || lastMessage.id <= 0) return

    if (lastMarkedReadMessageIdByRoomRef.current[selectedRoomId] === lastMessage.id) {
      return
    }

    lastMarkedReadMessageIdByRoomRef.current[selectedRoomId] = lastMessage.id
    void markAsRead(selectedRoomId, lastMessage.id).finally(() => {
      reloadRooms()
    })
  }, [markAsRead, reloadRooms, selectedRoomId, visibleMessages])

  return (
    <div className="flex h-[560px] w-full overflow-hidden bg-white">
      <MessengerRoomList
        activeTab={activeTab}
        rooms={filteredRooms}
        selectedRoomId={selectedRoomId}
        createMode={viewMode === 'create'}
        onChangeTab={setActiveTab}
        onSelectRoom={(roomId) => {
          setSelectedRoomId(roomId)
          setRoomDetail(null)
          setViewMode('chat')
        }}
        onClickCreate={() => setViewMode('create')}
      />

      {viewMode === 'create' ? (
        <MessengerCreateForm
          roomName={newRoomName}
          roomDescription={newRoomDescription}
          selectedMemberIds={selectedMemberIds}
          onChangeRoomName={setNewRoomName}
          onChangeRoomDescription={setNewRoomDescription}
          onChangeRoomImageFile={setNewRoomImageFile}
          onChangeSelectedMembers={setSelectedMemberIds}
          onCreate={handleCreateChat}
          onCancel={() => setViewMode('chat')}
        />
      ) : viewMode === 'info' && selectedRoomForInfo ? (
        <MessengerRoomInfoPanel
          key={selectedRoomForInfo.id}
          room={selectedRoomForInfo}
          onBack={() => setViewMode('chat')}
          onUpdateRoom={handleUpdateRoom}
          onAddParticipants={handleAddParticipants}
          onRemoveParticipants={handleRemoveParticipants}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : selectedRoomForChat ? (
        <MessengerChatPanel
          room={selectedRoomForChat}
          messages={visibleMessages}
          messageText={messageText}
          onChangeMessageText={setMessageText}
          onSendMessage={handleSendMessage}
          onOpenRoomInfo={handleOpenRoomInfo}
        />
      ) : (
        // 선택된 채팅방이 없을 때 오른쪽 영역을 비워 레이아웃을 유지합니다.
        <section className="flex min-w-0 flex-1 bg-white" />
      )}
    </div>
  )
}

export default MessengerPopoverContent
