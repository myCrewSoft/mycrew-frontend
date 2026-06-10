import { Client } from '@stomp/stompjs'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessageResponse } from '../../../../types'

export interface ChatMessageRequestPayload {
  content: string
}

type MessengerSocketEventType =
  | 'MESSAGE_CREATED'
  | 'PARTICIPANT_ADDED'
  | 'PARTICIPANT_REMOVED'
  | 'PARTICIPANT_STATUS_CHANGED'
  | 'READ_CHANGED'

interface ParticipantChangedEventPayload {
  chatRoomId: number
  participantIds: number[]
}

interface ParticipantStatusChangedEventPayload {
  empId: number
  ptcptSttusCd: string
}

interface ReadChangedEventPayload {
  chatRoomId: number
  empId: number
  messageId: number
  lastCfmtnMsgId: number
  unreadCount: number
}

type MessengerSocketEvent =
  | {
      type: 'MESSAGE_CREATED'
      data: ChatMessageResponse
    }
  | {
      type: 'PARTICIPANT_ADDED'
      data: ParticipantChangedEventPayload
    }
  | {
      type: 'PARTICIPANT_REMOVED'
      data: ParticipantChangedEventPayload
    }
  | {
      type: 'PARTICIPANT_STATUS_CHANGED'
      data: ParticipantStatusChangedEventPayload
    }
  | {
      type: 'READ_CHANGED'
      data: ReadChangedEventPayload
    }

// SockJS를 사용하지 않는 STOMP 연결 주소입니다.
// 백엔드 WebSocketConfig의 endpoint가 바뀌면 이 값만 수정하면 됩니다.
const MESSENGER_SOCKET_URL = 'ws://localhost:80/ws/chat'

// 채팅방별 이벤트를 받을 구독 주소입니다.
const getSubscribeDestination = (chatId: number) =>
  `/topic/chats/${chatId}/events`

// 전체 참여자 상태 이벤트를 받을 구독 주소입니다.
const STATUS_SUBSCRIBE_DESTINATION = '/topic/chats/status'

// 메시지를 보낼 publish 주소입니다.
// 백엔드 @MessageMapping 경로와 맞아야 합니다.
const getPublishDestination = (chatId: number) =>
  `/app/chats/${chatId}/messages`

// 채팅방 id별로 WebSocket으로 새로 수신한 메시지를 보관합니다.
// 같은 STOMP 연결 안에서 여러 채팅방을 구독하므로 roomId를 key로 나눠 저장합니다.
type MessengerSocketMessageMap = Record<number, ChatMessageResponse[]>
type MessengerSocketUnreadCountMap = Record<number, number>
type MessengerSocketMessageUnreadCountMap = Record<number, number>
type MessengerSocketLastReadMessageMap = Record<number, number>
type MessengerSocketLastMessageMap = Record<
  number,
  {
    content: string
    time: string
    order: number
  }
>

interface UseMessengerSocketOptions {
  activeChatId?: number | null
  onRoomsShouldRefresh?: () => void
}

const requestRoomsRefresh = (callback?: () => void) => {
  // WebSocket 메시지를 받은 직후 백엔드가 마지막 메시지/안 읽음 수를 갱신하는 타이밍과 겹칠 수 있습니다.
  // 아주 짧게 늦춰서 목록을 다시 조회하면 갱신된 값을 받을 가능성이 높아집니다.
  window.setTimeout(() => {
    callback?.()
  }, 100)
}

const getCurrentEmpId = () => {
  const empId = Number(localStorage.getItem('empId'))

  return Number.isFinite(empId) ? empId : null
}

// 실시간 broadcast 메시지는 백엔드가 mine을 비워서 보내고, 프론트가 senderId와 내 사번을 비교해 계산합니다.
// 히스토리 조회(getMsgList)는 백엔드가 이미 mine을 계산해서 내려주는 값 그대로 사용합니다.
const normalizeRealtimeMessage = (
  message: ChatMessageResponse,
): ChatMessageResponse => {
  const currentEmpId = getCurrentEmpId()

  return {
    ...message,
    mine: currentEmpId !== null && message.senderId === currentEmpId,
  }
}

// 현재 시간을 백엔드 ChatMessageResponse.time과 같은 HH:mm 형태로 만듭니다.
// 내가 보낸 메시지를 서버 응답 전에 먼저 화면에 보여주기 위해 사용합니다.
const createCurrentMessageTime = () =>
  new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isMessengerSocketEventType = (
  value: unknown,
): value is MessengerSocketEventType =>
  value === 'MESSAGE_CREATED' ||
  value === 'PARTICIPANT_ADDED' ||
  value === 'PARTICIPANT_REMOVED' ||
  value === 'PARTICIPANT_STATUS_CHANGED' ||
  value === 'READ_CHANGED'

const isChatMessageResponse = (
  value: unknown,
): value is ChatMessageResponse => {
  if (!isObjectRecord(value)) return false

  return typeof value.senderId === 'number' && typeof value.content === 'string'
}

const parseSocketEvent = (body: string): MessengerSocketEvent | null => {
  const parsedBody = JSON.parse(body) as unknown

  if (!isObjectRecord(parsedBody)) return null

  // 백엔드가 { type, data } 또는 { eventType, data } 형태로 보내는 이벤트를 처리합니다.
  const eventType = parsedBody.type ?? parsedBody.eventType

  if (isMessengerSocketEventType(eventType) && 'data' in parsedBody) {
    return {
      type: eventType,
      data: parsedBody.data,
    } as MessengerSocketEvent
  }

  // MESSAGE_CREATED만 ChatMessageResponse를 그대로 broadcast할 수 있어 raw DTO도 이벤트처럼 감쌉니다.
  if (isChatMessageResponse(parsedBody)) {
    return {
      type: 'MESSAGE_CREATED',
      data: parsedBody,
    }
  }

  return null
}

const hasSameSavedMessage = (
  messages: ChatMessageResponse[],
  nextMessage: ChatMessageResponse,
) =>
  // 백엔드에 저장된 메시지는 양수 id를 가지므로, 같은 id가 이미 있으면 같은 메시지로 판단합니다.
  nextMessage.id > 0 && messages.some((message) => message.id === nextMessage.id)

const replaceOptimisticMessage = (
  messages: ChatMessageResponse[],
  savedMessage: ChatMessageResponse,
) => {
  const optimisticMessageIndex = messages.findIndex(
    (message) =>
      // 내가 보낸 임시 메시지는 서버 저장 전이라 음수 id를 사용합니다.
      message.id < 0 &&
      message.senderId === savedMessage.senderId &&
      message.content === savedMessage.content,
  )

  if (optimisticMessageIndex < 0) return null

  return messages.map((message, index) =>
    index === optimisticMessageIndex ? savedMessage : message,
  )
}

// 로그인 사용자가 참여 중인 모든 채팅방의 STOMP 연결, 구독, 메시지 전송을 관리하는 훅입니다.
// 그룹웨어 메신저는 새 메시지 알림이 중요하므로 특정 방을 열 때가 아니라 로그인 세션 동안 연결합니다.
export const useMessengerSocket = (
  chatIds: number[],
  options: UseMessengerSocketOptions = {},
) => {
  const clientRef = useRef<Client | null>(null)
  const subscriptionsRef = useRef<StompSubscription[]>([])
  const pendingSentMessagesRef = useRef<Record<number, string[]>>({})
  const activeChatIdRef = useRef(options.activeChatId)
  const onRoomsShouldRefreshRef = useRef(options.onRoomsShouldRefresh)
  const chatIdsKey = chatIds.join(',')

  const [connected, setConnected] = useState(false)
  const [messagesByRoomId, setMessagesByRoomId] =
    useState<MessengerSocketMessageMap>({})
  const [unreadCountsByRoomId, setUnreadCountsByRoomId] =
    useState<MessengerSocketUnreadCountMap>({})
  const [messageUnreadCountsById, setMessageUnreadCountsById] =
    useState<MessengerSocketMessageUnreadCountMap>({})
  const [lastReadMessageIdByRoomId, setLastReadMessageIdByRoomId] =
    useState<MessengerSocketLastReadMessageMap>({})
  const [lastMessageByRoomId, setLastMessageByRoomId] =
    useState<MessengerSocketLastMessageMap>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    activeChatIdRef.current = options.activeChatId
    onRoomsShouldRefreshRef.current = options.onRoomsShouldRefresh
  }, [options.activeChatId, options.onRoomsShouldRefresh])

  useEffect(() => {
    // 참여 중인 채팅방이 없으면 구독할 대상도 없으므로 연결하지 않습니다.
    if (chatIds.length === 0) {
      setConnected(false)
      setError(null)
      return
    }

    let active = true
    const accessToken = localStorage.getItem('accessToken')

    // STOMP Client는 WebSocket 연결 객체 역할을 합니다.
    // reconnectDelay를 주면 연결이 잠깐 끊겼을 때 자동 재연결을 시도합니다.
    const client = new Client({
      brokerURL: MESSENGER_SOCKET_URL,
      reconnectDelay: 5000,
      connectHeaders: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
      onConnect: () => {
        if (!active) return

        setConnected(true)
        setError(null)

        const handleMessageCreated = (
          chatId: number,
          message: ChatMessageResponse,
        ) => {
          const receivedMessage = normalizeRealtimeMessage(message)
          const targetChatId = receivedMessage.chatRoomId || chatId

          // 방 목록의 최근 메시지는 REST 재조회 전에도 WebSocket 수신값으로 즉시 갱신합니다.
          setLastMessageByRoomId((prevLastMessageByRoomId) => ({
            ...prevLastMessageByRoomId,
            [targetChatId]: {
              content: receivedMessage.content,
              time: receivedMessage.time,
              order: Date.now(),
            },
          }))
          const pendingMessages = pendingSentMessagesRef.current[targetChatId] ?? []
          const pendingMessageIndex = pendingMessages.findIndex(
            (content) => content === receivedMessage.content,
          )

          // 서버가 내가 보낸 메시지를 다시 broadcast하면 pending 목록에서 제거합니다.
          if (pendingMessageIndex >= 0) {
            pendingSentMessagesRef.current[targetChatId] = pendingMessages.filter(
              (_, index) => index !== pendingMessageIndex,
            )
          }

          setMessagesByRoomId((prevMessagesByRoomId) => {
            const currentMessages = prevMessagesByRoomId[targetChatId] ?? []

            // 같은 WebSocket 이벤트가 두 번 들어와도 화면에는 한 번만 추가합니다.
            if (hasSameSavedMessage(currentMessages, receivedMessage)) {
              return prevMessagesByRoomId
            }

            const replacedMessages = replaceOptimisticMessage(
              currentMessages,
              receivedMessage,
            )

            // 내가 보낸 임시 메시지가 있으면 새 말풍선을 추가하지 않고 실제 저장 메시지로 교체합니다.
            if (replacedMessages) {
              return {
                ...prevMessagesByRoomId,
                [targetChatId]: replacedMessages,
              }
            }

            return {
              ...prevMessagesByRoomId,
              [targetChatId]: [...currentMessages, receivedMessage],
            }
          })

          // 내가 보낸 메시지가 아니고 현재 보고 있는 방도 아니라면 unread로 계산합니다.
          if (!receivedMessage.mine && activeChatIdRef.current !== targetChatId) {
            setUnreadCountsByRoomId((prevUnreadCountsByRoomId) => ({
              ...prevUnreadCountsByRoomId,
              [targetChatId]: (prevUnreadCountsByRoomId[targetChatId] ?? 0) + 1,
            }))
          }

          // 새 메시지가 오면 왼쪽 방 목록의 마지막 메시지/시간/unreadCount를 다시 맞춥니다.
          requestRoomsRefresh(onRoomsShouldRefreshRef.current)
        }

        const handleReadChanged = (
          chatRoomId: number,
          messageId: number,
          lastCfmtnMsgId: number,
          unreadCount: number,
        ) => {
          // READ_CHANGED는 REST로 불러온 메시지에도 반영해야 하므로 메시지 id별 unreadCount를 따로 기억합니다.
          setMessageUnreadCountsById((prevUnreadCountsById) => ({
            ...prevUnreadCountsById,
            [messageId]: unreadCount,
          }))
          setLastReadMessageIdByRoomId((prevLastReadMessageIdByRoomId) => ({
            ...prevLastReadMessageIdByRoomId,
            [chatRoomId]: Math.max(
              prevLastReadMessageIdByRoomId[chatRoomId] ?? 0,
              lastCfmtnMsgId,
            ),
          }))

          // WebSocket으로 새로 받은 메시지 배열도 즉시 갱신해서 화면 반응을 빠르게 만듭니다.
          setMessagesByRoomId((prevMessagesByRoomId) => ({
            ...prevMessagesByRoomId,
            [chatRoomId]: (prevMessagesByRoomId[chatRoomId] ?? []).map(
              (message) =>
                message.id === messageId ||
                (message.mine && message.id > 0 && message.id <= lastCfmtnMsgId)
                  ? { ...message, unreadCount }
                  : message,
            ),
          }))
        }

        const handleSocketEvent = (
          chatId: number | null,
          event: MessengerSocketEvent,
        ) => {
          switch (event.type) {
            case 'MESSAGE_CREATED':
              if (chatId !== null) {
                handleMessageCreated(chatId, event.data)
              }
              return
            case 'READ_CHANGED':
              handleReadChanged(
                event.data.chatRoomId,
                event.data.messageId,
                event.data.lastCfmtnMsgId,
                event.data.unreadCount,
              )
              requestRoomsRefresh(onRoomsShouldRefreshRef.current)
              return
            case 'PARTICIPANT_ADDED':
            case 'PARTICIPANT_REMOVED':
            case 'PARTICIPANT_STATUS_CHANGED':
              requestRoomsRefresh(onRoomsShouldRefreshRef.current)
              return
            default:
              return
          }
        }

        // 연결 성공 후 내가 참여 중인 모든 채팅방 이벤트 topic을 구독합니다.
        const roomSubscriptions = chatIds.map((chatId) =>
          client.subscribe(getSubscribeDestination(chatId), (message: IMessage) => {
            const socketEvent = parseSocketEvent(message.body)

            if (!socketEvent) return

            handleSocketEvent(chatId, socketEvent)
          }),
        )

        // 전체 상태 topic은 채팅방과 무관한 참여자 상태 변경 이벤트를 받습니다.
        const statusSubscription = client.subscribe(
          STATUS_SUBSCRIBE_DESTINATION,
          (message: IMessage) => {
            const socketEvent = parseSocketEvent(message.body)

            if (!socketEvent) return

            handleSocketEvent(null, socketEvent)
          },
        )

        subscriptionsRef.current = [...roomSubscriptions, statusSubscription]
      },
      onDisconnect: () => {
        if (!active) return
        setConnected(false)
      },
      onStompError: (frame) => {
        if (!active) return
        setError(frame.headers.message ?? '메신저 연결 중 오류가 발생했습니다.')
      },
      onWebSocketError: () => {
        if (!active) return
        setError('메신저 서버에 연결할 수 없습니다.')
      },
    })

    clientRef.current = client
    client.activate()

    return () => {
      active = false
      subscriptionsRef.current.forEach((subscription) =>
        subscription.unsubscribe(),
      )
      subscriptionsRef.current = []
      clientRef.current = null
      setConnected(false)

      // 컴포넌트가 사라지거나 채팅방이 바뀌면 기존 연결을 정리합니다.
      void client.deactivate()
    }
  }, [chatIdsKey])

  const sendMessage = useCallback(
    (chatId: number, payload: ChatMessageRequestPayload) => {
      const client = clientRef.current

      // 연결 전에는 publish하지 않고 입력값을 유지할 수 있도록 false를 반환합니다.
      if (!client?.connected) {
        return false
      }

      const destination = getPublishDestination(chatId)
      const optimisticMessageTime = createCurrentMessageTime()

      pendingSentMessagesRef.current[chatId] = [
        ...(pendingSentMessagesRef.current[chatId] ?? []),
        payload.content,
      ]

      // 서버 broadcast를 기다리지 않고 내가 보낸 메시지는 즉시 오른쪽에 표시합니다.
      // 실제 저장된 메시지 id는 다음 REST 재조회 시 백엔드 값으로 다시 맞춰집니다.
      setLastMessageByRoomId((prevLastMessageByRoomId) => ({
        ...prevLastMessageByRoomId,
        [chatId]: {
          content: payload.content,
          time: optimisticMessageTime,
          order: Date.now(),
        },
      }))
      setMessagesByRoomId((prevMessagesByRoomId) => ({
        ...prevMessagesByRoomId,
        [chatId]: [
          ...(prevMessagesByRoomId[chatId] ?? []),
          {
            id: -Date.now(),
            chatRoomId: chatId,
            senderId: getCurrentEmpId() ?? 0,
            senderName: '나',
            content: payload.content,
            time: optimisticMessageTime,
            mine: true,
            read: false,
            unreadCount: 0,
          },
        ],
      }))

      client.publish({
        destination,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // 내가 보낸 메시지도 방 목록의 마지막 메시지/시간을 갱신해야 하므로 목록을 다시 조회합니다.
      requestRoomsRefresh(onRoomsShouldRefreshRef.current)

      return true
    },
    [],
  )

  const markRoomAsRead = useCallback((chatId: number) => {
    // 사용자가 해당 채팅방을 열면 WebSocket으로 받은 새 메시지 카운터를 0으로 되돌립니다.
    // 실제 DB 읽음 처리는 백엔드 읽음 처리 API와 연결하면 됩니다.
    setUnreadCountsByRoomId((prevUnreadCountsByRoomId) => ({
      ...prevUnreadCountsByRoomId,
      [chatId]: 0,
    }))
  }, [])

  return {
    connected,
    messagesByRoomId,
    unreadCountsByRoomId,
    messageUnreadCountsById,
    lastReadMessageIdByRoomId,
    lastMessageByRoomId,
    error,
    sendMessage,
    markRoomAsRead,
  }
}
