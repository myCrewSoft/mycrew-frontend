// 백엔드에서 내려줄 회의실 정보 타입입니다.
// 실제 응답 필드명이 다르면 여기만 수정하면 화면 코드는 크게 바꾸지 않아도 됩니다.
export interface MeetingRoom {
  roomId: number
  roomName: string
  floor: string
  capacity: number
}

// 회의실 예약 정보 타입입니다.
// startDateTime, endDateTime은 ISO 문자열 형태를 기준으로 잡았습니다.
export interface MeetingRoomReservation {
  reservationId: number
  roomId: number
  title: string
  reserverName: string
  startDateTime: string
  endDateTime: string
  mine: boolean
}

// 예약 등록 모달에서 서버로 보낼 값입니다.
export interface CreateReservationRequest {
  roomId: number
  title: string
  startDateTime: string
  endDateTime: string
}