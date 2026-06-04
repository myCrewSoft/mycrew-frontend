import { MoreHorizontal, Search } from 'lucide-react'
import IconButton from '../../../common/button/IconButton'
import type { ChatMessage, ChatRoom } from './messenger.types'
import { getDirectRoomMeta, statusDotClassName } from './messenger.utils'
import MessengerMessageInput from './MessengerMessageInput'

interface MessengerChatPanelProps {
  room: ChatRoom
  messages: ChatMessage[]
  messageText: string
  onChangeMessageText: (value: string) => void
}

const MessengerChatPanel = ({
  room,
  messages,
  messageText,
  onChangeMessageText,
}: MessengerChatPanelProps) => {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            {room.avatar}

            {/* 선택된 채팅방의 상태도 텍스트 대신 프로필 아이콘의 작은 점으로 표시합니다. */}
            {room.status && (
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${statusDotClassName[room.status]}`}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="shrink-0 text-sm font-bold text-slate-900">
                {room.name}
              </p>

              {/* 1:1 채팅방의 직급/부서는 이름 옆에 작고 연하게 배치합니다. */}
              {room.type === 'direct' && getDirectRoomMeta(room) && (
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

      <div className="flex-1 overflow-y-auto bg-white px-5 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
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
                  // 내가 보낸 메시지는 파란색 말풍선, 상대 메시지는 회색 말풍선으로 구분합니다.
                  className={`rounded-2xl px-4 py-2 text-sm leading-6 ${
                    message.mine
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {message.content}
                </div>

                <span className="text-[11px] text-slate-400">
                  {message.read ? '읽음 · ' : ''}
                  {message.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MessengerMessageInput
        value={messageText}
        onChange={onChangeMessageText}
      />
    </section>
  )
}

export default MessengerChatPanel
