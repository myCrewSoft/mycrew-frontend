import messengerApi from '../../../../api/messengerApi'
import { useApi } from '../../../../hooks/useApi'
import type { CreateChatRoomRequestDto } from '../../../../types/messenger.dto'

// 메신저 화면에서 필요한 API 상태와 실행 함수를 한곳에 모으는 훅입니다.
// 컴포넌트가 axios나 DTO를 직접 알지 않게 하고, useApi 규칙에 맞춰 호출 상태를 관리합니다.
export const useMessengerData = () => {
  // immediate: false는 자동 호출하지 않는다는 뜻입니다.
  // 화면을 열 때, 채팅방을 선택할 때처럼 원하는 시점에 execute 함수를 호출할 수 있습니다.
  const roomsApi = useApi(messengerApi.getChats, { immediate: false })
  const messagesApi = useApi(messengerApi.getMessages, { immediate: false })
  const membersApi = useApi(messengerApi.searchMembers, { immediate: false })
  const createChatApi = useApi(messengerApi.createChat, { immediate: false })

  const createChat = (payload: CreateChatRoomRequestDto) =>
    createChatApi.execute(payload)

  return {
    // 백엔드 DTO가 프론트 화면 필드에 맞춰 내려온다는 전제이므로 별도 mapper 없이 그대로 사용합니다.
    rooms: roomsApi.data ?? null,
    messages: messagesApi.data ?? null,
    members: membersApi.data ?? null,
    loadRooms: roomsApi.execute,
    loadMessages: messagesApi.execute,
    searchMembers: membersApi.execute,
    createChat,
    loading:
      roomsApi.loading ||
      messagesApi.loading ||
      membersApi.loading ||
      createChatApi.loading,
    error:
      roomsApi.error ??
      messagesApi.error ??
      membersApi.error ??
      createChatApi.error,
  }
}
