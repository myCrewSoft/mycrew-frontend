import { AlertCircle, LoaderCircle } from 'lucide-react'
import type { ReservationResponse, RoomResponse } from '../../types'

const DEFAULT_START_HOUR = 9
const DEFAULT_END_HOUR = 18

interface MeetingRoomAvailabilityTimelineProps {
  rooms: RoomResponse[]
  reservations: ReservationResponse[]
  beginDt: string
  endDt: string
  selectedRoomId: number | null
  editingMeetingId: number | null
  loading: boolean
  errorMessage: string | null
  onSelectRoom: (roomId: number) => void
}

const toTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

const isSameDate = (beginDt: string, endDt: string) =>
  beginDt.slice(0, 10) === endDt.slice(0, 10)

const isOverlapping = (
  beginDt: string,
  endDt: string,
  reservation: ReservationResponse,
) => {
  const selectedStart = toTimestamp(beginDt)
  const selectedEnd = toTimestamp(endDt)
  const reservationStart = toTimestamp(reservation.startDateTime)
  const reservationEnd = toTimestamp(reservation.endDateTime)

  if (
    selectedStart === null ||
    selectedEnd === null ||
    reservationStart === null ||
    reservationEnd === null
  ) {
    return false
  }

  return selectedStart < reservationEnd && selectedEnd > reservationStart
}

const getMinutesOfDay = (dateTime: string) => {
  const date = new Date(dateTime)
  return date.getHours() * 60 + date.getMinutes()
}

const getTimelineRange = (beginDt: string, endDt: string) => {
  const begin = new Date(beginDt)
  const end = new Date(endDt)
  const selectedStartHour = Number.isNaN(begin.getTime())
    ? DEFAULT_START_HOUR
    : begin.getHours()
  const selectedEndHour = Number.isNaN(end.getTime())
    ? DEFAULT_END_HOUR
    : Math.ceil((end.getHours() * 60 + end.getMinutes()) / 60)

  const startHour = Math.max(0, Math.min(DEFAULT_START_HOUR, selectedStartHour))
  const endHour = Math.min(24, Math.max(DEFAULT_END_HOUR, selectedEndHour))

  return {
    startMinutes: startHour * 60,
    endMinutes: endHour * 60,
    hours: Array.from(
      { length: endHour - startHour + 1 },
      (_, index) => startHour + index,
    ),
  }
}

const getBlockStyle = (
  startDateTime: string,
  endDateTime: string,
  timelineStartMinutes: number,
  timelineEndMinutes: number,
) => {
  const totalMinutes = timelineEndMinutes - timelineStartMinutes
  const startMinutes = Math.max(
    timelineStartMinutes,
    getMinutesOfDay(startDateTime),
  )
  const endMinutes = Math.min(timelineEndMinutes, getMinutesOfDay(endDateTime))

  return {
    left: `${((startMinutes - timelineStartMinutes) / totalMinutes) * 100}%`,
    width: `${(Math.max(0, endMinutes - startMinutes) / totalMinutes) * 100}%`,
  }
}

const MeetingRoomAvailabilityTimeline = ({
  rooms,
  reservations,
  beginDt,
  endDt,
  selectedRoomId,
  editingMeetingId,
  loading,
  errorMessage,
  onSelectRoom,
}: MeetingRoomAvailabilityTimelineProps) => {
  const beginTimestamp = toTimestamp(beginDt)
  const endTimestamp = toTimestamp(endDt)
  const hasValidRange =
    beginTimestamp !== null &&
    endTimestamp !== null &&
    beginTimestamp < endTimestamp &&
    isSameDate(beginDt, endDt)
  const { startMinutes, endMinutes, hours } = getTimelineRange(beginDt, endDt)

  const visibleReservations = reservations.filter(
    (reservation) =>
      reservation.mtngId !== editingMeetingId &&
      reservation.startDateTime.slice(0, 10) === beginDt.slice(0, 10),
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            회의실 현황
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            비어 있는 회의실 행을 선택하면 회의실이 지정됩니다.
          </p>
        </div>
        {loading && (
          <LoaderCircle
            className="mt-0.5 animate-spin text-blue-600"
            size={17}
            aria-label="회의실 현황 조회 중"
          />
        )}
      </div>

      {!hasValidRange ? (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-4 text-xs font-semibold text-slate-500">
          <AlertCircle size={16} />
          같은 날짜 안에서 올바른 시작 및 종료 시간을 입력해주세요.
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-4 text-xs font-semibold text-red-600">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-500">
          등록된 회의실이 없습니다.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[108px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50">
                <div className="border-r border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-400">
                  회의실
                </div>
                <div className="relative h-8">
                  {hours.map((hour, index) => (
                    <span
                      key={hour}
                      className="absolute top-2 -translate-x-1/2 text-[10px] font-bold text-slate-400"
                      style={{
                        left: `${(index / (hours.length - 1)) * 100}%`,
                      }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  ))}
                </div>
              </div>

              {rooms.map((room) => {
                const roomReservations = visibleReservations.filter(
                  (reservation) => reservation.roomId === room.roomId,
                )
                const unavailable = roomReservations.some((reservation) =>
                  isOverlapping(beginDt, endDt, reservation),
                )
                const selected = selectedRoomId === room.roomId

                return (
                  <button
                    key={room.roomId}
                    type="button"
                    disabled={unavailable}
                    onClick={() => onSelectRoom(room.roomId)}
                    className={`grid w-full grid-cols-[108px_minmax(0,1fr)] border-b border-slate-100 text-left last:border-b-0 ${
                      unavailable
                        ? 'cursor-not-allowed'
                        : 'transition-colors hover:bg-blue-50/40'
                    }`}
                    title={
                      unavailable
                        ? '입력한 시간에 이미 예약된 회의실입니다.'
                        : `${room.roomName} 선택`
                    }
                  >
                    <div
                      className={`flex min-h-12 flex-col justify-center border-r border-slate-200 px-3 ${
                        selected ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <span
                        className={`truncate text-xs font-bold ${
                          selected ? 'text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {room.roomName}
                      </span>
                      <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {unavailable ? '예약 불가' : selected ? '선택됨' : '예약 가능'}
                      </span>
                    </div>

                    <div className="relative min-h-12 overflow-hidden bg-white">
                      {hours.slice(1).map((hour, index) => (
                        <span
                          key={hour}
                          className="absolute inset-y-0 border-l border-dashed border-slate-200"
                          style={{
                            left: `${((index + 1) / (hours.length - 1)) * 100}%`,
                          }}
                        />
                      ))}

                      {roomReservations.map((reservation) => (
                        <span
                          key={reservation.reservationId}
                          className="absolute inset-y-2 rounded-sm border-x-2 border-red-400 bg-red-100/80"
                          style={getBlockStyle(
                            reservation.startDateTime,
                            reservation.endDateTime,
                            startMinutes,
                            endMinutes,
                          )}
                          title={`${reservation.title} (${reservation.startDateTime.slice(11, 16)}-${reservation.endDateTime.slice(11, 16)})`}
                        />
                      ))}

                      {selected && !unavailable && (
                        <span
                          className="absolute inset-y-1.5 rounded border-2 border-blue-500 bg-blue-100/80"
                          style={getBlockStyle(
                            beginDt,
                            endDt,
                            startMinutes,
                            endMinutes,
                          )}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            빨간 영역은 기존 예약, 파란 영역은 현재 선택한 시간입니다.
          </p>
        </>
      )}
    </section>
  )
}

export default MeetingRoomAvailabilityTimeline
