import { CalendarDays } from 'lucide-react'
import { taskStatusConfig } from './task.config'
import {
  ProjectTaskManagerAvatar,
  ProjectTaskPriorityIndicator,
  ProjectTaskScopeBadge,
  ProjectTaskTypeBadge,
} from './TaskBadges'
import type { ProjectTask } from './task.types'

interface ProjectTaskCardProps {
  task: ProjectTask
  onOpenTask?: (task: ProjectTask) => void
}

const ProjectTaskCard = ({ task, onOpenTask }: ProjectTaskCardProps) => {
  const status = taskStatusConfig[task.taskStatCd]

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200">
      <div className="mb-3 flex flex-wrap gap-1.5">
        <ProjectTaskTypeBadge typeCd={task.taskTypeCd} />
        <ProjectTaskScopeBadge scopeCd={task.taskScopeCd} />
      </div>

      <button
        type="button"
        onClick={() => onOpenTask?.(task)}
        className="block w-full text-left"
      >
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-900 hover:text-blue-600">
          {task.taskNm}
        </h3>
      </button>

      <p className="mt-2 line-clamp-2 min-h-[36px] text-xs leading-5 text-slate-500">
        {task.taskCn}
      </p>

      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-500">
        <CalendarDays size={13} />
        {task.taskBgngDt} ~ {task.taskEndDt}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>진척률</span>
          <span className="font-bold text-slate-700">{task.taskProgressRate}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${status.bar}`}
            style={{ width: `${task.taskProgressRate}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <ProjectTaskManagerAvatar name={task.taskMngrName} />
        <ProjectTaskPriorityIndicator priority={task.taskPriorityCd} />
      </div>
    </article>
  )
}

export default ProjectTaskCard
