// Date 객체를 YYYY-MM-DD 문자열로 바꿉니다.
// toISOString은 UTC 기준이라 한국 시간에서 날짜가 밀릴 수 있어 직접 조합합니다.
export const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Date 객체를 "2026년 5월" 같은 월 제목으로 바꿉니다.
export const formatMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

// ISO 날짜 문자열에서 시작 시간만 "14:00" 형태로 보여줍니다.
export const formatStartTime = (start: string) => {
  const startDate = new Date(start)

  if (Number.isNaN(startDate.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(startDate)
}

// Date 객체를 "09:00", "13:30"처럼 24시간 HH:mm 형식으로 보여줍니다.
export const formatTime = (date: Date) => {
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// API의 ISO 일시를 그룹웨어 공통 표기인 YYYY-MM-DD HH:mm 형식으로 보여줍니다.
export const formatDateTime = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

// ISO 날짜 문자열을 현재 시간 기준으로 "3일 후", "2시간 후", "30분 후" 형태로 보여줍니다.
export const formatRemainingTime = (start: string) => {
  const startDate = new Date(start)
  const now = new Date()

  if (Number.isNaN(startDate.getTime())) {
    return ''
  }

  const diffMs = startDate.getTime() - now.getTime()
  const diffMinutes = Math.max(0, Math.ceil(diffMs / 1000 / 60))

  const days = Math.floor(diffMinutes / 60 / 24)

  if (days > 0) {
    return `${days}일 후`
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 후`
  }

  const hours = Math.floor(diffMinutes / 60)

  return `${hours}시간 후`
}
