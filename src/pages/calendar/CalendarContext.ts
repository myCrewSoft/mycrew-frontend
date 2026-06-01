import { createContext, useContext } from 'react'
import type { ScheduleListParams } from '../../api/scheduleApi'
import type {
  CalendarEventItem,
  ScheduleTypeCode,
} from '../../types/calendar'

export interface CalendarContextValue {
  calendarEvents: CalendarEventItem[],
  visibleCalendarEvents: CalendarEventItem[],
  upcomingSchedules: CalendarEventItem[],
  checkedScheduleTypeCodes: ScheduleTypeCode[],
  setCheckedScheduleTypeCodes: (nextCodes: ScheduleTypeCode[]) => void,
  selectedDate: string,
  setSelectedDate: (nextDate: string) => void
  scheduleRange: ScheduleListParams,
  setScheduleRange: (nextRange: ScheduleListParams) => void
  calendarLoading: boolean,
  calendarErrorMessage: string | null,
  refreshSchedules: () => Promise<void>
};

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export const useCalendar = () => {
  const context = useContext(CalendarContext)

  if (!context) {
    throw new Error('useCalendar는 CalendarProvider 안에서만 사용할 수 있습니다.')
  }

  return context
};
