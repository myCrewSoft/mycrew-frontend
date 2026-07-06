import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Square, Trash2 } from 'lucide-react'
import { useChatbot } from '../../../hooks/useChatBot'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
        <Bot size={13} />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 shadow-sm">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  role,
  content,
  timestamp,
}: {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}) {
  const timeStr = timestamp.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (role === 'user') {
    return (
      <div className="flex flex-row-reverse items-end gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
          나
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[280px] rounded-2xl rounded-br-sm bg-blue-600 px-3.5 py-2 text-sm leading-relaxed text-white shadow-sm">
            {content}
          </div>
          <span className="text-[11px] text-slate-400">{timeStr}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
        <Bot size={13} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="max-w-[280px] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm leading-relaxed text-slate-800 shadow-sm">
          <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
        <span className="text-[11px] text-slate-400">{timeStr}</span>
      </div>
    </div>
  )
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
        <Bot size={13} />
      </div>
      <div className="max-w-[280px] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm leading-relaxed text-slate-800 shadow-sm">
        <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-blue-500 align-middle" />
      </div>
    </div>
  )
}

export default function AIChatbotPopoverContent() {
  const [inputText, setInputText] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isStreaming, streamingContent, sendMessage, stopStreaming, clearMessages } =
    useChatbot('CHAT')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return
    sendMessage(inputText)
    setInputText('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex h-full flex-col bg-[#f1f5f9]">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-2">
        <span className="text-xs text-slate-500">
          {isStreaming ? (
            <span className="flex items-center gap-1 text-blue-600">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              응답 생성 중...
            </span>
          ) : (
            '무엇이든 질문해보세요'
          )}
        </span>
        <button
          onClick={clearMessages}
          disabled={isStreaming || isEmpty}
          className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={11} />
          초기화
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Bot size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">무엇을 도와드릴까요?</p>
              <p className="mt-1 text-xs text-slate-500">궁금한 것을 자유롭게 질문해보세요.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}

            {isStreaming && streamingContent === '' && <TypingIndicator />}
            {isStreaming && streamingContent !== '' && (
              <StreamingBubble content={streamingContent} />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="메시지 입력 (Shift+Enter 줄바꿈)"
            rows={1}
            className="min-h-[36px] flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
              title="응답 중단"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="전송"
            >
              <Send size={14} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-right text-[11px] text-slate-400">Enter 전송 · Shift+Enter 줄바꿈</p>
      </div>
    </div>
  )
}
