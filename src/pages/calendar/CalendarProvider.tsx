import { useMemo, useState, type ReactNode } from 'react'
import {
  scheduleTypeColorTokenMap,
  type CalendarEventItem,
  type ScheduleTypeCode,
} from '../../types/calendar'
import { formatDateKey } from '../../utils/date'
import { CalendarContext } from './CalendarContext'

interface CalendarProviderProps {
  children: ReactNode
};

// 오늘 날짜를 기준으로 더미 일정을 만들기 위한 값입니다.
// 실제 백엔드 연동 후에는 mockCalendarEvents 대신 API 응답을 사용합니다.
const today = formatDateKey(new Date());

const getDateAfter = (baseDate: string, dayCount: number) => {
  const date = new Date(`${baseDate}T00:00:00`)

  date.setDate(date.getDate() + dayCount)

  return formatDateKey(date)
}

const getEventColor = (scheduleTypeCode: ScheduleTypeCode) =>
  scheduleTypeColorTokenMap[scheduleTypeCode]

const mockCalendarEvents: CalendarEventItem[] = [
  {
    id: '5',
    title: '디자인 QA 집중 기간',
    start: today,
    end: getDateAfter(today, 3),
    allDay: true,
    scheduleTypeCode: 'C005',
    backgroundColor: getEventColor('C005').background,
    borderColor: getEventColor('C005').border,
    textColor: getEventColor('C005').text,
  },
  {
    id: '1',
    title: '주간 기획 회의',
    start: `${today}T13:00:00`,
    end: `${today}T14:00:00`,
    scheduleTypeCode: 'C001',
    backgroundColor: getEventColor('C001').background,
    borderColor: getEventColor('C001').border,
    textColor: getEventColor('C001').text,
  },
  {
    id: '2',
    title: '디자인 리뷰',
    start: `${today}T14:00:00`,
    end: `${today}T15:30:00`,
    scheduleTypeCode: 'C001',
    backgroundColor: getEventColor('C001').background,
    borderColor: getEventColor('C001').border,
    textColor: getEventColor('C001').text,
  },
  {
    id: '3',
    title: '팀 점심 회식',
    start: `${today}T12:30:00`,
    end: `${today}T13:30:00`,
    scheduleTypeCode: 'C003',
    backgroundColor: getEventColor('C003').background,
    borderColor: getEventColor('C003').border,
    textColor: getEventColor('C003').text,
  },
  {
    id: '4',
    title: '프로젝트 킥오프',
    start: `${today}T16:00:00`,
    end: `${today}T17:00:00`,
    scheduleTypeCode: 'C005',
    backgroundColor: getEventColor('C005').background,
    borderColor: getEventColor('C005').border,
    textColor: getEventColor('C005').text,
  },
]

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
      mockCalendarEvents.filter((event) =>
        checkedScheduleTypeCodes.includes(event.scheduleTypeCode),
      ),
    [checkedScheduleTypeCodes],
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
        calendarEvents: mockCalendarEvents,
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
