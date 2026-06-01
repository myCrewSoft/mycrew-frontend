import { useState, useRef, useCallback } from 'react'
import type { AiType } from '../api/chatBotApi'
import chatbotApi from '../api/chatBotApi'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useChatbot(aiType: AiType) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef<string>('')
  const streamingContentRef = useRef('')
  const isStoppingRef = useRef(false)

  const generateRequestId = (): string =>
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const sendMessage = useCallback(
    (inputText: string) => {
      const trimmed = inputText.trim()
      if (!trimmed || isStreaming) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setStreamingContent('')
      streamingContentRef.current = ''
      isStoppingRef.current = false

      const requestId = generateRequestId()
      requestIdRef.current = requestId
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      let accumulated = ''

      void chatbotApi
        .streamChat(
          {
            message: trimmed,
            requestId,
            aiType,
          },
          {
            onMessage: (chunk) => {
              accumulated += chunk
              streamingContentRef.current = accumulated
              setStreamingContent(accumulated)
            },
          },
          abortController.signal,
        )
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }
          console.error(error)
        })
        .finally(() => {
          if (isStoppingRef.current || requestIdRef.current !== requestId) {
            return
          }

          abortControllerRef.current = null

          if (accumulated) {
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: accumulated,
              timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
          }

          streamingContentRef.current = ''
          setStreamingContent('')
          setIsStreaming(false)
        })
    },
    [isStreaming, aiType],
  )

  const stopStreaming = useCallback(async () => {
    if (!isStreaming) return

    isStoppingRef.current = true
    try {
      await chatbotApi.stopStream(requestIdRef.current)
    } catch (error) {
      console.error(error)
    } finally {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null

      setMessages((prev) => {
        if (streamingContentRef.current) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: streamingContentRef.current,
            timestamp: new Date(),
          }
          return [...prev, assistantMessage]
        }
        return prev
      })

      streamingContentRef.current = ''
      setStreamingContent('')
      setIsStreaming(false)
      isStoppingRef.current = false
    }
  }, [isStreaming])

  const clearMessages = useCallback(() => {
    if (isStreaming) return
    setMessages([])
    setStreamingContent('')
    streamingContentRef.current = ''
  }, [isStreaming])

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
    clearMessages,
  }
}
