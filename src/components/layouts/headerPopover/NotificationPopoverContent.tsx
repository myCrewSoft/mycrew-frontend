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
      (notification) =>
        !deletedNotificationIds.includes(notification.alrmRcvrId),
    )
  }, [deletedNotificationIds, notifications])

  const handleDeleteNotification = async (alrmRcvrId: number) => {
    await deleteNotification(alrmRcvrId)
    setDeletedNotificationIds((current) => [...current, alrmRcvrId])
    await onNotificationsChanged?.()
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
    <ul className="max-h-[272px] divide-y divide-slate-100 overflow-y-auto">
      {visibleNotifications.map((notification) => {
        const notificationType = mapNotificationType(notification.alrmTypeCd)
        const Icon = notificationIcon[notificationType]
        const unread = notification.alrmCfmtnDt === null

        return (
          <li
            key={notification.alrmRcvrId}
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
                onClick={() =>
                  void handleDeleteNotification(notification.alrmRcvrId)
                }
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition-all hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default NotificationPopoverContent
