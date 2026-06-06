export interface AttendanceSummaryMetric {
  id: string
  title: string
  period: string
  value: string
  helper: string
  accent: 'green' | 'red' | 'blue'
}

export interface AttendanceHistoryItem {
  date: string
  day: string
  checkIn: string
  checkOut: string
  workTime: string
  status: '정상' | '지각' | '연장근무'
}

export const attendanceToday = {
  dateLabel: '2024년 4월 17일 수요일',
  timeLabel: '10:29:27',
  workStatus: '근무 중',
  checkIn: '08:42:33',
  checkOut: '미등록',
}

export const weeklyWorkStats = {
  month: '2024.04',
  title: '주간 근무 시간',
  subtitle: '04월 2주차 (주 52시간 기준 주간 근무 실적)',
  total: '24h 30m',
  minimum: '최소 40h',
  standard: '52 h',
  maximum: '최대 68h',
  remainingWork: '15h 30m',
  remainingOvertime: '12h',
  categories: [
    {
      label: '선택근무',
      value: '20h 30m',
      color: '#2563eb',
      border: '#bfdbfe',
      background: '#f8fbff',
    },
    {
      label: '초과근무 (연장)',
      value: '4h 00m',
      color: '#dc2626',
      border: '#ef4444',
      background: '#fff7f7',
    },
    {
      label: '승인근무 (연장)',
      value: '0h 00m',
      color: '#64748b',
      border: '#94a3b8',
      background: '#ffffff',
    },
  ],
}

export const attendanceMetrics: AttendanceSummaryMetric[] = [
  {
    id: 'vacation',
    title: '잔여연차',
    period: '2024년',
    value: '2d 3h',
    helper: '총 할당 9d 4h 3m',
    accent: 'green',
  },
  {
    id: 'late',
    title: '지각',
    period: '2024년 4월',
    value: '2회',
    helper: '1년에 10회중 2회 발생',
    accent: 'red',
  },
  {
    id: 'early-leave',
    title: '조퇴',
    period: '2024년 4월',
    value: '3회',
    helper: '1개월에 10회중 3회 발생',
    accent: 'blue',
  },
]

export const attendanceHistory: AttendanceHistoryItem[] = [
  {
    date: '2024.04.16',
    day: '화',
    checkIn: '08:52',
    checkOut: '18:05',
    workTime: '8h 13m',
    status: '정상',
  },
  {
    date: '2024.04.15',
    day: '월',
    checkIn: '09:12',
    checkOut: '18:15',
    workTime: '8h 03m',
    status: '지각',
  },
  {
    date: '2024.04.12',
    day: '금',
    checkIn: '08:45',
    checkOut: '19:30',
    workTime: '9h 45m',
    status: '연장근무',
  },
]
