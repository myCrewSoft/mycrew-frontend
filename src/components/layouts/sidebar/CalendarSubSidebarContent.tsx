import { useRef, useState } from 'react'

const STORAGE_KEY_OPENED_GROUPS = 'calendar_opened_groups'

const loadOpenedGroups = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_OPENED_GROUPS)
    if (!stored) return ['basic']
    const parsed = JSON.parse(stored) as unknown
    if (Array.isArray(parsed)) return parsed as string[]
  } catch {
    // ignore parse errors
  }
  return ['basic']
}
import type FullCalendarComponent from '@fullcalendar/react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react'
import IconButton from '../../common/button/IconButton'
import SubSidebarSection from './SubSidebarSection'
import {
  scheduleTypeColorMap,
  type ScheduleTypeCode,
} from '../../../types/calendar'
import {
  formatDateKey,
  formatMonthTitle,
  formatRemainingTime,
  formatStartTime,
} from '../../../utils/date'
import { useCalendar } from '../../../pages/calendar/CalendarContext'

interface CalendarFilterItem {
  id: string
  label: string
  color: string
  scheduleTypeCode: ScheduleTypeCode
};

interface CalendarFilterGroup {
  id: string
  title: string
  items: CalendarFilterItem[]
};

// 일정 타입 필터를 화면에서 보기 좋은 그룹으로 묶은 설정입니다.
const calendarFilterGroups: CalendarFilterGroup[] = [
  {
    id: 'basic',
    title: '기본 일정',
    items: [
      {
        id: 'company',
        label: '전사 공통 일정',
        color: scheduleTypeColorMap.C001,
        scheduleTypeCode: 'C001',
      },
      {
        id: 'department',
        label: '부서 일정',
        color: scheduleTypeColorMap.C003,
        scheduleTypeCode: 'C003',
      },
      {
        id: 'personal',
        label: '개인 일정',
        color: scheduleTypeColorMap.C002,
        scheduleTypeCode: 'C002',
      },
      {
        id: 'executive',
        label: '간부 일정',
        color: scheduleTypeColorMap.C004,
        scheduleTypeCode: 'C004',
      },
    ],
  },
  {
    id: 'project',
    title: '프로젝트',
    items: [
      {
        id: 'project',
        label: '프로젝트 일정',
        color: scheduleTypeColorMap.C005,
        scheduleTypeCode: 'C005',
      },
      {
        id: 'project-task',
        label: '프로젝트 업무 일정',
        color: scheduleTypeColorMap.C006,
        scheduleTypeCode: 'C006',
      },
    ],
  },
  {
    id: 'etc',
    title: '기타',
    items: [
      {
        id: 'video',
        label: '화상회의',
        color: scheduleTypeColorMap.C007,
        scheduleTypeCode: 'C007',
      },
      {
        id: 'room',
        label: '회의실 예약',
        color: scheduleTypeColorMap.C008,
        scheduleTypeCode: 'C008',
      },
    ],
  },
]

const CalendarSubSidebarContent = () => {
  // CalendarContext에서 큰 캘린더와 공유하는 상태를 가져옵니다.
  const {
    upcomingSchedules,
    checkedScheduleTypeCodes,
    setCheckedScheduleTypeCodes,
    selectedDate,
    setSelectedDate,
  } = useCalendar();

  // 미니 FullCalendar의 이전/다음 이동을 위해 내부 API를 참조합니다.
  const miniCalendarRef = useRef<FullCalendarComponent>(null);

  // 미니 캘린더 상단 월 제목입니다.
  const [miniCalendarTitle, setMiniCalendarTitle] = useState(() =>
    formatMonthTitle(new Date()),
  );

  // 일정 그룹 접기/펼치기 상태입니다.
  const [openedGroupIds, setOpenedGroupIds] = useState<string[]>(loadOpenedGroups);

  const [activeTooltipScheduleId, setActiveTooltipScheduleId] = useState<
    string | null
  >(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const moveMiniCalendar = (direction: 'prev' | 'next') => {
    const calendarApi = miniCalendarRef.current?.getApi()

    if (!calendarApi) return

    if (direction === 'prev') {
      calendarApi.prev()
    } else {
      calendarApi.next()
    }

    setMiniCalendarTitle(formatMonthTitle(calendarApi.getDate()))
  };

  const toggleGroup = (groupId: string) => {
    setOpenedGroupIds((current) => {
      const next = current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
      localStorage.setItem(STORAGE_KEY_OPENED_GROUPS, JSON.stringify(next))
      return next
    })
  };

  const toggleFilter = (scheduleTypeCode: ScheduleTypeCode) => {
    const nextCodes = checkedScheduleTypeCodes.includes(scheduleTypeCode)
      ? checkedScheduleTypeCodes.filter((code) => code !== scheduleTypeCode)
      : [...checkedScheduleTypeCodes, scheduleTypeCode]

    setCheckedScheduleTypeCodes(nextCodes)
  };

  const handleUpcomingScheduleMouseEnter = (
    scheduleId: string,
    titleElement: HTMLElement | null,
  ) => {
    const isTitleOverflowing = titleElement
      ? titleElement.scrollWidth > titleElement.clientWidth
      : false

    setActiveTooltipScheduleId(isTitleOverflowing ? scheduleId : null)
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-950">일정</h2>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-950">
            {miniCalendarTitle}
          </h3>

          <div className="flex items-center gap-1">
            <IconButton
              aria-label="이전 달"
              size="xs"
              onClick={() => moveMiniCalendar('prev')}
            >
              <ChevronLeft size={14} />
            </IconButton>
            <IconButton
              aria-label="다음 달"
              size="xs"
              onClick={() => moveMiniCalendar('next')}
            >
              <ChevronRight size={14} />
            </IconButton>
          </div>
        </div>

        {/* 미니 달력은 FullCalendar를 사용하되, 헤더는 직접 만든 영역을 사용합니다. */}
        <div className="calendar-mini">
          <FullCalendar
            ref={miniCalendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            height="auto"
            locale="ko"
            fixedWeekCount={false}
            dayHeaderFormat={{ weekday: 'narrow' }}
            dayCellContent={(info) => info.dayNumberText.replace('일', '')}
            dayCellClassNames={(info) =>
              formatDateKey(info.date) === selectedDate
                ? ['calendar-mini-selected-day']
                : []
            }
            dateClick={(info) => setSelectedDate(info.dateStr)}
            events={[]}
          />
        </div>
      </section>

      <SubSidebarSection>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-950">다가오는 일정</h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              {upcomingSchedules.length}건
            </span>
          </div>

          {upcomingSchedules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {upcomingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="calendar-upcoming-item flex min-w-0 items-center gap-2"
                  data-tooltip={
                    activeTooltipScheduleId === schedule.id
                      ? schedule.title
                      : undefined
                  }
                  onMouseEnter={(event) => {
                    const titleElement = event.currentTarget.querySelector(
                      '[data-schedule-title]',
                    )

                    handleUpcomingScheduleMouseEnter(
                      schedule.id,
                      titleElement instanceof HTMLElement ? titleElement : null,
                    )
                  }}
                  onMouseLeave={() => setActiveTooltipScheduleId(null)}
                >
                  <span
                    className="h-7 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: schedule.backgroundColor }}
                  />

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p
                      data-schedule-title
                      className="truncate text-sm font-bold text-slate-800"
                    >
                      {schedule.title}
                    </p>

                    <p className="shrink-0 text-[13px] font-bold text-slate-700">
                      {formatStartTime(schedule.start)}
                      <span className="ml-1 text-[11px] font-semibold text-blue-500">
                        ({formatRemainingTime(schedule.start)})
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-400">
              예정된 일정이 없습니다.
            </p>
          )}
        </div>
      </SubSidebarSection>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-11 items-center justify-between border-b border-slate-200 px-4">
          <h3 className="text-sm font-bold text-slate-950">일정 목록</h3>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={`rounded-md p-1 transition-colors hover:bg-slate-100 hover:text-slate-700 ${
                settingsOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
              }`}
              aria-label="일정 목록 설정"
            >
              <Settings size={15} />
            </button>

            {settingsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setSettingsOpen(false)}
                />
                <div className="fixed left-1/2 top-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-700">일정 표시 설정</p>
                  </div>
                  <div className="py-1.5">
                    {calendarFilterGroups.map((group) => (
                      <div key={group.id}>
                        <p className="px-4 pb-1 pt-2 text-[11px] font-bold text-slate-400">
                          {group.title}
                        </p>
                        {group.items.map((item) => {
                          const checked = checkedScheduleTypeCodes.includes(
                            item.scheduleTypeCode,
                          )
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleFilter(item.scheduleTypeCode)}
                              className="flex h-8 w-full items-center gap-2.5 px-4 text-left transition-colors hover:bg-slate-50"
                              aria-pressed={checked}
                            >
                              <span
                                className="h-3.5 w-3.5 shrink-0 rounded"
                                style={{
                                  backgroundColor: checked ? item.color : 'transparent',
                                  border: `2px solid ${item.color}`,
                                }}
                              />
                              <span
                                className={`truncate text-sm ${
                                  checked
                                    ? 'font-semibold text-slate-700'
                                    : 'font-medium text-slate-400 line-through'
                                }`}
                              >
                                {item.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {calendarFilterGroups.map((group) => {
            const opened = openedGroupIds.includes(group.id)

            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex h-9 w-full items-center justify-between px-4 text-left text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${
                      opened ? '' : '-rotate-90'
                    }`}
                  />
                </button>

                {opened && (
                  <div className="pb-2">
                    {group.items.map((item) => {
                      const checked = checkedScheduleTypeCodes.includes(
                        item.scheduleTypeCode,
                      )

                      return (
                        <div
                          key={item.id}
                          className="flex h-8 w-full items-center gap-3 px-4"
                        >
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded"
                            style={{
                              backgroundColor: checked
                                ? item.color
                                : 'transparent',
                              border: `2px solid ${item.color}`,
                            }}
                          />
                          <span
                            className={`truncate text-sm ${
                              checked
                                ? 'font-semibold text-slate-700'
                                : 'font-medium text-slate-400 line-through'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
}

export default CalendarSubSidebarContent;
