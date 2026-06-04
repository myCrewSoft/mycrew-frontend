import { useEffect, useLayoutEffect, useRef } from 'react'
import { MoreHorizontal, Search } from 'lucide-react'
import IconButton from '../../../common/button/IconButton'
import type { ChatMessage, ChatRoom } from './messenger.types'
import {
  formatMessengerTime,
  getDirectRoomMeta,
  getStatusDotClassName,
  isDirectChatRoom,
} from './messenger.utils'
import MessengerMessageInput from './MessengerMessageInput'

interface MessengerChatPanelProps {
  room: ChatRoom
  messages: ChatMessage[]
  messageText: string
  onChangeMessageText: (value: string) => void
  onSendMessage: () => void
}

const MessengerChatPanel = ({
  room,
  messages,
  messageText,
  onChangeMessageText,
  onSendMessage,
}: MessengerChatPanelProps) => {
  const messageListRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    // 채팅방에 처음 입장할 때는 애니메이션 없이 바로 맨 아래에 붙입니다.
    // 사용자가 과거 메시지에서 최신 메시지로 내려가는 장면을 보지 않게 하기 위함입니다.
    if (!messageListRef.current) return

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight
  }, [room.id])

  useEffect(() => {
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
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            {room.avatar}

            {/* 선택된 채팅방의 상태도 텍스트 대신 프로필 아이콘의 작은 점으로 표시합니다. */}
            {room.status && (
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${getStatusDotClassName(room.status)}`}
              />
            )}
          </div>

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
          <IconButton size="sm" aria-label="더보기">
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
      </header>

      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto bg-white px-5 py-4"
      >
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const unreadCount = message.unreadCount ?? 0

            return (
              <div
                key={message.id}
                // 내가 보낸 메시지는 오른쪽, 상대가 보낸 메시지는 왼쪽에 배치합니다.
                className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.mine ? 'items-end' : 'items-start'
                  } flex flex-col gap-1`}
                >
                  <div
                    // 내가 보낸 메시지는 파란색, 상대 메시지는 회색 말풍선으로 구분합니다.
                    className={`rounded-2xl px-4 py-2 text-sm leading-6 ${
                      message.mine
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {message.content}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    {/* 내가 보낸 메시지는 백엔드가 내려준 안 읽은 사람 수를 함께 표시합니다. */}
                    {message.mine && unreadCount > 0 && (
                      <span className="font-semibold text-blue-500">
                        {unreadCount}
                      </span>
                    )}

                    <span>
                      {message.read ? '읽음 · ' : ''}
                      {formatMessengerTime(message.time)}
                    </span>
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
