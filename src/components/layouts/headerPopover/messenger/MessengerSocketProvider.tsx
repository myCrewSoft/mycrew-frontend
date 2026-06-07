import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ChatMessageResponse, ChatRoomResponse } from '../../../../types'
import { useAuth } from '../../../../store/AuthContext'
import { useMessengerData } from './useMessengerData'
import { useMessengerSocket } from './useMessengerSocket'
import type { ChatMessageRequestPayload } from './useMessengerSocket'

interface MessengerSocketContextValue {
  rooms: ChatRoomResponse[]
  messagesByRoomId: Record<number, ChatMessageResponse[]>
  messageUnreadCountsById: Record<number, number>
  lastReadMessageIdByRoomId: Record<number, number>
  unreadCount: number
  connected: boolean
  error: string | null
  reloadRooms: () => void
  sendMessage: (chatId: number, payload: ChatMessageRequestPayload) => boolean
  markRoomAsRead: (chatId: number) => void
  setActiveChatId: (chatId: number | null) => void
}

const MessengerSocketContext =
  createContext<MessengerSocketContextValue | null>(null)

interface MessengerSocketProviderProps {
  children: ReactNode
}

const toUnreadCount = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const hasAccessToken = () => Boolean(localStorage.getItem('accessToken'))

// 로그인 후 메인 레이아웃에서 메신저 WebSocket 연결을 전역으로 유지하는 Provider입니다.
// 헤더 메신저 팝오버가 닫혀 있어도 새 메시지를 받을 수 있게 만드는 역할입니다.
export const MessengerSocketProvider = ({
  children,
}: MessengerSocketProviderProps) => {
  const { auth } = useAuth()
  const { rooms, loadRooms, loadMessages } = useMessengerData()
  const [readRoomIds, setReadRoomIds] = useState<Set<number>>(() => new Set())
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [initialUnreadCountsByRoomId, setInitialUnreadCountsByRoomId] =
    useState<Record<number, number>>({})
  const canConnect = hasAccessToken() && !auth.isExpired

  // REST로 조회한 내가 참여 중인 채팅방 목록에서 id만 꺼냅니다.
  // 이 id 목록을 기준으로 STOMP topic을 모두 구독합니다.
  const chatIds = useMemo(
    () => (canConnect ? (rooms ?? []).map((room) => room.id) : []),
    [canConnect, rooms],
  )

  const reloadRooms = useCallback(() => {
    if (!canConnect) return

    void loadRooms()
  }, [canConnect, loadRooms])

  const {
    connected,
    messagesByRoomId,
    unreadCountsByRoomId,
    messageUnreadCountsById,
    lastReadMessageIdByRoomId,
    lastMessageByRoomId,
    error,
    sendMessage,
    markRoomAsRead: markSocketRoomAsRead,
  } = useMessengerSocket(chatIds, {
    activeChatId,
    onRoomsShouldRefresh: reloadRooms,
  })

  const roomsWithUnreadCount = useMemo(
    () => {
      const nextRooms = (rooms ?? []).map((room) => {
        const restUnreadCount = readRoomIds.has(room.id)
          ? 0
          : Math.max(
              toUnreadCount(room.unreadCount),
              toUnreadCount(initialUnreadCountsByRoomId[room.id]),
            )
        const realtimeUnreadCount = toUnreadCount(unreadCountsByRoomId[room.id])

        return {
          ...room,
          lastMessage: lastMessageByRoomId[room.id]?.content ?? room.lastMessage,
          lastTime: lastMessageByRoomId[room.id]?.time ?? room.lastTime,
          // REST 재조회값과 WebSocket 실시간 보정값은 같은 메시지를 가리킬 수 있으므로 더하지 않습니다.
          // 둘 중 큰 값을 사용해야 메시지 1개가 알림 2개로 보이는 중복 카운팅을 막을 수 있습니다.
          unreadCount: Math.max(restUnreadCount, realtimeUnreadCount),
        }
      })

      // WebSocket으로 새 메시지가 온 방은 REST 재조회 전에도 목록 최상단에 보이게 합니다.
      return nextRooms.sort((leftRoom, rightRoom) => {
        const leftOrder = lastMessageByRoomId[leftRoom.id]?.order ?? 0
        const rightOrder = lastMessageByRoomId[rightRoom.id]?.order ?? 0

        if (leftOrder === rightOrder) return 0

        return rightOrder - leftOrder
      })
    },
    [
      initialUnreadCountsByRoomId,
      lastMessageByRoomId,
      readRoomIds,
      rooms,
      unreadCountsByRoomId,
    ],
  )

  const unreadCount = useMemo(
    () =>
      roomsWithUnreadCount.reduce(
        (sum, room) => sum + room.unreadCount,
        0,
      ),
    [roomsWithUnreadCount],
  )

  const markRoomAsRead = useCallback((chatId: number) => {
    markSocketRoomAsRead(chatId)
    setInitialUnreadCountsByRoomId((prevCounts) => ({
      ...prevCounts,
      [chatId]: 0,
    }))

    setReadRoomIds((prevReadRoomIds) => {
      const nextReadRoomIds = new Set(prevReadRoomIds)
      nextReadRoomIds.add(chatId)
      return nextReadRoomIds
    })
  }, [markSocketRoomAsRead])

  useEffect(() => {
    if (!canConnect) return

    // MainLayout이 올라오면 곧바로 내가 참여 중인 채팅방 목록을 조회합니다.
    // 이 목록이 있어야 WebSocket에서 어떤 topic들을 구독할지 알 수 있습니다.
    reloadRooms()
  }, [canConnect, reloadRooms])

  useEffect(() => {
    if (!canConnect || !rooms || rooms.length === 0) return

    let active = true

    // 초기 로그인 시 방 목록 unreadCount가 0으로 내려와도,
    // 메시지 목록의 read/mine 값을 기준으로 한 번 더 계산해서 헤더 배지를 보정합니다.
    const loadInitialUnreadCounts = async () => {
      const entries = await Promise.all(
        rooms.map(async (room) => {
          const response = await loadMessages(room.id)
          const unreadCount =
            response.data?.filter((message) => !message.mine && !message.read)
              .length ?? 0

          return [room.id, unreadCount] as const
        }),
      )

      if (!active) return

      setInitialUnreadCountsByRoomId(Object.fromEntries(entries))
    }

    void loadInitialUnreadCounts()

    return () => {
      active = false
    }
  }, [canConnect, loadMessages, rooms])

  const value = useMemo(
    () => ({
      rooms: canConnect ? roomsWithUnreadCount : [],
      messagesByRoomId,
      messageUnreadCountsById,
      lastReadMessageIdByRoomId,
      unreadCount,
      connected,
      error,
      reloadRooms,
      sendMessage,
      markRoomAsRead,
      setActiveChatId,
    }),
    [
      canConnect,
      connected,
      error,
      markRoomAsRead,
      messageUnreadCountsById,
      lastReadMessageIdByRoomId,
      messagesByRoomId,
      reloadRooms,
      roomsWithUnreadCount,
      sendMessage,
      setActiveChatId,
      unreadCount,
    ],
  )

  return (
    <MessengerSocketContext.Provider value={value}>
      {children}
    </MessengerSocketContext.Provider>
  )
}

// 메신저 화면에서 전역 WebSocket 상태를 꺼내 쓰기 위한 훅입니다.
// Provider 밖에서 사용하면 구조 오류를 바로 알 수 있게 에러를 던집니다.
export const useMessengerSocketContext = () => {
  const context = useContext(MessengerSocketContext)

  if (!context) {
    throw new Error(
      'useMessengerSocketContext는 MessengerSocketProvider 내부에서만 사용할 수 있습니다.',
    )
  }

  return context
}
