import { useMemo, useState } from 'react'
import type { ChatTab, MessengerViewMode } from './messenger.types'
import MessengerChatPanel from './MessengerChatPanel'
import MessengerCreateForm from './MessengerCreateForm'
import MessengerRoomList from './MessengerRoomList'
import { useMessengerData } from './useMessengerData'

const MessengerPopoverContent = () => {
  const {
    rooms: apiRooms,
    messages: apiMessages,
    createChat,
  } = useMessengerData()

  const [viewMode, setViewMode] = useState<MessengerViewMode>('chat')
  const [activeTab, setActiveTab] = useState<ChatTab>('all')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [messageText, setMessageText] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])

  const roomSource = useMemo(() => apiRooms ?? [], [apiRooms])
  const messageSource = useMemo(() => apiMessages ?? [], [apiMessages])

  const filteredRooms = useMemo(() => {
    if (activeTab === 'all') return roomSource
    return roomSource.filter((room) => room.type === activeTab)
  }, [activeTab, roomSource])

  const selectedRoom = roomSource.find((room) => room.id === selectedRoomId)

  const handleCreateChat = () => {
    void createChat({
      chatName: newRoomName.trim() || undefined,
      chatDescription: newRoomDescription.trim() || undefined,
      participantIds: selectedMemberIds,
    })
  }

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
          onChangeSelectedMembers={setSelectedMemberIds}
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
        <section className="flex min-w-0 flex-1 bg-white" />
      )}
    </div>
  )
}

export default MessengerPopoverContent
