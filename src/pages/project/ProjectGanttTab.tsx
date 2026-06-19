// src/pages/project/ProjectGanttTab.tsx

import { useEffect, useMemo, useState } from 'react'
import { Gantt, type ITask } from '@svar-ui/react-gantt'
import '@svar-ui/react-gantt/all.css'
import { CalendarRange } from 'lucide-react'
import { taskApi } from '../../api/taskApi'
import { ApiError } from '../../api/axiosInstance'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import type { TaskListResponse } from '../../types'

interface ProjectGanttTabProps {
  projectId: string | number
}

type ScaleMode = 'day' | 'week' | 'month'

const SCALE_PRESETS: Record<ScaleMode, { unit: string; step: number; format: string }[]> = {
  day: [
    { unit: 'month', step: 1, format: 'yyyy년 M월' },
    { unit: 'day', step: 1, format: 'd' },
  ],
  week: [
    { unit: 'month', step: 1, format: 'yyyy년 M월' },
    { unit: 'week', step: 1, format: "'W'w" },
  ],
  month: [
    { unit: 'year', step: 1, format: 'yyyy' },
    { unit: 'month', step: 1, format: 'M월' },
  ],
}

const SCALE_OPTIONS: { label: string; value: ScaleMode }[] = [
  { label: '일', value: 'day' },
  { label: '주', value: 'week' },
  { label: '월', value: 'month' },
]

// 업무상태코드: 00-미착수 01-진행중 02-완료 03-일시중지 04-폐기
const STATUS_LABEL: Record<string, string> = {
  '00': '미착수',
  '01': '진행중',
  '02': '완료',
  '03': '일시중지',
  '04': '폐기',
}

const toGanttTask = (task: TaskListResponse): ITask | null => {
  if (!task.taskBgngDt || !task.taskEndDt) return null

  const start = new Date(task.taskBgngDt)
  const end = new Date(task.taskEndDt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  return {
    id: task.taskId,
    text: task.taskNm ?? '(이름 없음)',
    start,
    end: end > start ? end : start,
    progress: task.taskPrgrsSmry ?? 0,
    type: 'task',
    details: STATUS_LABEL[task.taskStatCd ?? ''] ?? '',
  }
}

const ProjectGanttTab = ({ projectId }: ProjectGanttTabProps) => {
  const [tasks, setTasks] = useState<TaskListResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [scaleMode, setScaleMode] = useState<ScaleMode>('week')

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
    () => tasks.map(toGanttTask).filter((task): task is ITask => task !== null),
    [tasks],
  )
  const skippedCount = tasks.length - ganttTasks.length
  const scales = SCALE_PRESETS[scaleMode]

  return (
    <div className="mt-5 space-y-4">
      <ContentCard
        title="간트차트"
        description="업무 일정을 막대로 표시합니다. (읽기 전용)"
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {SCALE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScaleMode(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  scaleMode === option.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            업무 일정을 불러오는 중입니다...
          </div>
        ) : errorMessage ? (
          <div className="flex h-64 items-center justify-center text-red-400">
            {errorMessage}
          </div>
        ) : ganttTasks.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
            <CalendarRange size={28} className="text-slate-300" />
            <p className="text-sm">
              {tasks.length === 0
                ? '등록된 업무가 없습니다.'
                : '시작일과 마감일이 모두 설정된 업무가 없습니다.'}
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-xl border border-slate-100"
            style={{ height: 480 }}
          >
            <Gantt
              tasks={ganttTasks}
              scales={scales}
              readonly
              cellHeight={40}
              columns={[
                { id: 'text', header: '업무명', flexgrow: 1, width: 180 },
              ]}
            />
          </div>
        )}

        {!loading && !errorMessage && skippedCount > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            시작일 또는 마감일이 없는 업무 {skippedCount}건은 차트에 표시되지 않았습니다.
          </p>
        )}
      </ContentCard>
    </div>
  )
}

export default ProjectGanttTab