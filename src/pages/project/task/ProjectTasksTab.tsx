import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react'
import { ApiError } from '../../../api/axiosInstance'
import { taskApi } from '../../../api/taskApi'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import { taskColumns, taskStatusConfig } from './task.config'
import ProjectTaskBoard from './ProjectTaskBoard'
import ProjectTaskCreateModal from './ProjectTaskCreateModal'
import ProjectTaskDetailModal from './ProjectTaskDetailModal'
import ProjectTaskList from './ProjectTaskList'
import type { ProjectTask, ProjectTaskStatusCode, ProjectTaskViewMode } from './task.types'

interface ProjectTasksTabProps {
  projectId: string | number
  viewMode: ProjectTaskViewMode
  createModalOpen: boolean
  createStatus: ProjectTaskStatusCode
  onViewModeChange: (mode: ProjectTaskViewMode) => void
  onOpenCreateModal: (status?: ProjectTaskStatusCode) => void
  onCloseCreateModal: () => void
}

const ProjectTasksTab = ({
  projectId,
  viewMode,
  createModalOpen,
  createStatus,
  onViewModeChange,
  onOpenCreateModal,
  onCloseCreateModal,
}: ProjectTasksTabProps) => {
  const [query, setQuery] = useState('')
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await taskApi.getProjectTasks(projectId)
      setTasks(response.data.data ?? [])
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : '업무 목록 조회 중 오류가 발생했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTasks()
  }, [fetchTasks])

  const filteredTasks = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return tasks

    return tasks.filter((task) =>
      `${task.taskNm} ${task.taskCn} ${task.taskMngrNm} ${task.taskId}`
        .toLowerCase()
        .includes(keyword),
    )
  }, [query, tasks])

  const highPriorityCount = filteredTasks.filter((task) => task.taskPriorityCd === '01').length
  const incompleteTaskCount = filteredTasks.filter((task) => task.taskStatCd !== '02').length

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600"
          >
            <LayoutGrid size={15} />
            전체
            <Badge size="count" variant="neutral">
              {filteredTasks.length}
            </Badge>
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600"
          >
            <SlidersHorizontal size={15} />
            높은 우선순위
            <Badge size="count" variant="neutral">
              {highPriorityCount}
            </Badge>
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600"
          >
            <CalendarDays size={15} />
            미완료
            <Badge size="count" variant="neutral">
              {incompleteTaskCount}
            </Badge>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="업무명, 상세내용, 담당자, 업무 ID 검색"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="inline-flex h-11 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex h-9 w-10 items-center justify-center rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            aria-label="리스트형 보기"
          >
            <List size={17} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('card')}
            className={`flex h-9 w-10 items-center justify-center rounded-md transition-colors ${
              viewMode === 'card'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            aria-label="카드형 보기"
          >
            <LayoutGrid size={17} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-600">
        {taskColumns.map((statusKey) => {
          const status = taskStatusConfig[statusKey]
          const count = filteredTasks.filter((task) => task.taskStatCd === statusKey).length

          return (
            <span key={statusKey} className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
              <Badge size="count" variant="neutral" className="text-blue-600">
                {count}
              </Badge>
            </span>
          )
        })}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-400">
          업무 목록을 불러오는 중입니다.
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-slate-400">
          <Search size={28} className="mb-2 text-slate-300" />
          <p className="text-sm font-bold">조회된 업무가 없습니다.</p>
        </div>
      ) : viewMode === 'list' ? (
        <ProjectTaskList tasks={filteredTasks} onOpenTask={setSelectedTask} />
      ) : (
        <ProjectTaskBoard
          tasks={filteredTasks}
          onAddTask={onOpenCreateModal}
          onOpenTask={setSelectedTask}
        />
      )}

      {createModalOpen && (
        <ProjectTaskCreateModal
          key={`${projectId}-${createStatus}`}
          open={createModalOpen}
          initialStatus={createStatus}
          projId={Number(projectId)}
          onClose={onCloseCreateModal}
          onCreated={fetchTasks}
        />
      )}
      <ProjectTaskDetailModal
        projectId={projectId}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}

export default ProjectTasksTab
