import axiosInstance from './axiosInstance'
import type {
  ReservationCreateRequest,
  ReservationResponse,
  ReservationUpdateRequest,
  RoomCreateRequest,
  RoomResponse,
  RoomUpdateRequest,
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

// 회의실 단건 조회 API입니다.
const getMeetingRoom = (roomId: number) => {
  return axiosInstance.get<ApiResponse<RoomResponse>>(
    `/api/meeting-rooms/${roomId}`,
  )
}

// 회의실 등록 API입니다.
const createMeetingRoom = (payload: RoomCreateRequest) => {
  return axiosInstance.post<ApiResponse<RoomResponse>>(
    '/api/meeting-rooms',
    payload,
  )
}

// 회의실 수정 API입니다.
const updateMeetingRoom = (roomId: number, payload: RoomUpdateRequest) => {
  return axiosInstance.put<ApiResponse<void>>(
    `/api/meeting-rooms/${roomId}`,
    payload,
  )
}

// 회의실 삭제 API입니다.
const deleteMeetingRoom = (roomId: number) => {
  return axiosInstance.delete<ApiResponse<void>>(`/api/meeting-rooms/${roomId}`)
}

// 선택한 기간의 회의실 예약 목록을 조회합니다.
const getReservations = (begin: string, end: string) => {
  return axiosInstance.get<ApiResponse<ReservationResponse[]>>('/api/reservation', {
    params: { begin, end },
  })
}

// 예약 단건 조회 API입니다.
const getReservation = (reservationId: number) => {
  return axiosInstance.get<ApiResponse<ReservationResponse>>(
    `/api/reservation/${reservationId}`,
  )
}

// 가장 가까운 내 예약을 조회합니다. 별도 API가 없어 오늘부터 15일 뒤까지 조회합니다.
const getMyUpcomingReservations = () => {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 15)

  return getReservations(formatDateKey(today), formatDateKey(endDate))
}

// 예약 등록 API입니다.
const createReservation = (payload: ReservationCreateRequest) => {
  return axiosInstance.post<ApiResponse<ReservationResponse>>(
    '/api/reservation',
    payload,
  )
}

// 예약 수정 API입니다.
const updateReservation = (
  reservationId: number,
  payload: ReservationUpdateRequest,
) => {
  return axiosInstance.put<ApiResponse<void>>(
    `/api/reservation/${reservationId}`,
    payload,
  )
}

// 예약 삭제 API입니다.
const deleteReservation = (reservationId: number) => {
  return axiosInstance.delete<ApiResponse<void>>(
    `/api/reservation/${reservationId}`,
  )
}

export const meetingRoomReservationApi = {
  getMeetingRooms,
  getMeetingRoom,
  createMeetingRoom,
  updateMeetingRoom,
  deleteMeetingRoom,
  getReservations,
  getReservation,
  getMyUpcomingReservations,
  createReservation,
  updateReservation,
  deleteReservation,
}
