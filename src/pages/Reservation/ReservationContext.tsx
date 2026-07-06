import { createContext, useContext } from 'react'
import type { RoomResponse } from '../../types'

export interface ReservationContextValue {
  selectedDate: string
  setSelectedDate: (date: string) => void
  rooms: RoomResponse[]
  checkedRoomIds: number[]
  setCheckedRoomIds: (roomIds: number[]) => void
  roomsLoading: boolean
  roomsErrorMessage: string | null
}

export const ReservationContext =
  createContext<ReservationContextValue | null>(null)

export const useReservation = () => {
  const context = useContext(ReservationContext)

  if (!context) {
    throw new Error('useReservation must be used inside ReservationProvider')
  }

  return context
}
