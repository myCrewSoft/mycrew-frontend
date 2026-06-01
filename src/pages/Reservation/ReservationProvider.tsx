import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { meetingRoomReservationApi } from '../../api/ReservationApi'
import { useApi } from '../../hooks/useApi'
import type { MeetingRoom } from '../../types/Reservation'
import { formatDateKey } from '../../utils/date'
import { ReservationContext } from './ReservationContext'

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  // 예약 화면 전체에서 공유할 선택 날짜입니다.
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()))

  // 서브사이드바 회의실 필터에서 체크된 회의실 id 목록입니다.
  const [checkedRoomIds, setCheckedRoomIds] = useState<number[]>([])

  // 회의실 목록은 페이지와 서브사이드바가 같이 쓰므로 Provider에서 한 번만 조회합니다.
  const {
    data,
    loading: roomsLoading,
    error,
    execute: fetchRooms,
  } = useApi<MeetingRoom[]>(meetingRoomReservationApi.getMeetingRooms, {
    immediate: false,
    initialData: [],
  })

  const rooms = useMemo(() => data ?? [], [data])

  useEffect(() => {
    void fetchRooms().then((response) => {
      const nextRooms = response.data ?? []

      if (nextRooms.length === 0) return

      setCheckedRoomIds((current) =>
        current.length > 0 ? current : nextRooms.map((room) => room.roomId),
      )
    })
  }, [fetchRooms])

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      rooms,
      checkedRoomIds,
      setCheckedRoomIds,
      roomsLoading,
      roomsErrorMessage: error?.message ?? null,
    }),
    [checkedRoomIds, error?.message, rooms, roomsLoading, selectedDate],
  )

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  )
}
