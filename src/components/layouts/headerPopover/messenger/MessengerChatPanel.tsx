import { useEffect, useLayoutEffect, useRef } from 'react'
import { MoreHorizontal, Search } from 'lucide-react'
import IconButton from '../../../common/button/IconButton'
import ChatRoomAvatar from './ChatRoomAvatar'
import type { ChatMessage, ChatRoom } from './messenger.types'
import {
  formatMessengerTime,
  getDirectRoomMeta,
  isDirectChatRoom,
} from './messenger.utils'
import MessengerMessageInput from './MessengerMessageInput'

interface MessengerChatPanelProps {
  room: ChatRoom
  messages: ChatMessage[]
  messageText: string
  onChangeMessageText: (value: string) => void
  onSendMessage: () => void
  onOpenRoomInfo: () => void
}

const getMessageSenderInitial = (senderName: string) =>
  senderName.trim().charAt(0) || '?'

const MessengerChatPanel = ({
  room,
  messages,
  messageText,
  onChangeMessageText,
  onSendMessage,
  onOpenRoomInfo,
}: MessengerChatPanelProps) => {
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const initialScrolledRoomIdRef = useRef<number | null>(null)
  const skipNextSmoothScrollRef = useRef(false)

  useLayoutEffect(() => {
    if (!messageListRef.current || messages.length === 0) return

    if (initialScrolledRoomIdRef.current === room.id) return

    const firstUnreadMessageIndex = messages.findIndex(
      (message) => !message.mine && !message.read,
    )
    const scrollTargetIndex =
      firstUnreadMessageIndex > 0
        ? firstUnreadMessageIndex - 1
        : firstUnreadMessageIndex === 0
          ? 0
          : messages.length - 1
    const scrollTargetMessage = messages[scrollTargetIndex]
    const scrollTargetElement = messageListRef.current.querySelector(
      `[data-message-id="${scrollTargetMessage.id}"]`,
    )

    // 채팅방을 처음 열 때는 최신 메시지가 아니라 마지막으로 확인한 메시지 위치로 즉시 이동합니다.
    if (scrollTargetElement instanceof HTMLElement) {
      messageListRef.current.scrollTop = Math.max(
        0,
        scrollTargetElement.offsetTop - messageListRef.current.offsetTop - 16,
      )
    }

    initialScrolledRoomIdRef.current = room.id
    skipNextSmoothScrollRef.current = true
  }, [messages, room.id])

  useEffect(() => {
    if (skipNextSmoothScrollRef.current) {
      skipNextSmoothScrollRef.current = false
      return
    }

    // 같은 채팅방에서 새 메시지가 추가되면 가장 최근 메시지를 볼 수 있게 부드럽게 이동합니다.
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length])

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <ChatRoomAvatar room={room} />

          <div className="min-w-0">
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="shrink-0 text-sm font-bold text-slate-900">
                {room.name}
              </p>

              {/* 1:1 채팅방의 직급/부서는 이름 옆에 작고 연하게 배치합니다. */}
              {isDirectChatRoom(room) && getDirectRoomMeta(room) && (
                <span className="truncate text-[11px] font-medium text-slate-400">
                  {getDirectRoomMeta(room)}
                </span>
              )}
            </div>

            {/* 채팅방 설명은 직급/부서보다 아래에 배치해서 서로 구분되게 합니다. */}
            <p className="mt-0.5 max-w-[430px] truncate text-[11px] leading-4 text-slate-500">
              {room.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <IconButton size="sm" aria-label="대화 검색">
            <Search size={16} />
          </IconButton>
          <IconButton size="sm" aria-label="채팅방 정보" onClick={onOpenRoomInfo}>
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
      </header>

      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4"
      >
        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const unreadCount = message.unreadCount ?? 0
            const senderInitial = getMessageSenderInitial(message.senderName)

            return (
              <div
                key={message.id}
                data-message-id={message.id}
                // 내가 보낸 메시지는 오른쪽, 상대가 보낸 메시지는 왼쪽에 배치합니다.
                className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[82%] gap-2 ${
                    message.mine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!message.mine && (
                    <div className="mt-5 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-blue-100 ring-1 ring-white">
                      {/* ChatMessageResponse에는 아직 보낸 사람 프로필 이미지 필드가 없으므로 이름 초성으로 표시합니다. */}
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-blue-600">
                        {senderInitial}
                      </div>
                    </div>
                  )}

                  <div
                    className={`${
                      message.mine ? 'items-end' : 'items-start'
                    } flex min-w-0 flex-col gap-1`}
                  >
                    {!message.mine && (
                      // 상대 메시지는 말풍선 위에 보낸 사람 이름을 보여줍니다.
                      <span className="max-w-40 truncate text-xs font-semibold text-slate-800">
                        {message.senderName}
                      </span>
                    )}

                    <div
                      className={`flex items-end gap-1.5 ${
                        message.mine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        // 그룹웨어 톤에 맞게 내 메시지는 브랜드 블루, 상대 메시지는 흰색 말풍선으로 구분합니다.
                        className={`relative max-w-[360px] border px-3.5 py-2 text-sm leading-5 shadow-sm ${
                          message.mine
                            ? 'rounded-2xl rounded-tr-md border-blue-500 bg-blue-500 text-white'
                            : 'rounded-2xl rounded-tl-md border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-words">
                          {message.content}
                        </span>
                      </div>

                      <div
                        className={`mb-0.5 flex shrink-0 flex-col gap-0.5 text-[10px] leading-none ${
                          message.mine ? 'items-end' : 'items-start'
                        }`}
                      >
                        {/* 내가 보낸 메시지는 백엔드가 내려준 안 읽은 사람 수를 시간 위에 표시합니다. */}
                        {message.mine && unreadCount > 0 && (
                          <span className="font-bold text-blue-500">
                            {unreadCount}
                          </span>
                        )}

                        <span className="whitespace-nowrap text-slate-400">
                          {formatMessengerTime(message.time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <MessengerMessageInput
        value={messageText}
        onChange={onChangeMessageText}
        onSend={onSendMessage}
      />
    </section>
  )
}

export default MessengerChatPanel
