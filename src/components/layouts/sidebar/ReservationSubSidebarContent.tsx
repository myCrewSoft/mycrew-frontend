import { useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { meetingRoomReservationApi } from '../../../api/ReservationApi'
import { useApi } from '../../../hooks/useApi'
import type { ReservationResponse } from '../../../types'
import IconButton from '../../common/button/IconButton'
import Checkbox from '../../common/form/checkbox/Checkbox'
import { useReservation } from '../../../pages/Reservation/ReservationContext'
import { formatDateKey, formatMonthTitle } from '../../../utils/date'

const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토']

const getMonthDates = (currentMonth: Date) => {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDate = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0)
  const dates: Date[] = []

  // 달력 첫 줄을 일요일부터 시작시키기 위해 이전 달 날짜를 채웁니다.
  for (let index = firstDate.getDay(); index > 0; index -= 1) {
    dates.push(new Date(year, month, 1 - index))
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    dates.push(new Date(year, month, day))
  }

  // 7칸 단위로 맞추기 위해 다음 달 날짜를 채웁니다.
  while (dates.length % 7 !== 0) {
    dates.push(new Date(year, month, dates.length - firstDate.getDay() + 1))
  }

  return dates
}

const formatReservationDateTime = (dateTime: string) => {
  const date = new Date(dateTime)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const ReservationSubSidebarContent = () => {
  const {
    selectedDate,
    setSelectedDate,
    rooms,
    checkedRoomIds,
    setCheckedRoomIds,
    roomsLoading,
    roomsErrorMessage,
  } = useReservation()

  const {
    data: myUpcomingReservations,
    execute: fetchMyUpcomingReservations,
  } = useApi<ReservationResponse[]>(
    meetingRoomReservationApi.getMyUpcomingReservations,
    {
      immediate: false,
      initialData: [],
    },
  )

  useEffect(() => {
    void fetchMyUpcomingReservations().catch(() => {
      // 백엔드에 예정 예약 API가 아직 없을 수 있으므로 서브사이드바는 조용히 빈 상태로 둡니다.
    })
  }, [fetchMyUpcomingReservations])

  const selectedDateObject = new Date(selectedDate)
  const monthDates = getMonthDates(selectedDateObject)

  const nextMyReservations = useMemo(
    () =>
      (myUpcomingReservations ?? [])
        .filter((reservation) => reservation.mine)
        .sort(
          (first, second) =>
            new Date(first.startDateTime).getTime() -
            new Date(second.startDateTime).getTime(),
        )
        .slice(0, 2),
    [myUpcomingReservations],
  )

  const moveMonth = (direction: 'prev' | 'next') => {
    const nextDate = new Date(selectedDate)
    nextDate.setMonth(nextDate.getMonth() + (direction === 'prev' ? -1 : 1))
    nextDate.setDate(1)

    setSelectedDate(formatDateKey(nextDate))
  }

  const toggleRoom = (roomId: number) => {
    const nextRoomIds = checkedRoomIds.includes(roomId)
      ? checkedRoomIds.filter((checkedRoomId) => checkedRoomId !== roomId)
      : [...checkedRoomIds, roomId]

    setCheckedRoomIds(nextRoomIds)
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">회의실 예약</h2>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-950">
            {formatMonthTitle(selectedDateObject)}
          </h3>

          <div className="flex items-center gap-1">
            <IconButton
              aria-label="이전 달"
              size="xs"
              onClick={() => moveMonth('prev')}
            >
              <ChevronLeft size={14} />
            </IconButton>
            <IconButton
              aria-label="다음 달"
              size="xs"
              onClick={() => moveMonth('next')}
            >
              <ChevronRight size={14} />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekDayLabels.map((label) => (
            <span
              key={label}
              className="py-1 text-xs font-bold text-slate-500 first:text-red-500 last:text-blue-500"
            >
              {label}
            </span>
          ))}

          {monthDates.map((date) => {
            const dateKey = formatDateKey(date)
            const selected = dateKey === selectedDate
            const currentMonth = date.getMonth() === selectedDateObject.getMonth()
            const dayOfWeek = date.getDay()

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  selected
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-slate-100'
                } ${
                  currentMonth ? 'text-slate-900' : 'text-slate-300'
                } ${dayOfWeek === 0 && !selected ? 'text-red-500' : ''} ${
                  dayOfWeek === 6 && !selected ? 'text-blue-500' : ''
                }`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-950">회의실 필터</h3>

        {roomsLoading && (
          <p className="text-sm font-semibold text-slate-400">
            회의실을 불러오는 중입니다.
          </p>
        )}

        {!roomsLoading && roomsErrorMessage && (
          <p className="text-sm font-semibold text-slate-400">
            회의실 정보를 불러오지 못했습니다.
          </p>
        )}

        {!roomsLoading && !roomsErrorMessage && rooms.length === 0 && (
          <p className="text-sm font-semibold text-slate-400">
            등록된 회의실이 없습니다.
          </p>
        )}

        {!roomsLoading && !roomsErrorMessage && rooms.length > 0 && (
          <div className="flex flex-col gap-3">
            {rooms.map((room) => (
              <Checkbox
                key={room.roomId}
                label={`${room.floor}층 ${room.roomName}`}
                checked={checkedRoomIds.includes(room.roomId)}
                onChange={() => toggleRoom(room.roomId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-950">내 다음 예약</h3>

        {nextMyReservations.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">
            예정된 내 회의실 예약이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {nextMyReservations.map((reservation) => {
              const room = rooms.find((item) => item.roomId === reservation.roomId)

              return (
                <button
                  key={reservation.reservationId}
                  type="button"
                  onClick={() =>
                    setSelectedDate(formatDateKey(new Date(reservation.startDateTime)))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
                >
                  <p className="truncate text-sm font-bold text-slate-900">
                    {reservation.title || '회의실 예약'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatReservationDateTime(reservation.startDateTime)}
                    {room ? ` · ${room.roomName}` : ''}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default ReservationSubSidebarContent
