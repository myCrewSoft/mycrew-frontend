import axiosInstance from './axiosInstance'
import type {
  ReservationCreateRequest,
  ReservationResponse,
  RoomResponse,
} from '../types'
import type { ApiResponse } from './axiosInstance'

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

// 회의실 목록 조회 API입니다.
const getMeetingRooms = () => {
  return axiosInstance.get<ApiResponse<RoomResponse[]>>('/api/meeting-rooms')
}

// 선택한 기간의 회의실 예약 목록을 조회합니다.
const getReservations = (begin: string, end: string) => {
  return axiosInstance.get<ApiResponse<ReservationResponse[]>>('/api/reservation', {
    params: { begin, end },
  })
}

// 가장 가까운 예약을 조회합니다. 별도 API 없이 오늘부터 15일 뒤까지 조회합니다.
const getMyUpcomingReservations = () => {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 15)

  return getReservations(
    formatDateKey(today),
    formatDateKey(endDate),
  )
}

// 예약 등록 API입니다.
const createReservation = (payload: ReservationCreateRequest) => {
  return axiosInstance.post<ApiResponse<ReservationResponse>>(
    '/api/reservation',
    payload,
  )
}

export const meetingRoomReservationApi = {
  getMeetingRooms,
  getReservations,
  getMyUpcomingReservations,
  createReservation,
}
