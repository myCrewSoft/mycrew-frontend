import { useState } from 'react'
import { CalendarDays, LayoutGrid, List, Search, SlidersHorizontal, Users } from 'lucide-react'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import { taskColumns, taskStatusConfig } from './task.config'
import ProjectTaskBoard from './ProjectTaskBoard'
import ProjectTaskCreateModal from './ProjectTaskCreateModal'
import ProjectTaskDetailModal from './ProjectTaskDetailModal'
import ProjectTaskList from './ProjectTaskList'
import type { ProjectTask, ProjectTaskStatusCode, ProjectTaskViewMode } from './task.types'

interface ProjectTasksTabProps {
  tasks: ProjectTask[]
  viewMode: ProjectTaskViewMode
  createModalOpen: boolean
  createStatus: ProjectTaskStatusCode
  onViewModeChange: (mode: ProjectTaskViewMode) => void
  onOpenCreateModal: (status?: ProjectTaskStatusCode) => void
  onCloseCreateModal: () => void
}

const ProjectTasksTab = ({
  tasks,
  viewMode,
  createModalOpen,
  createStatus,
  onViewModeChange,
  onOpenCreateModal,
  onCloseCreateModal,
}: ProjectTasksTabProps) => {
  const [query, setQuery] = useState('')
  const [taskList, setTaskList] = useState<ProjectTask[]>(tasks)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)

  const filteredTasks = taskList.filter((task) =>
    `${task.taskNm} ${task.taskCn} ${task.taskMngrName}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )

  const highPriorityCount = filteredTasks.filter((task) => task.taskPriorityCd === '01').length
  const myTaskCount = filteredTasks.filter((task) =>
    task.taskMngrName.includes('이보라'),
  ).length

  const handleCreateTask = (task: Omit<ProjectTask, 'taskId'>) => {
    setTaskList((prev) => [
      {
        ...task,
        taskId: Math.max(0, ...prev.map((item) => item.taskId)) + 1,
      },
      ...prev,
    ])
  }

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
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600"
          >
            <Users size={15} />
            내 업무
            <Badge size="count" variant="neutral">
              {myTaskCount}
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
            마감 임박
          </button>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
          <Users size={15} />
          참여자 5명
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
            placeholder="업무명, 상세내용, 담당자 검색..."
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

      {filteredTasks.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-slate-400">
          <Search size={28} className="mb-2 text-slate-300" />
          <p className="text-sm font-bold">검색 결과가 없습니다.</p>
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

      <ProjectTaskCreateModal
        open={createModalOpen}
        initialStatus={createStatus}
        onClose={onCloseCreateModal}
        onCreate={handleCreateTask}
      />
      <ProjectTaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  )
}

export default ProjectTasksTab
