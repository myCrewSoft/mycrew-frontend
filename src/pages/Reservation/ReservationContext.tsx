import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { meetingRoomReservationApi } from '../../api/ReservationApi'
import { useApi } from '../../hooks/useApi'
import type { MeetingRoom } from '../../types/Reservation'
import { formatDateKey } from '../../utils/date'

interface ReservationContextValue {
  selectedDate: string
  setSelectedDate: (date: string) => void
  rooms: MeetingRoom[]
  checkedRoomIds: number[]
  setCheckedRoomIds: (roomIds: number[]) => void
  roomsLoading: boolean
  roomsErrorMessage: string | null
}

const ReservationContext = createContext<ReservationContextValue | null>(null)

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  // 예약 화면 전체에서 공유할 선택 날짜입니다.
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()))

  // 서브사이드바의 회의실 필터에서 체크된 회의실 id 목록입니다.
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

  const rooms = data ?? []

  useEffect(() => {
    void fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    if (rooms.length === 0) return

    // 회의실 목록을 처음 받아오면 기본값으로 모든 회의실을 선택합니다.
    setCheckedRoomIds((current) =>
      current.length > 0 ? current : rooms.map((room) => room.roomId),
    )
  }, [rooms])

  const value = useMemo<ReservationContextValue>(
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

export const useReservation = () => {
  const context = useContext(ReservationContext)

  if (!context) {
    throw new Error('useReservation must be used inside ReservationProvider')
  }

  return context
}
