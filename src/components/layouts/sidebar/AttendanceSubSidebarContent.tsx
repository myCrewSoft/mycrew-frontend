import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react'
import IconButton from '../../common/button/IconButton'
import ContentCard from '../../common/dataDisplay/card/ContentCard'
import Badge from '../../common/dataDisplay/badge/Badge'
import { attendanceApi, type AtndHistory, type AtndToday } from '../../../api/attendanceApi'
import { formatDateKey, formatMonthTitle } from '../../../utils/date'

const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토']

type StatusVariant = 'success' | 'danger' | 'warning' | 'primary' | 'neutral'

const statusVariant = (nm?: string): StatusVariant => {
  switch (nm) {
    case '정상':
      return 'success'
    case '지각':
      return 'danger'
    case '조퇴':
      return 'warning'
    case '근무중':
      return 'primary'
    default:
      return 'neutral'
  }
}

// 달력 점 색상
const statusDot = (nm?: string): string => {
  switch (nm) {
    case '정상':
      return 'bg-emerald-500'
    case '지각':
      return 'bg-red-500'
    case '조퇴':
      return 'bg-amber-500'
    case '근무중':
      return 'bg-blue-500'
    case '휴가':
    case '반차':
      return 'bg-violet-500'
    default:
      return 'bg-slate-300'
  }
}

const formatTime = (dtm?: string | null) => {
  if (!dtm) return '--:--'
  const d = new Date(dtm)
  if (Number.isNaN(d.getTime())) return '--:--'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatMin = (min?: number | null) => {
  const m = min ?? 0
  if (m <= 0) return '0분'
  const h = Math.floor(m / 60)
  const r = m % 60
  return h === 0 ? `${r}분` : r === 0 ? `${h}시간` : `${h}시간 ${r}분`
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

const ymOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const AttendanceSubSidebarContent = () => {
  const todayKey = formatDateKey(new Date())

  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [today, setToday] = useState<AtndToday | null>(null)
  const [monthRows, setMonthRows] = useState<AtndHistory[]>([])

  const selectedDateObject = new Date(selectedDate)
  const monthDates = getMonthDates(viewMonth)

  // 오늘 근태
  useEffect(() => {
    let active = true
    attendanceApi
      .getToday()
      .then((res) => {
        if (active) setToday(res.data.data ?? null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // 보고 있는 월의 근태(달력 표시 + 선택일 상세)
  useEffect(() => {
    let active = true
    attendanceApi
      .getMonth(ymOf(viewMonth))
      .then((res) => {
        if (active) setMonthRows(res.data.data ?? [])
      })
      .catch(() => {
        if (active) setMonthRows([])
      })
    return () => {
      active = false
    }
  }, [viewMonth])

  // 날짜별 근태 맵
  const rowByDate = useMemo(() => {
    const map = new Map<string, AtndHistory>()
    monthRows.forEach((r) => {
      const key = r.atndDt?.slice(0, 10)
      if (key) map.set(key, r)
    })
    return map
  }, [monthRows])

  // 선택일 상세: 월 데이터 우선, 없으면 오늘이면 today, 그 외 null
  const detail = useMemo(() => {
    const row = rowByDate.get(selectedDate)
    if (row) {
      return {
        statNm: row.atndStatNm,
        checkIn: formatTime(row.wrkStartDtm),
        checkOut: formatTime(row.wrkEndDtm),
        workMin: row.workMin ?? 0,
        lateMin: row.lateMin ?? 0,
      }
    }
    if (selectedDate === todayKey && today) {
      return {
        statNm: today.checkedIn ? today.atndStatNm ?? '근무중' : '미출근',
        checkIn: formatTime(today.wrkStartDtm),
        checkOut: formatTime(today.wrkEndDtm),
        workMin: today.workMin ?? 0,
        lateMin: today.lateMin ?? 0,
      }
    }
    return null
  }, [rowByDate, selectedDate, today, todayKey])

  const moveMonth = (direction: 'prev' | 'next') => {
    setViewMonth((prev) => {
      const next = new Date(prev)
      next.setDate(1)
      next.setMonth(next.getMonth() + (direction === 'prev' ? -1 : 1))
      return next
    })
  }

  const cardTitle =
    selectedDate === todayKey
      ? '오늘 근태'
      : `${selectedDateObject.getMonth() + 1}월 ${selectedDateObject.getDate()}일 근태`

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* 선택일 근태 카드 */}
      <ContentCard
        title={cardTitle}
        className="rounded-lg"
        actions={
          <Badge variant={statusVariant(detail?.statNm)} size="sm">
            {detail?.statNm ?? '기록 없음'}
          </Badge>
        }
      >
        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 font-semibold text-slate-600">
              <LogIn size={14} className="text-emerald-500" /> 출근
            </dt>
            <dd className="font-black text-slate-950">{detail?.checkIn ?? '--:--'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 font-semibold text-slate-600">
              <LogOut size={14} className="text-slate-400" /> 퇴근
            </dt>
            <dd className="font-black text-slate-950">{detail?.checkOut ?? '--:--'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-1 pt-1">
            <dt className="text-xs font-semibold text-slate-500">근무시간</dt>
            <dd className="text-xs font-black text-blue-600">
              {formatMin(detail?.workMin)}
              {detail && detail.lateMin > 0 && (
                <span className="ml-2 text-red-500">지각 {detail.lateMin}분</span>
              )}
            </dd>
          </div>
        </dl>
      </ContentCard>

      {/* 달력 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-950">
            {formatMonthTitle(viewMonth)}
          </h3>
          <div className="flex items-center gap-1">
            <IconButton aria-label="이전 달" size="xs" onClick={() => moveMonth('prev')}>
              <ChevronLeft size={14} />
            </IconButton>
            <IconButton aria-label="다음 달" size="xs" onClick={() => moveMonth('next')}>
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
            const isToday = dateKey === todayKey
            const currentMonth = date.getMonth() === viewMonth.getMonth()
            const dayOfWeek = date.getDay()
            const row = rowByDate.get(dateKey)

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className="mx-auto flex flex-col items-center"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    selected
                      ? 'bg-blue-500 text-white'
                      : isToday
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-slate-100'
                  } ${currentMonth ? 'text-slate-900' : 'text-slate-300'} ${
                    dayOfWeek === 0 && !selected ? 'text-red-500' : ''
                  } ${dayOfWeek === 6 && !selected ? 'text-blue-500' : ''}`}
                >
                  {date.getDate()}
                </span>
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    row ? statusDot(row.atndStatNm) : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* 범례 */}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 정상
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> 지각
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 조퇴
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> 휴가
          </span>
        </div>
      </section>
    </div>
  )
}

export default AttendanceSubSidebarContent
