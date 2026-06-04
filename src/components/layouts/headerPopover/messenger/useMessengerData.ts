import messengerApi from '../../../../api/messengerApi'
import { useApi } from '../../../../hooks/useApi'
import type { CreateChatRoomRequestDto } from '../../../../types/messenger.dto'

export const useMessengerData = () => {
  const roomsApi = useApi(messengerApi.getChats, { immediate: false })
  const messagesApi = useApi(messengerApi.getMessages, { immediate: false })
  const createChatApi = useApi(messengerApi.createChat, { immediate: false })

  const createChat = (payload: CreateChatRoomRequestDto) =>
    createChatApi.execute(payload)

  return {
    rooms: roomsApi.data ?? null,
    messages: messagesApi.data ?? null,
    loadRooms: roomsApi.execute,
    loadMessages: messagesApi.execute,
    createChat,
    loading: roomsApi.loading || messagesApi.loading || createChatApi.loading,
    error: roomsApi.error ?? messagesApi.error ?? createChatApi.error,
  }
}
