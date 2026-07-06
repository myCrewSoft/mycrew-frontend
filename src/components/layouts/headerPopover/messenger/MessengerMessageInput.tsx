import { useEffect, useRef, useState } from 'react'
import { Send, Smile } from 'lucide-react'

const EMOJIS = [
  '😀', '😄', '😁', '😂', '😊', '😍', '🥰', '😎',
  '🤔', '😅', '🥲', '😭', '😡', '👍', '👏', '🙌',
  '🙏', '👌', '💪', '🎉', '✨', '🔥', '❤️', '💙',
  '✅', '❗', '❓', '📌', '📅', '💡', '🚀', '👀',
]

interface MessengerMessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

const MessengerMessageInput = ({
  value,
  onChange,
  onSend,
}: MessengerMessageInputProps) => {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!emojiOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!emojiPickerRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEmojiOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [emojiOpen])

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    const selectionStart = textarea?.selectionStart ?? value.length
    const selectionEnd = textarea?.selectionEnd ?? selectionStart
    const nextValue = `${value.slice(0, selectionStart)}${emoji}${value.slice(selectionEnd)}`
    const nextCursor = selectionStart + emoji.length

    onChange(nextValue)
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  return (
    <footer className="border-t border-slate-200 p-3">
      {/* 입력창, 보조 아이콘, 전송 버튼을 하나의 둥근 박스 안에 배치합니다. */}
      <div className="relative flex min-h-[128px] flex-col rounded-2xl border border-slate-300 bg-white p-4 focus-within:border-blue-400">
        <textarea
          ref={textareaRef}
          value={value}
          // 입력할 때마다 부모 컴포넌트의 messageText 상태를 최신 입력값으로 바꿉니다.
          onChange={(event) => onChange(event.target.value)}
          // Enter는 전송, Shift+Enter는 줄바꿈으로 처리합니다.
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return

            event.preventDefault()
            onSend()
          }}
          placeholder="메시지 입력"
          className="min-h-8 flex-1 resize-none border-none bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-500"
        />

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div ref={emojiPickerRef} className="relative">
              <button
                type="button"
                className={`text-slate-700 transition-colors hover:text-blue-600 ${
                  emojiOpen ? 'text-blue-600' : ''
                }`}
                aria-label="이모지 선택"
                aria-expanded={emojiOpen}
                onClick={() => setEmojiOpen((open) => !open)}
              >
                <Smile size={22} strokeWidth={2.2} />
              </button>

              {emojiOpen && (
                <div className="absolute bottom-9 left-0 z-30 w-[280px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="mb-2 text-xs font-bold text-slate-500">이모지</p>
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={`${emoji} 입력`}
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="메시지 전송"
            onClick={onSend}
            // 공백만 입력한 경우에는 전송 버튼을 비활성화합니다.
            disabled={value.trim().length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <Send size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default MessengerMessageInput
