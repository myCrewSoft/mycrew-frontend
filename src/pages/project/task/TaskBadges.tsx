import Badge from '../../../components/common/dataDisplay/badge/Badge'
import { taskPriorityConfig, taskScopeConfig, taskStatusConfig, taskTypeConfig } from './task.config'
import type {
  ProjectTaskPriorityCode,
  ProjectTaskScopeCode,
  ProjectTaskStatusCode,
  ProjectTaskTypeCode,
} from './task.types'

export const ProjectTaskStatusBadge = ({ status }: { status: ProjectTaskStatusCode }) => {
  const config = taskStatusConfig[status]

  return (
    <Badge
      variant="outline"
      className={`w-fit justify-self-start whitespace-nowrap ${config.badge}`}
    >
      {config.label}
    </Badge>
  )
}

export const ProjectTaskPriorityIndicator = ({
  priority,
}: {
  priority: ProjectTaskPriorityCode
}) => {
  const config = taskPriorityConfig[priority]

  return (
    <Badge
      variant="outline"
      className={`w-fit justify-self-start whitespace-nowrap ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  )
}

export const ProjectTaskTypeBadge = ({ typeCd }: { typeCd: ProjectTaskTypeCode }) => {
  const config = taskTypeConfig[typeCd]

  return (
    <Badge
      variant="outline"
      className={`w-fit justify-self-start whitespace-nowrap ${config.badge}`}
    >
      {config.label}
    </Badge>
  )
}

export const ProjectTaskScopeBadge = ({ scopeCd }: { scopeCd: ProjectTaskScopeCode }) => {
  const config = taskScopeConfig[scopeCd]

  return (
    <Badge
      variant="outline"
      className={`w-fit justify-self-start whitespace-nowrap ${config.badge}`}
    >
      {config.label}
    </Badge>
  )
}

export const ProjectTaskManagerAvatar = ({ name }: { name: string }) => {
  const label = name.slice(0, 2)

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-blue-600">
        {label}
      </span>
      <span className="text-xs font-bold text-slate-700">{name}</span>
    </div>
  )
}
