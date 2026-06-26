// src/pages/project/ProjectGanttTab.tsx

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  Clock3,
  PauseCircle,
} from 'lucide-react'
import { taskApi } from '../../api/taskApi'
import { ApiError } from '../../api/axiosInstance'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import type { TaskListResponse } from '../../types'

interface ProjectGanttTabProps {
  projectId: string | number
}

type ScaleMode = 'day' | 'week' | 'month' | 'quarter'

interface GanttTask {
  id: number
  name: string
  manager: string
  managerDepartment: string
  managerJobGrade: string
  managerProfileFileId: number | null
  statusCode: string
  statusLabel: string
  progress: number
  start: Date
  end: Date
  startLabel: string
  endLabel: string
  durationDays: number
}

interface TimelineColumn {
  key: string
  label: string
  start: Date
  end: Date
}

const SCALE_OPTIONS: { label: string; value: ScaleMode }[] = [
  { label: '일간', value: 'day' },
  { label: '주간', value: 'week' },
  { label: '월간', value: 'month' },
  { label: '분기', value: 'quarter' },
]

const STATUS_META: Record<
  string,
  {
    label: string
    icon: typeof Clock3
    badgeClassName: string
    trackClassName: string
    fillClassName: string
  }
> = {
  '00': {
    label: '미착수',
    icon: Clock3,
    badgeClassName: 'bg-slate-100 text-slate-600 ring-slate-200',
    trackClassName: 'bg-slate-100 border border-slate-200',
    fillClassName: 'bg-slate-300',
  },
  '01': {
    label: '진행중',
    icon: Clock3,
    badgeClassName: 'bg-blue-50 text-blue-700 ring-blue-200',
    trackClassName: 'bg-blue-100',
    fillClassName: 'bg-blue-500',
  },
  '02': {
    label: '완료',
    icon: CheckCircle2,
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    trackClassName: 'bg-emerald-100',
    fillClassName: 'bg-emerald-500',
  },
  '03': {
    label: '일시중지',
    icon: PauseCircle,
    badgeClassName: 'bg-amber-50 text-amber-700 ring-amber-200',
    trackClassName: 'bg-amber-100',
    fillClassName: 'bg-amber-400',
  },
  '04': {
    label: '대기',
    icon: AlertCircle,
    badgeClassName: 'bg-violet-50 text-violet-700 ring-violet-200',
    trackClassName: 'bg-violet-100',
    fillClassName: 'bg-violet-500',
  },
}

const DAY_IN_MS = 1000 * 60 * 60 * 24

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

const startOfWeek = (date: Date) => {
  const base = startOfDay(date)
  const day = base.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return addDays(base, mondayOffset)
}

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1)

const startOfQuarter = (date: Date) =>
  new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)

const formatColumnLabel = (date: Date, scaleMode: ScaleMode) => {
  if (scaleMode === 'day') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (scaleMode === 'week') {
    const weekEnd = addDays(date, 6)
    return `${date.getMonth() + 1}/${date.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
  }

  if (scaleMode === 'month') {
    return `${date.getMonth() + 1}월`
  }

  return `${date.getFullYear()}.${Math.floor(date.getMonth() / 3) + 1}Q`
}

const getDurationDays = (start: Date, end: Date) =>
  Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_IN_MS) + 1)

const getStatusMeta = (statusCode: string) =>
  STATUS_META[statusCode] ?? STATUS_META['00']

const getTimelineWidth = (width: number) => `max(100%, ${width}px)`

const getManagerSubtitle = (task: GanttTask) => {
  const parts = [task.managerDepartment, task.managerJobGrade].filter(Boolean)
  return parts.join(' · ')
}

const getTimelineStep = (scaleMode: ScaleMode) => {
  if (scaleMode === 'day') return { unit: 'day', amount: 1, columnWidth: 58 }
  if (scaleMode === 'week') return { unit: 'day', amount: 7, columnWidth: 112 }
  if (scaleMode === 'month') return { unit: 'month', amount: 1, columnWidth: 118 }
  return { unit: 'month', amount: 3, columnWidth: 132 }
}

const getTimelineRange = (
  firstStart: Date,
  lastEnd: Date,
  scaleMode: ScaleMode,
) => {
  if (scaleMode === 'day') {
    return {
      start: addDays(firstStart, -1),
      end: addDays(lastEnd, 2),
    }
  }

  if (scaleMode === 'week') {
    return {
      start: startOfWeek(firstStart),
      end: addDays(startOfWeek(lastEnd), 7),
    }
  }

  if (scaleMode === 'month') {
    return {
      start: startOfMonth(firstStart),
      end: addMonths(startOfMonth(lastEnd), 1),
    }
  }

  return {
    start: startOfQuarter(firstStart),
    end: addMonths(startOfQuarter(lastEnd), 3),
  }
}

const createColumns = (start: Date, end: Date, scaleMode: ScaleMode) => {
  const step = getTimelineStep(scaleMode)
  const columns: TimelineColumn[] = []
  let cursor = startOfDay(start)

  while (cursor < end) {
    const next =
      step.unit === 'day'
        ? addDays(cursor, step.amount)
        : addMonths(cursor, step.amount)

    columns.push({
      key: cursor.toISOString(),
      label: formatColumnLabel(cursor, scaleMode),
      start: cursor,
      end: next,
    })

    cursor = next
  }

  return columns
}

const toGanttTask = (task: TaskListResponse): GanttTask | null => {
  if (!task.taskBgngDt || !task.taskEndDt) return null

  const rawStart = new Date(task.taskBgngDt)
  const rawEnd = new Date(task.taskEndDt)
  if (Number.isNaN(rawStart.getTime()) || Number.isNaN(rawEnd.getTime())) {
    return null
  }

  const start = startOfDay(rawStart)
  const end = startOfDay(rawEnd >= rawStart ? rawEnd : rawStart)
  const statusCode = task.taskStatCd ?? '00'

  return {
    id: task.taskId,
    name: task.taskNm || '이름 없는 업무',
    manager: task.taskMngrNm || '담당자 미정',
    managerDepartment: task.taskMngrDeptNm || '',
    managerJobGrade: task.taskMngrJobGrdNm || '',
    managerProfileFileId: task.prflImgFileId ?? null,
    statusCode,
    statusLabel: getStatusMeta(statusCode).label,
    progress: Math.min(100, Math.max(0, task.taskPrgrsSmry ?? 0)),
    start,
    end,
    startLabel: formatDate(start),
    endLabel: formatDate(end),
    durationDays: getDurationDays(start, end),
  }
}

const ProjectGanttTab = ({ projectId }: ProjectGanttTabProps) => {
  const [tasks, setTasks] = useState<TaskListResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [scaleMode, setScaleMode] = useState<ScaleMode>('day')

  useEffect(() => {
    let cancelled = false

    const fetchTasks = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await taskApi.getProjectTasks(projectId)
        if (!cancelled) {
          setTasks(response.data.data ?? [])
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : '업무 목록 조회 중 오류가 발생했습니다.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchTasks()

    return () => {
      cancelled = true
    }
  }, [projectId])

  const ganttTasks = useMemo(
    () =>
      tasks
        .map(toGanttTask)
        .filter((task): task is GanttTask => task !== null)
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [tasks],
  )

  const timeline = useMemo(() => {
    if (ganttTasks.length === 0) {
      return {
        start: startOfDay(new Date()),
        end: addDays(startOfDay(new Date()), 30),
        totalDays: 31,
        columns: [] as TimelineColumn[],
        width: 0,
      }
    }

    const firstStart = new Date(
      Math.min(...ganttTasks.map((task) => task.start.getTime())),
    )
    const lastEnd = new Date(
      Math.max(...ganttTasks.map((task) => task.end.getTime())),
    )
    const range = getTimelineRange(firstStart, lastEnd, scaleMode)
    const columns = createColumns(range.start, range.end, scaleMode)
    const totalDays = Math.max(
      1,
      Math.ceil((range.end.getTime() - range.start.getTime()) / DAY_IN_MS),
    )
    const width = Math.max(
      720,
      columns.length * getTimelineStep(scaleMode).columnWidth,
    )

    return {
      start: range.start,
      end: range.end,
      totalDays,
      columns,
      width,
    }
  }, [ganttTasks, scaleMode])

  const skippedCount = tasks.length - ganttTasks.length
  const completedCount = ganttTasks.filter((task) => task.statusCode === '02').length
  const averageProgress =
    ganttTasks.length === 0
      ? 0
      : Math.round(
          ganttTasks.reduce((sum, task) => sum + task.progress, 0) /
            ganttTasks.length,
        )
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const todayInTimeline =
    ganttTasks.length > 0 &&
    tomorrow >= timeline.start &&
    tomorrow < timeline.end
  const todayLeft = todayInTimeline
    ? (Math.floor((tomorrow.getTime() - timeline.start.getTime()) / DAY_IN_MS) /
        timeline.totalDays) *
      100
    : 0

  return (
    <div className="mt-5 space-y-4">
      <ContentCard
        title="간트차트"
        description="업무 기간과 진행률을 타임라인 막대로 확인합니다."
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {SCALE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScaleMode(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  scaleMode === option.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            업무 일정을 불러오는 중입니다...
          </div>
        ) : errorMessage ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm text-red-500">
            {errorMessage}
          </div>
        ) : ganttTasks.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
            <CalendarRange size={30} className="text-slate-300" />
            <p className="text-sm">
              {tasks.length === 0
                ? '등록된 업무가 없습니다.'
                : '시작일과 마감일이 모두 설정된 업무가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">전체 업무</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {ganttTasks.length}건
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">완료 업무</p>
                <p className="mt-1 text-xl font-bold text-emerald-800">
                  {completedCount}건
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-medium text-blue-700">평균 진행률</p>
                <p className="mt-1 text-xl font-bold text-blue-800">
                  {averageProgress}%
                </p>
              </div>
            </div>

            <div className="relative mt-6 rounded-xl border border-slate-200 bg-white">
              {todayInTimeline && (
                <div
                  className="pointer-events-none absolute -top-6 z-20 -translate-x-1/2"
                  style={{ left: `calc(260px + (100% - 260px) * ${todayLeft / 100})` }}
                >
                  <span className="relative inline-flex rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm shadow-blue-100">
                    오늘
                    <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-blue-600" />
                  </span>
                </div>
              )}
              <div className="grid grid-cols-[260px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-center border-r border-dashed border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-500">
                  업무
                </div>
                <div className="overflow-x-auto">
                  <div
                    className="relative grid min-h-10"
                    style={{
                      width: getTimelineWidth(timeline.width),
                      gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {timeline.columns.map((column) => (
                      <div
                        key={column.key}
                        className="flex items-center justify-center border-r border-dashed border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-500 last:border-r-0"
                      >
                        {column.label}
                      </div>
                    ))}
                    {todayInTimeline && (
                      <div
                        className="pointer-events-none absolute bottom-0 top-0 z-10 border-l border-dashed border-blue-400"
                        style={{ left: `${todayLeft}%` }}
                      >
                        <span className="hidden">
                          오늘
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto">
                {ganttTasks.map((task) => {
                  const meta = getStatusMeta(task.statusCode)
                  const StatusIcon = meta.icon
                  const managerSubtitle = getManagerSubtitle(task)
                  const taskEndExclusive = addDays(task.end, 1)
                  const offsetDays = Math.max(
                    0,
                    Math.floor((task.start.getTime() - timeline.start.getTime()) / DAY_IN_MS),
                  )
                  const taskDays = Math.max(
                    1,
                    Math.ceil((taskEndExclusive.getTime() - task.start.getTime()) / DAY_IN_MS),
                  )
                  const left = (offsetDays / timeline.totalDays) * 100
                  const width = (taskDays / timeline.totalDays) * 100

                  return (
                    <div
                      key={task.id}
                      className="grid min-h-[92px] grid-cols-[260px_minmax(0,1fr)] border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex min-w-0 flex-col justify-center border-r border-slate-100 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${meta.badgeClassName}`}
                            >
                              <StatusIcon size={12} />
                              {task.statusLabel}
                            </span>
                          </div>
                          <div
                            className="flex max-w-[150px] flex-shrink-0 items-start justify-end gap-2 text-right"
                            title={
                              managerSubtitle
                                ? `${task.manager} / ${managerSubtitle}`
                                : task.manager
                            }
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-700">
                                {task.manager}
                              </p>
                              {managerSubtitle && (
                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                  {managerSubtitle}
                                </p>
                              )}
                            </div>
                            <ProfileAvatar
                              fileId={task.managerProfileFileId}
                              name={task.manager}
                              size={30}
                            />
                          </div>
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                          {task.name}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <div
                          className="relative h-full min-h-[92px]"
                          style={{ width: getTimelineWidth(timeline.width) }}
                        >
                          <div
                            className="absolute inset-y-0 grid w-full"
                            style={{
                              gridTemplateColumns: `repeat(${timeline.columns.length}, minmax(0, 1fr))`,
                            }}
                          >
                            {timeline.columns.map((column) => (
                              <div
                                key={column.key}
                                className="border-r border-dashed border-slate-100 last:border-r-0"
                              />
                            ))}
                          </div>
                          {todayInTimeline && (
                            <div
                              className="pointer-events-none absolute bottom-0 top-0 z-10 border-l border-dashed border-blue-400"
                              style={{ left: `${todayLeft}%` }}
                            />
                          )}

                          <div
                            className={`absolute top-1/2 -translate-y-1/2 overflow-hidden rounded-md ${meta.trackClassName}`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              height: '36px',
                            }}
                            title={`${task.name} (${task.startLabel} - ${task.endLabel})`}
                          >
                            <div
                              className={`absolute inset-y-0 left-0 ${meta.fillClassName}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span
                            className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold text-slate-400"
                            style={{
                              left: `calc(${left + width}% + 8px)`,
                            }}
                          >
                            {task.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && !errorMessage && skippedCount > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            시작일 또는 마감일이 없는 업무 {skippedCount}건은 차트에 표시되지
            않습니다.
          </p>
        )}
      </ContentCard>
    </div>
  )
}

export default ProjectGanttTab
