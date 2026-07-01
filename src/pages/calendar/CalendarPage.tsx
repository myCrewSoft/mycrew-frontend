import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import type FullCalendarComponent from '@fullcalendar/react'
import type {
  DateSelectArg,
  EventApi,
  EventClickArg,
  EventContentArg,
  MoreLinkArg,
} from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import Tabs from '../../components/common/tabs/Tabs'
import { scheduleApi } from '../../api/scheduleApi'
import { formatDateKey, formatMonthTitle, formatTime } from '../../utils/date'
import { useCalendar } from './CalendarContext'
import CalendarScheduleDetailModal from './CalendarScheduleDetailModal'
import CalendarScheduleDrawer from './CalendarScheduleDrawer'
import './calendar.css'
import type {
  CalendarEventItem,
  CalendarSelectedRange,
} from '../../types/calendar'
import { isCalendarSystemEvent } from '../../types/calendar'
import { toCalendarEvent } from './calendar.mapper'

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth';

interface CalendarMorePopoverState {
  date: Date
  events: EventApi[]
  left: number
  top: number
  placement: 'above' | 'below'
}

const CalendarEventLabel = ({
  event,
}: {
  event: Pick<
    EventApi,
    'allDay' | 'backgroundColor' | 'borderColor' | 'start' | 'textColor' | 'title'
  >
}) => {
  const startTime = event.start ? formatTime(event.start) : ''
  
  return (
    <div
      className={`calendar-main-event ${
        event.allDay ? 'calendar-main-event-all-day' : ''
      }`}
      style={
        {
          '--calendar-event-bg': event.backgroundColor || '#ffffff',
          '--calendar-event-border': event.borderColor || '#dbe3ef',
          '--calendar-event-color': event.textColor || '#0f172a',
        } as CSSProperties
      }
    >
      <span className="calendar-main-event-dot" />
      {!event.allDay && startTime && (
        <span className="calendar-main-event-time">{startTime}</span>
      )}
      <span className="calendar-main-event-title">
        {event.title}
      </span>
    </div>
  )
}

const renderCalendarEvent = (eventInfo: EventContentArg) => (
  <CalendarEventLabel event={eventInfo.event} />
)

const formatPopoverDate = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)

const padDateTimePart = (value: number) => String(value).padStart(2, '0')

const formatApiLocalDateTime = (date: Date) => {
  const year = date.getFullYear()
  const month = padDateTimePart(date.getMonth() + 1)
  const day = padDateTimePart(date.getDate())
  const hours = padDateTimePart(date.getHours())
  const minutes = padDateTimePart(date.getMinutes())
  const seconds = padDateTimePart(date.getSeconds())

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

const getFullCalendarEvents = (events: CalendarEventItem[]) =>
  events.map((event) => {
    if (!event.allDay || !event.end) {
      return event
    }

    const exclusiveEnd = new Date(event.end)

    if (Number.isNaN(exclusiveEnd.getTime())) {
      return event
    }

    exclusiveEnd.setDate(exclusiveEnd.getDate() + 1)
    exclusiveEnd.setHours(0, 0, 0, 0)

    return {
      ...event,
      end: formatApiLocalDateTime(exclusiveEnd),
    }
  })

const createSelectedRange = (selectInfo: DateSelectArg): CalendarSelectedRange => {
  const endDate = new Date(selectInfo.end)

  if (selectInfo.allDay) {
    endDate.setDate(endDate.getDate() - 1)
    endDate.setHours(23, 59, 0, 0)
  }

  return {
    start: formatApiLocalDateTime(selectInfo.start),
    end: formatApiLocalDateTime(endDate),
    allDay: selectInfo.allDay,
  }
}

const getCalendarSelectionEnd = (range: CalendarSelectedRange) => {
  const endDate = new Date(range.end)

  if (range.allDay) {
    endDate.setDate(endDate.getDate() + 1)
    endDate.setHours(0, 0, 0, 0)
  }

  return formatApiLocalDateTime(endDate)
}

const getDateOnlyTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const isDateInSelectedRange = (
  date: Date,
  range: CalendarSelectedRange | null,
) => {
  if (!range) return false

  const targetTime = getDateOnlyTime(date)
  const startDate = new Date(range.start)
  const endDate = new Date(range.end)

  return (
    targetTime >= getDateOnlyTime(startDate) &&
    targetTime <= getDateOnlyTime(endDate)
  )
}

const CalendarPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const notificationScheduleId = searchParams.get('scheduleId')
  // visibleCalendarEvents는 체크 필터가 적용된 일정 목록입니다.
  // selectedDate는 미니 캘린더와 큰 캘린더가 공유하는 선택 날짜입니다.
  const {
    visibleCalendarEvents,
    selectedDate,
    setSelectedDate,
    setScheduleRange,
    calendarLoading,
    calendarErrorMessage
  } = useCalendar();
  // 큰 FullCalendar의 내부 API를 사용하기 위한 ref입니다.
  const calendarRef = useRef<FullCalendarComponent>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 캘린더 보기 상태입니다.
  const [calendarView, setCalendarView] = useState<CalendarView>('dayGridMonth');

  // 큰 캘린더 상단에 표시할 현재 월 제목입니다.
  const [calendarTitle, setCalendarTitle] = useState(() => formatMonthTitle(new Date()));

  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [scheduleDetailOpen, setScheduleDetailOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] =
    useState<CalendarEventItem | null>(null)
  const [selectedRange, setSelectedRange] =
    useState<CalendarSelectedRange | null>(null)
  const selectedRangeRef = useRef<CalendarSelectedRange | null>(null)
  const restoringSelectionRef = useRef(false)
  const [morePopover, setMorePopover] =
    useState<CalendarMorePopoverState | null>(null);
  const fullCalendarEvents = useMemo(
    () => getFullCalendarEvents(visibleCalendarEvents),
    [visibleCalendarEvents],
  )

  useEffect(() => {
    if (!notificationScheduleId) return

    let cancelled = false

    const openNotificationSchedule = async () => {
      let schedule = visibleCalendarEvents.find(
        (event) => event.id === notificationScheduleId,
      )

      if (!schedule) {
        try {
          const response = await scheduleApi.getSchedule(notificationScheduleId)
          const scheduleResponse = response.data.data
          schedule = scheduleResponse
            ? (toCalendarEvent(scheduleResponse) ?? undefined)
            : undefined
        } catch {
          return
        }
      }

      if (cancelled || !schedule || isCalendarSystemEvent(schedule.scheduleTypeCode)) return

      setSelectedDate(formatDateKey(new Date(schedule.start)))
      setSelectedSchedule(schedule)
      setSelectedRange(null)
      setScheduleDrawerOpen(false)
      setScheduleDetailOpen(true)

      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('scheduleId')
      setSearchParams(nextSearchParams, { replace: true })

      calendarRef.current?.getApi().gotoDate(schedule.start)
    }

    void openNotificationSchedule()

    return () => {
      cancelled = true
    }
  }, [
    notificationScheduleId,
    searchParams,
    setSearchParams,
    setSelectedDate,
    visibleCalendarEvents,
  ])

  const restoreSelectedRange = () => {
    const range = selectedRangeRef.current
    const calendarApi = calendarRef.current?.getApi()

    if (!range || !calendarApi) return

    restoringSelectionRef.current = true
    calendarApi.select({
      start: range.start,
      end: getCalendarSelectionEnd(range),
      allDay: range.allDay,
    })

    window.setTimeout(() => {
      restoringSelectionRef.current = false
    }, 0)
  }

  useEffect(() => {
    selectedRangeRef.current = selectedRange
  }, [selectedRange])

  // selectedDate가 바뀌면 큰 캘린더를 해당 날짜로 이동시키고 제목도 갱신합니다.
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();

    if (!calendarApi) return;

    calendarApi.gotoDate(selectedDate);
    setCalendarTitle(formatMonthTitle(calendarApi.getDate()));
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedRange || selectedSchedule) return

    const timerId = window.setTimeout(() => {
      restoreSelectedRange()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [
    calendarView,
    scheduleDrawerOpen,
    selectedRange,
    selectedRange?.allDay,
    selectedRange?.end,
    selectedRange?.start,
    selectedSchedule,
  ])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      calendarRef.current?.getApi().updateSize();
      restoreSelectedRange()
      setMorePopover(null);
    }, 320);

    return () => window.clearTimeout(timerId);
  }, [scheduleDrawerOpen]);

  useEffect(() => {
    const containerElement = calendarContainerRef.current

    if (!containerElement) return

    let frameId = 0
    const updateCalendarSize = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        calendarRef.current?.getApi().updateSize()
        restoreSelectedRange()
        setMorePopover(null)
      })
    }

    const resizeObserver = new ResizeObserver(updateCalendarSize)
    resizeObserver.observe(containerElement)
    updateCalendarSize()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, []);

  const handleViewChange = (nextView: string) => {
    const view = nextView as CalendarView;
    const calendarApi = calendarRef.current?.getApi();

    setCalendarView(view);
    calendarApi?.changeView(view);
    setMorePopover(null);

    if (calendarApi) setCalendarTitle(formatMonthTitle(calendarApi.getDate()));
  };

  const moveMainCalendar = (direction: 'prev' | 'today' | 'next') => {
    const calendarApi = calendarRef.current?.getApi();

    if (!calendarApi) return;

    if (direction === 'prev') calendarApi.prev();
    if (direction === 'today') calendarApi.today();
    if (direction === 'next')  calendarApi.next();

    const currentDate = calendarApi.getDate();

    setCalendarTitle(formatMonthTitle(currentDate));
    setSelectedDate(formatDateKey(currentDate));
    setMorePopover(null);
  };

  const handleMoreLinkClick = (info: MoreLinkArg) => {
    const containerElement = calendarContainerRef.current;
    const targetElement = info.jsEvent.currentTarget as HTMLElement | null;

    if (!containerElement || !targetElement) return;

    const containerRect = containerElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const popoverWidth = Math.min(360, containerRect.width - 24);
    const popoverHeight = Math.min(360, 56 + info.allSegs.length * 40);
    const targetTop = targetRect.top - containerRect.top;
    const targetBottom = targetRect.bottom - containerRect.top;
    const spaceBelow = containerRect.height - targetBottom;
    const placement = spaceBelow >= popoverHeight + 18 ? 'below' : 'above';
    const left = Math.min(
      Math.max(targetRect.left - containerRect.left - 20, 12),
      Math.max(containerRect.width - popoverWidth - 12, 12),
    );
    const rawTop =
      placement === 'below'
        ? targetBottom + 10
        : targetTop - popoverHeight - 10;
    const top = Math.min(
      Math.max(rawTop, 12),
      Math.max(containerRect.height - popoverHeight - 12, 12),
    );

    setMorePopover({
      date: info.date,
      events: info.allSegs.map((segment) => segment.event),
      left,
      top,
      placement,
    });

    return true as never;
  };

  const handleScheduleClick = (info: EventClickArg) => {
    const schedule = visibleCalendarEvents.find(
      (event) => event.id === info.event.id,
    )

    if (!schedule || isCalendarSystemEvent(schedule.scheduleTypeCode)) return

    setSelectedDate(formatDateKey(info.event.start ?? new Date(schedule.start)))
    setSelectedSchedule(schedule)
    setSelectedRange(null)
    calendarRef.current?.getApi().unselect()
    setScheduleDrawerOpen(false)
    setScheduleDetailOpen(true)
    setMorePopover(null)
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (restoringSelectionRef.current) return

    const nextRange = createSelectedRange(selectInfo)

    setSelectedDate(formatDateKey(selectInfo.start))
    setSelectedSchedule(null)
    setSelectedRange(nextRange)
    setMorePopover(null)
  }

  const openCreateDrawer = () => {
    setSelectedSchedule(null)
    setScheduleDrawerOpen(true)
  }

  const closeScheduleDrawer = () => {
    setScheduleDrawerOpen(false)
    setSelectedSchedule(null)
  }

  const closeScheduleDetail = () => {
    setScheduleDetailOpen(false)
    setSelectedSchedule(null)
  }

  const openEditDrawer = (schedule: CalendarEventItem) => {
    setScheduleDetailOpen(false)
    setSelectedSchedule(schedule)
    setScheduleDrawerOpen(true)
  }

  return (
    <section className="flex h-full min-h-[720px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-950">
              {calendarTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <IconButton
              aria-label="이전 기간"
              size="sm"
              onClick={() => moveMainCalendar('prev')}
              className="border-0 bg-transparent"
            >
              <ChevronLeft size={16} />
            </IconButton>

            <button
              type="button"
              onClick={() => moveMainCalendar('today')}
              className="h-9 rounded-lg px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-white"
            >
              오늘
            </button>

            <IconButton
              aria-label="다음 기간"
              size="sm"
              onClick={() => moveMainCalendar('next')}
              className="border-0 bg-transparent"
            >
              <ChevronRight size={16} />
            </IconButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={calendarView}
            onChange={handleViewChange}
            items={[
              { value: 'dayGridMonth', label: '월' },
              { value: 'timeGridWeek', label: '주' },
              { value: 'timeGridDay', label: '일' },
              { value: 'listMonth', label: '목록' },
            ]}
          />

          <Button
            leftIcon={<Plus size={18} />}
            onClick={openCreateDrawer}
          >
            일정 등록
          </Button>
        </div>
      </header>

      {(calendarLoading || calendarErrorMessage) && (
        <div
          className={`flex min-h-11 shrink-0 items-center gap-2 border-b px-6 text-sm font-semibold ${
            calendarErrorMessage
              ? 'border-red-100 bg-red-50 text-red-700'
              : 'border-blue-100 bg-blue-50 text-blue-700'
          }`}
        >
          {calendarErrorMessage ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <Loader2 size={16} className="shrink-0 animate-spin" />
          )}
          <span>{calendarErrorMessage ?? '일정을 불러오는 중입니다.'}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <div
            ref={calendarContainerRef}
            className="calendar-main relative h-full bg-white"
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              initialView={calendarView}
              height="100%"
              locale="ko"
              headerToolbar={false}
              dayMaxEvents={2}
              moreLinkClick={handleMoreLinkClick}
              moreLinkContent={(args) => `+${args.num} 더보기`}
              dayPopoverFormat={{
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              }}
              eventDisplay="block"
              eventContent={renderCalendarEvent}
              eventOrder="-allDay,start,title"
              eventOrderStrict
              expandRows
              selectable
              unselectAuto={false}
              events={fullCalendarEvents}
              select={handleDateSelect}
              eventClick={handleScheduleClick}
              dateClick={(info) => {
                setSelectedDate(info.dateStr);
                setSelectedSchedule(null)
                setSelectedRange(null)
                calendarRef.current?.getApi().unselect()
                setMorePopover(null);
              }}
              datesSet={(info) => {
                const nextRange = {
                  beginDt: formatApiLocalDateTime(info.start),
                  endDt: formatApiLocalDateTime(info.end),
                }

                setScheduleRange((currentRange) => {
                  if (
                    currentRange?.beginDt === nextRange.beginDt &&
                    currentRange.endDt === nextRange.endDt
                  ) {
                    return currentRange
                  }

                  return nextRange
                })
                setCalendarTitle(formatMonthTitle(info.view.currentStart))
              }}
              dayCellClassNames={(info) =>
                isDateInSelectedRange(info.date, selectedRange) ||
                formatDateKey(info.date) === selectedDate
                  ? ['calendar-main-selected-day']
                  : []
              }
            />

            {morePopover && (
              <div
                className={`calendar-custom-more-popover calendar-custom-more-popover-${morePopover.placement}`}
                style={{
                  left: morePopover.left,
                  top: morePopover.top,
                }}
              >
                <div className="calendar-custom-more-popover-arrow" />
                <header className="calendar-custom-more-popover-header">
                  <h2>{formatPopoverDate(morePopover.date)}</h2>
                  <button
                    type="button"
                    aria-label="더보기 팝오버 닫기"
                    onClick={() => setMorePopover(null)}
                  >
                    ×
                  </button>
                </header>
                <div className="calendar-custom-more-popover-body">
                  {morePopover.events.map((event) => (
                    <CalendarEventLabel key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <CalendarScheduleDrawer
          key={`${selectedDate}-${selectedSchedule?.id ?? 'create'}`}
          open={scheduleDrawerOpen}
          selectedDate={selectedDate}
          selectedRange={selectedRange}
          schedule={selectedSchedule}
          onClose={closeScheduleDrawer}
        />
      </div>

      <CalendarScheduleDetailModal
        open={scheduleDetailOpen}
        schedule={selectedSchedule}
        onClose={closeScheduleDetail}
        onEdit={openEditDrawer}
      />
    </section>
  );
}

export default CalendarPage;
