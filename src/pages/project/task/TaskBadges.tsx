import Badge from '../../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import {
  getTaskPriorityConfig,
  getTaskStatusConfig,
  getTaskTypeConfig,
} from './task.config'

export const ProjectTaskStatusBadge = ({ status }: { status: string }) => {
  const config = getTaskStatusConfig(status)

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
  priority: string
}) => {
  const config = getTaskPriorityConfig(priority)

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

export const ProjectTaskTypeBadge = ({ typeCd }: { typeCd: string }) => {
  const config = getTaskTypeConfig(typeCd)

  return (
    <Badge
      variant="outline"
      className={`w-fit justify-self-start whitespace-nowrap ${config.badge}`}
    >
      {config.label}
    </Badge>
  )
}

export const ProjectTaskManagerAvatar = ({
  name,
  fileId,
}: {
  name: string
  fileId?: number | null
}) => {
  const resolvedName = name || '미정'

  return (
    <div className="flex items-center gap-2">
      <ProfileAvatar fileId={fileId} name={resolvedName} size={28} />
      <span className="text-xs font-bold text-slate-700">{resolvedName}</span>
    </div>
  )
}
