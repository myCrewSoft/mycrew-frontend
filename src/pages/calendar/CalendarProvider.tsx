import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { scheduleApi, type ScheduleListParams } from '../../api/scheduleApi'
import { useApi } from '../../hooks/useApi'
import type { ScheduleResponseDto } from '../../types'
import {
  type CalendarEventItem,
  type ScheduleTypeCode,
} from '../../types/calendar'
import { formatDateKey } from '../../utils/date'
import { CalendarContext } from './CalendarContext'
import { toCalendarEvent } from './calendar.mapper'

interface CalendarProviderProps {
  children: ReactNode
}

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
  const today = formatDateKey(new Date())
  const [scheduleRange, setScheduleRange] = useState<ScheduleListParams>({
    beginDt: `${today}T00:00:00`,
    endDt: `${today}T23:59:59`,
  })

  const {
    data: schedules,
    loading: calendarLoading,
    error,
    execute: fetchSchedules,
  } = useApi<ScheduleResponseDto[], [ScheduleListParams]>(
    scheduleApi.getSchedules,
    {
      immediate: false,
      initialData: [],
    },
  )

  const refreshSchedules = useCallback(async () => {
    await fetchSchedules(scheduleRange)
  }, [fetchSchedules, scheduleRange])

  useEffect(() => {
    void refreshSchedules()
  }, [refreshSchedules])



  const { calendarEvents, mapperErrorMessage } = useMemo(() => {
    try {
      return {
        calendarEvents: (schedules ?? [])
          .map(toCalendarEvent)
          .filter((event): event is CalendarEventItem => event !== null),
        mapperErrorMessage: null,
      }
    } catch (mapperError) {
      return {
        calendarEvents: [],
        mapperErrorMessage:
          mapperError instanceof Error
            ? mapperError.message
            : 'Failed to convert schedule data for the calendar view.',
      }
    }
  }, [schedules])

  const [checkedScheduleTypeCodes, setCheckedScheduleTypeCodes] = useState<
    ScheduleTypeCode[]
  >(defaultCheckedScheduleTypeCodes)

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateKey(new Date()),
  )

  const visibleCalendarEvents = useMemo(
    () =>
      calendarEvents.filter((event) =>
        checkedScheduleTypeCodes.includes(event.scheduleTypeCode),
      ),
    [calendarEvents, checkedScheduleTypeCodes],
  )

  const upcomingSchedules = useMemo(() => {
    const now = new Date()

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
  }, [visibleCalendarEvents])

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
        scheduleRange,
        setScheduleRange,
        calendarLoading,
        calendarErrorMessage: mapperErrorMessage ?? error?.message ?? null,
        refreshSchedules
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}
