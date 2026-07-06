import { Plus } from 'lucide-react'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import { taskColumns, taskStatusConfig } from './task.config'
import ProjectTaskCard from './ProjectTaskCard'
import type { ProjectTask, ProjectTaskStatusCode } from './task.types'

interface ProjectTaskBoardProps {
  tasks: ProjectTask[]
  onAddTask: (status: ProjectTaskStatusCode) => void
  onOpenTask: (task: ProjectTask) => void
}

const ProjectTaskBoard = ({ tasks, onAddTask, onOpenTask }: ProjectTaskBoardProps) => {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {taskColumns.map((statusKey) => {
        const status = taskStatusConfig[statusKey]
        const columnTasks = tasks.filter((task) => task.taskStatCd === statusKey)

        return (
          <section key={statusKey} className="min-w-0">
            <div className="mb-3 flex h-9 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                <span className="text-sm font-bold text-slate-700">{status.label}</span>
                <Badge size="count" variant="neutral" className="text-blue-600">
                  {columnTasks.length}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => onAddTask(statusKey)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
                aria-label={`${status.label} 업무 추가`}
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {columnTasks.map((task) => (
                <ProjectTaskCard key={task.taskId} task={task} onOpenTask={onOpenTask} />
              ))}
              <button
                type="button"
                onClick={() => onAddTask(statusKey)}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-600"
              >
                <Plus size={15} />
                업무 추가
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default ProjectTaskBoard
