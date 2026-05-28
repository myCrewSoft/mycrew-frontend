import axiosInstance from './axiosInstance'
import type {
  CreateReservationRequest,
} from '../types/Reservation'

// 회의실 목록 조회 API입니다.
const getMeetingRooms = () => {
  return axiosInstance.get('/meeting-rooms')
}

// 선택한 날짜의 회의실 예약 목록을 조회합니다.
const getReservations = (date: string) => {
  return axiosInstance.get('/reservations', {
    params: { date },
  })
}

const getMyUpcomingReservations = () => {
  return axiosInstance.get('/reservations/my/upcoming')
}

// 예약 등록 API입니다.
const createReservation = (payload: CreateReservationRequest) => {
  return axiosInstance.post('/reservations', payload)
}

export const meetingRoomReservationApi = {
  getMeetingRooms,
  getReservations,
  getMyUpcomingReservations,
  createReservation,
}
