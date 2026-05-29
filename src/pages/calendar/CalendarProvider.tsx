import { useMemo, useState, type ReactNode } from 'react'
import {
  type CalendarEventItem,
  type ScheduleTypeCode,
} from '../../types/calendar'
import { formatDateKey } from '../../utils/date'
import { CalendarContext } from './CalendarContext'

interface CalendarProviderProps {
  children: ReactNode
};

// 처음 화면에 들어왔을 때는 모든 일정 타입이 체크된 상태로 시작합니다.
const defaultCheckedScheduleTypeCodes: ScheduleTypeCode[] = [
  'C001',
  'C002',
  'C003',
  'C004',
  'C005',
  'C006',
  'C007',
  'C008',
]

export const CalendarProvider = ({ children }: CalendarProviderProps) => {
  // 백엔드 연동 전에는 일정 데이터를 넣지 않고 빈 배열로 시작합니다.
  // 나중에 일정 조회 API를 붙이면 이 값을 API 응답 상태로 교체하면 됩니다.
  const calendarEvents = useMemo<CalendarEventItem[]>(() => [], [])

  // 서브사이드바의 일정 타입 체크 상태입니다.
  // 체크 해제된 타입의 일정은 큰 캘린더에서 숨겨집니다.
  const [checkedScheduleTypeCodes, setCheckedScheduleTypeCodes] = useState<
    ScheduleTypeCode[]
  >(defaultCheckedScheduleTypeCodes);

  // 미니 캘린더와 큰 캘린더가 같이 사용하는 선택 날짜입니다.
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(new Date()),
  );

  // 체크된 일정 타입만 남긴 이벤트 목록입니다.
  const visibleCalendarEvents = useMemo(
    () =>
      calendarEvents.filter((event) =>
        checkedScheduleTypeCodes.includes(event.scheduleTypeCode),
      ),
    [calendarEvents, checkedScheduleTypeCodes],
  );

  // 현재 시간 이후의 일정만 가까운 순서대로 보여줍니다.
  // 서브사이드바의 "다가오는 일정" 영역에서 사용합니다.
  const upcomingSchedules = useMemo(() => {
    const now = new Date();

    return visibleCalendarEvents
      .filter((event) => {
        const startDate = new Date(event.start)

        return !Number.isNaN(startDate.getTime()) && startDate >= now
      })
      .sort(
        (firstEvent, secondEvent) =>
          new Date(firstEvent.start).getTime() -
          new Date(secondEvent.start).getTime(),
      )
      .slice(0, 2)
  }, [visibleCalendarEvents]);

  return (
    <CalendarContext.Provider
      value={{
        calendarEvents,
        visibleCalendarEvents,
        upcomingSchedules,
        checkedScheduleTypeCodes,
        setCheckedScheduleTypeCodes,
        selectedDate,
        setSelectedDate,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}
