import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Clock, Megaphone, UserPlus, X } from 'lucide-react'
import { notificationApi } from '../../../api/notificationApi'
import { useApi, useApiList } from '../../../hooks/useApi'
import type { NotificationResponse } from '../../../types'

type NotificationType = 'approval' | 'schedule' | 'notice' | 'member'

const notificationIconStyle: Record<NotificationType, string> = {
  approval: 'bg-blue-50 text-blue-600',
  schedule: 'bg-emerald-50 text-emerald-600',
  notice: 'bg-indigo-50 text-indigo-600',
  member: 'bg-slate-100 text-slate-500',
}

const notificationIcon = {
  approval: CheckSquare,
  schedule: Clock,
  notice: Megaphone,
  member: UserPlus,
}

const mapNotificationType = (typeCode: string): NotificationType => {
  switch (typeCode) {
    case '01':
      return 'schedule'
    case '02':
      return 'approval'
    case '03':
    case '04':
      return 'notice'
    case '05':
    case '06':
      return 'member'
    default:
      return 'notice'
  }
}

const formatTimeText = (sentAt: string) => {
  const sentTime = new Date(sentAt).getTime()

  if (Number.isNaN(sentTime)) {
    return ''
  }

  const diffMinutes = Math.floor((Date.now() - sentTime) / 1000 / 60)

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`

  return `${Math.floor(diffMinutes / 1440)}일 전`
}

const getNotificationReceiverId = (
  notification: NotificationResponse,
): number | null => {
  return Number.isInteger(notification.alrmRcvrId)
    ? notification.alrmRcvrId
    : null
}

interface NotificationPopoverContentProps {
  refreshSignal?: number
  onNotificationsChanged?: () => void | Promise<unknown>
}

const NotificationPopoverContent = ({
  refreshSignal,
  onNotificationsChanged,
}: NotificationPopoverContentProps) => {
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<
    number[]
  >([])
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  const {
    data: notifications,
    loading,
    error,
    execute: fetchNotifications,
  } = useApiList<NotificationResponse>(notificationApi.getNotifications, {
    immediate: false,
  })

  const { execute: deleteNotification } = useApi<null>(
    notificationApi.deleteNotification,
    { immediate: false },
  )

  useEffect(() => {
    void fetchNotifications().catch(() => undefined)
  }, [fetchNotifications, refreshSignal])

  const visibleNotifications = useMemo(() => {
    return (notifications ?? []).filter(
      (notification) => {
        const alrmRcvrId = getNotificationReceiverId(notification)

        return (
          alrmRcvrId === null ||
          !deletedNotificationIds.includes(alrmRcvrId)
        )
      },
    )
  }, [deletedNotificationIds, notifications])

  const handleDeleteNotification = async (alrmRcvrId: number) => {
    if (!Number.isInteger(alrmRcvrId)) {
      setDeleteErrorMessage(
        '삭제할 수 없는 알림입니다. 잠시 후 다시 시도해 주세요.',
      )
      return
    }

    if (deletedNotificationIds.includes(alrmRcvrId)) {
      return
    }

    setDeleteErrorMessage('')
    setDeletedNotificationIds((current) => [...current, alrmRcvrId])

    try {
      await deleteNotification(alrmRcvrId)
      const response = await fetchNotifications()
      const deletionFailed = response.data?.some(
        (notification) => notification.alrmRcvrId === alrmRcvrId,
      )

      setDeletedNotificationIds((current) =>
        current.filter((id) => id !== alrmRcvrId),
      )

      if (deletionFailed) {
        setDeleteErrorMessage(
          '알림이 삭제되지 않았습니다. 본인에게 수신된 알림인지 확인해 주세요.',
        )
        return
      }
    } catch {
      setDeletedNotificationIds((current) =>
        current.filter((id) => id !== alrmRcvrId),
      )
      setDeleteErrorMessage(
        '알림을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
      return
    }

    try {
      await onNotificationsChanged?.()
    } catch {
      // The notification is already deleted, so a count refresh failure is ignored.
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-500">
        알림을 불러오는 중입니다.
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-500">
        알림을 불러올 수 없습니다.
      </div>
    )
  }

  if (visibleNotifications.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-slate-500">
        새 알림이 없습니다.
      </div>
    )
  }

  return (
    <div>
      {deleteErrorMessage && (
        <p
          role="alert"
          className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600"
        >
          {deleteErrorMessage}
        </p>
      )}

      <ul
        className="divide-y divide-slate-100"
        style={{
          maxHeight: visibleNotifications.length > 5 ? 272 : undefined,
          overflowY:
            visibleNotifications.length > 5 ? 'auto' : 'visible',
        }}
      >
        {visibleNotifications.map((notification) => {
          const notificationType = mapNotificationType(notification.alrmTypeCd)
          const Icon = notificationIcon[notificationType]
          const unread = notification.alrmCfmtnDt === null
          const alrmRcvrId = getNotificationReceiverId(notification)

          return (
            <li
              key={notification.alrmId}
              className={`group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 ${
                unread ? 'bg-white' : 'bg-slate-50 opacity-60'
              }`}
            >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                notificationIconStyle[notificationType]
              }`}
            >
              <Icon size={16} />
            </div>

            <div className="min-w-0 flex-1 pr-7">
              <div className="flex min-w-0 items-center gap-2 pr-14">
                <p className="truncate text-sm font-bold text-slate-900">
                  {notification.alrmTtln}
                </p>

                {unread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                )}
              </div>

              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">
                {notification.alrmCn}
              </p>
            </div>

            <div className="absolute right-4 top-2.5 flex flex-col items-end gap-1">
              <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                {formatTimeText(notification.alrmSndngDt)}
              </span>

              <button
                type="button"
                aria-label="알림 삭제"
                onClick={() => {
                  if (alrmRcvrId === null) {
                    setDeleteErrorMessage(
                      '삭제할 수 없는 알림입니다. 잠시 후 다시 시도해 주세요.',
                    )
                    return
                  }

                  void handleDeleteNotification(alrmRcvrId)
                }}
                disabled={
                  alrmRcvrId !== null &&
                  deletedNotificationIds.includes(alrmRcvrId)
                }
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition-all hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default NotificationPopoverContent
