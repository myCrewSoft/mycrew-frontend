import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { RefreshResponse } from '../types/auth'

export type AiType = 'APPR' | 'MEET' | 'REPT' | 'PORK' | 'CHAT'

export interface ChatStreamParams {
  message: string
  requestId: string
  aiType: AiType
}

interface ChatStreamHandlers {
  onMessage: (message: string) => void
}

const parseSseMessage = (eventText: string): string => {
  const dataLines = eventText
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s?/, ''))

  return dataLines.length > 0 ? dataLines.join('\n') : eventText
}

const emitSseMessages = (
  text: string,
  handlers: ChatStreamHandlers,
): string => {
  const events = text.split(/\r?\n\r?\n/)
  const rest = events.pop() ?? ''

  events.forEach((eventText) => {
    const message = parseSseMessage(eventText)
    if (message) handlers.onMessage(message)
  })

  return rest
}

const createAuthHeaders = (): HeadersInit | undefined => {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

const refreshAccessToken = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refreshToken')

  const response = await axiosInstance.post<ApiResponse<RefreshResponse>>(
    '/api/v1/auth/refresh',
    { refreshToken },
  )
  const data = response.data.data

  if (!data?.accessToken) {
    throw new Error('Refreshed access token is empty')
  }

  localStorage.setItem('accessToken', data.accessToken)

  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken)
  }

  if (typeof data.empId === 'number') {
    localStorage.setItem('empId', String(data.empId))
  }

  if (typeof data.authVersion === 'number') {
    localStorage.setItem('authVersion', String(data.authVersion))
  }

  window.dispatchEvent(new Event('token-refreshed'))
}

const fetchChatStream = async (
  url: string,
  signal?: AbortSignal,
): Promise<Response> =>
  fetch(url, {
    headers: createAuthHeaders(),
    signal,
  })

const fetchWithRefresh = async (
  url: string,
  init: RequestInit = {},
): Promise<Response> => {
  let response = await fetch(url, {
    ...init,
    headers: {
      ...createAuthHeaders(),
      ...init.headers,
    },
  })

  if (response.status === 401) {
    await refreshAccessToken()
    response = await fetch(url, {
      ...init,
      headers: {
        ...createAuthHeaders(),
        ...init.headers,
      },
    })
  }

  return response
}

const chatbotApi = {
  stopStream: async (requestId: string): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_URL as string
    const query = new URLSearchParams({ requestId }).toString()
    const response = await fetchWithRefresh(`${baseUrl}/api/chat/stop?${query}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Chat stop failed with status ${response.status}`)
    }
  },

  streamChat: async (
    params: ChatStreamParams,
    handlers: ChatStreamHandlers,
    signal?: AbortSignal,
  ): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_URL as string
    const query = new URLSearchParams({
      message: params.message,
      requestId: params.requestId,
      aiType: params.aiType,
    }).toString()
    const url = `${baseUrl}/api/chat/stream?${query}`
    let response = await fetchChatStream(url, signal)

    if (response.status === 401) {
      await refreshAccessToken()
      response = await fetchChatStream(url, signal)
    }

    if (!response.ok) {
      throw new Error(`Chat stream failed with status ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Chat stream response body is empty')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      buffer = emitSseMessages(buffer, handlers)
    }

    buffer += decoder.decode()
    const lastMessage = parseSseMessage(buffer.trim())
    if (lastMessage) handlers.onMessage(lastMessage)
  },
}

export default chatbotApi
