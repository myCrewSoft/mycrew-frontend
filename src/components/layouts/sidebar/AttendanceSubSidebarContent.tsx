import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import IconButton from '../../common/button/IconButton'
import ContentCard from '../../common/dataDisplay/card/ContentCard'
import Badge from '../../common/dataDisplay/badge/Badge'
import { attendanceToday } from '../../../pages/attendance/attendance.mock'
import { formatDateKey, formatMonthTitle } from '../../../utils/date'

const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토']

const todayStatusBadgeVariantMap: Record<
  string,
  'success' | 'danger' | 'warning' | 'neutral' | 'outline'
> = {
  '근무 중': 'success',
  퇴근: 'neutral',
  지각: 'danger',
  휴가: 'warning',
  미출근: 'outline',
}

const getMonthDates = (currentMonth: Date) => {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDate = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0)
  const dates: Date[] = []

  for (let index = firstDate.getDay(); index > 0; index -= 1) {
    dates.push(new Date(year, month, 1 - index))
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    dates.push(new Date(year, month, day))
  }

  while (dates.length % 7 !== 0) {
    dates.push(new Date(year, month, dates.length - firstDate.getDay() + 1))
  }

  return dates
}

const AttendanceSubSidebarContent = () => {
  const [selectedDate, setSelectedDate] = useState('2024-04-17')
  const selectedDateObject = new Date(selectedDate)
  const monthDates = getMonthDates(selectedDateObject)

  const moveMonth = (direction: 'prev' | 'next') => {
    const nextDate = new Date(selectedDate)
    nextDate.setMonth(nextDate.getMonth() + (direction === 'prev' ? -1 : 1))
    nextDate.setDate(1)

    setSelectedDate(formatDateKey(nextDate))
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ContentCard
        title="내 근태 상태"
        className="rounded-lg"
        actions={
          <Badge
            variant={todayStatusBadgeVariantMap[attendanceToday.workStatus] ?? 'neutral'}
            size="sm"
          >
            {attendanceToday.workStatus}
          </Badge>
        }
      >
        <dl className="mt-7 flex flex-col gap-5 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <dt className="font-semibold text-slate-600">출근시간</dt>
            <dd className="font-black text-slate-950">{attendanceToday.checkIn}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-slate-600">퇴근시간</dt>
            <dd className="font-black text-slate-400">{attendanceToday.checkOut}</dd>
          </div>
        </dl>
      </ContentCard>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-950">
            {formatMonthTitle(selectedDateObject)}
          </h3>

          <div className="flex items-center gap-1">
            <IconButton
              aria-label="이전 달"
              size="xs"
              onClick={() => moveMonth('prev')}
            >
              <ChevronLeft size={14} />
            </IconButton>
            <IconButton
              aria-label="다음 달"
              size="xs"
              onClick={() => moveMonth('next')}
            >
              <ChevronRight size={14} />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekDayLabels.map((label) => (
            <span
              key={label}
              className="py-1 text-xs font-bold text-slate-500 first:text-red-500 last:text-blue-500"
            >
              {label}
            </span>
          ))}

          {monthDates.map((date) => {
            const dateKey = formatDateKey(date)
            const selected = dateKey === selectedDate
            const currentMonth = date.getMonth() === selectedDateObject.getMonth()
            const dayOfWeek = date.getDay()

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  selected ? 'bg-blue-500 text-white' : 'hover:bg-slate-100'
                } ${currentMonth ? 'text-slate-900' : 'text-slate-300'} ${
                  dayOfWeek === 0 && !selected ? 'text-red-500' : ''
                } ${dayOfWeek === 6 && !selected ? 'text-blue-500' : ''}`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AttendanceSubSidebarContent
