export const TIMELINE_START_HOUR = 9
export const TIMELINE_END_HOUR = 18
export const SLOT_WIDTH = 96

// 09:00부터 18:00까지 화면에 보여줄 시간 목록을 만듭니다.
export const timelineHours = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
  (_, index) => TIMELINE_START_HOUR + index,
)

// 날짜 문자열에서 시간을 분 단위로 바꿉니다.
export const getMinutesFromDateTime = (dateTime: string) => {
  const date = new Date(dateTime)

  return date.getHours() * 60 + date.getMinutes()
}

// 예약 시작 시간을 왼쪽 위치(px)로 변환합니다.
export const getReservationLeft = (startDateTime: string) => {
  const startMinutes = getMinutesFromDateTime(startDateTime)
  const baseMinutes = TIMELINE_START_HOUR * 60

  return ((startMinutes - baseMinutes) / 60) * SLOT_WIDTH
}

// 예약 시작~종료 시간을 너비(px)로 변환합니다.
export const getReservationWidth = (
  startDateTime: string,
  endDateTime: string,
) => {
  const startMinutes = getMinutesFromDateTime(startDateTime)
  const endMinutes = getMinutesFromDateTime(endDateTime)

  return ((endMinutes - startMinutes) / 60) * SLOT_WIDTH
}

// 예약 시작 시간을 타임라인 전체 너비 기준의 퍼센트 위치로 바꿉니다.
// 시간 칸이 화면 폭에 맞춰 늘어나도 예약 블록 위치가 같이 맞춰지도록 사용합니다.
export const getReservationLeftPercent = (startDateTime: string) => {
  const startMinutes = getMinutesFromDateTime(startDateTime)
  const baseMinutes = TIMELINE_START_HOUR * 60
  const totalMinutes = (TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * 60

  return ((startMinutes - baseMinutes) / totalMinutes) * 100
}

// 예약 시간을 타임라인 전체 너비 기준의 퍼센트 너비로 바꿉니다.
export const getReservationWidthPercent = (
  startDateTime: string,
  endDateTime: string,
) => {
  const startMinutes = getMinutesFromDateTime(startDateTime)
  const endMinutes = getMinutesFromDateTime(endDateTime)
  const totalMinutes = (TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * 60

  return ((endMinutes - startMinutes) / totalMinutes) * 100
}

// 빈 영역 클릭 위치를 예약 시작 시간으로 바꿉니다.
export const getClickedStartDateTime = (
  selectedDate: string,
  clickedX: number,
) => {
  const clickedHourOffset = Math.floor(clickedX / SLOT_WIDTH)
  const hour = TIMELINE_START_HOUR + clickedHourOffset

  return `${selectedDate}T${String(hour).padStart(2, '0')}:00:00`
}
