import { useEffect } from 'react'
import axiosInstance from '../../../api/axiosInstance'
import type { NotificationResponse } from '../../../types'

export const NOTIFICATION_RECEIVED_EVENT = 'mycrew:notification-received'

export interface NotificationReceivedEventDetail {
  notification: NotificationResponse | null
  raw: string
}

const NOTIFICATION_RECONNECT_DELAY = 3000

const createSubscribeUrl = () => {
  const baseURL = axiosInstance.defaults.baseURL || window.location.origin

  return new URL('/api/notifications/subscribe', baseURL).toString()
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNotificationResponse = (
  value: unknown,
): value is NotificationResponse => {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.alrmRcvrId === 'number' &&
    typeof value.alrmId === 'number' &&
    typeof value.alrmTypeCd === 'string'
  )
}

const parseNotification = (raw: string) => {
  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isObjectRecord(parsed)) return null
    const parsedRecord: Record<string, unknown> = parsed
    const data = parsedRecord.data

    if (isNotificationResponse(parsedRecord)) {
      return parsedRecord
    }

    return isNotificationResponse(data) ? data : null
  } catch {
    return null
  }
}

const dispatchNotificationReceived = (raw: string) => {
  if (!raw || raw === '[DONE]') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<NotificationReceivedEventDetail>(
      NOTIFICATION_RECEIVED_EVENT,
      {
        detail: {
          notification: parseNotification(raw),
          raw,
        },
      },
    ),
  )
}

const handleSseBlock = (block: string) => {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim()

  dispatchNotificationReceived(data)
}

const readSseStream = async (response: Response, signal: AbortSignal) => {
  if (!response.body) {
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (!signal.aborted) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

    let separatorIndex = buffer.indexOf('\n\n')
    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)
      handleSseBlock(block)
      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}

export const useNotificationStream = () => {
  useEffect(() => {
    let stopped = false
    let reconnectTimer: ReturnType<typeof window.setTimeout> | null = null
    let controller: AbortController | null = null

    const connect = async () => {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken || localStorage.getItem('firstLoginRequired') === 'true') {
        return
      }

      controller = new AbortController()

      try {
        const response = await fetch(createSubscribeUrl(), {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Notification stream failed: ${response.status}`)
        }

        await readSseStream(response, controller.signal)

        if (!stopped) {
          reconnectTimer = window.setTimeout(
            connect,
            NOTIFICATION_RECONNECT_DELAY,
          )
        }
      } catch {
        if (!stopped) {
          reconnectTimer = window.setTimeout(
            connect,
            NOTIFICATION_RECONNECT_DELAY,
          )
        }
      }
    }

    void connect()

    return () => {
      stopped = true

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }

      controller?.abort()
    }
  }, [])
}
