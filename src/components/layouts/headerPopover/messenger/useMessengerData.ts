import { useCallback } from 'react'
import messengerApi from '../../../../api/messengerApi'
import { useApi } from '../../../../hooks/useApi'
import type {
  AddParticipantsRequest,
  CreateChatRoomRequest,
  RemoveParticipantsRequest,
  UpdateChatRoomRequest,
} from '../../../../types'

export const useMessengerData = () => {
  const roomsApi = useApi(messengerApi.getChats, { immediate: false })
  const roomDetailApi = useApi(messengerApi.getChat, { immediate: false })
  const messagesApi = useApi(messengerApi.getMessages, { immediate: false })
  const createChatApi = useApi(messengerApi.createChat, { immediate: false })
  const updateChatApi = useApi(messengerApi.updateChat, { immediate: false })
  const deleteChatApi = useApi(messengerApi.deleteChat, { immediate: false })
  const addParticipantsApi = useApi(messengerApi.addParticipants, {
    immediate: false,
  })
  const removeParticipantsApi = useApi(messengerApi.removeParticipants, {
    immediate: false,
  })
  const {
    execute: executeUpdateParticipantStatus,
    loading: updatingParticipantStatus,
    error: updateParticipantStatusError,
  } = useApi(messengerApi.updateParticipantStatus, { immediate: false })
  const markAsReadApi = useApi(messengerApi.markAsRead, { immediate: false })

  const createChat = (payload: CreateChatRoomRequest) =>
    createChatApi.execute(payload)

  const updateChat = (chatId: number, payload: UpdateChatRoomRequest) =>
    updateChatApi.execute(chatId, payload)

  const deleteChat = (chatId: number) => deleteChatApi.execute(chatId)

  const addParticipants = (
    chatId: number,
    payload: AddParticipantsRequest,
  ) => addParticipantsApi.execute(chatId, payload)

  const removeParticipants = (
    chatId: number,
    payload: RemoveParticipantsRequest,
  ) => removeParticipantsApi.execute(chatId, payload)

  const updateParticipantStatus = useCallback(
    (ptcptSttusCd: string) => executeUpdateParticipantStatus(ptcptSttusCd),
    [executeUpdateParticipantStatus],
  )

  return {
    rooms: roomsApi.data ?? null,
    roomDetail: roomDetailApi.data ?? null,
    messages: messagesApi.data ?? null,
    loadRooms: roomsApi.execute,
    loadRoomDetail: roomDetailApi.execute,
    loadMessages: messagesApi.execute,
    markAsRead: markAsReadApi.execute,
    createChat,
    updateChat,
    deleteChat,
    addParticipants,
    removeParticipants,
    updateParticipantStatus,
    loading:
      roomsApi.loading ||
      roomDetailApi.loading ||
      messagesApi.loading ||
      createChatApi.loading ||
      updateChatApi.loading ||
      deleteChatApi.loading ||
      addParticipantsApi.loading ||
      removeParticipantsApi.loading ||
      updatingParticipantStatus ||
      markAsReadApi.loading,
    error:
      roomsApi.error ??
      roomDetailApi.error ??
      messagesApi.error ??
      createChatApi.error ??
      updateChatApi.error ??
      deleteChatApi.error ??
      addParticipantsApi.error ??
      removeParticipantsApi.error ??
      updateParticipantStatusError ??
      markAsReadApi.error,
  }
}
