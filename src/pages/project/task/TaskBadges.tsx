import {
  BarChart3,
  BriefcaseBusiness,
  CircleCheckBig,
  CircleDashed,
  CirclePause,
  CirclePlay,
  FileText,
  FlaskConical,
  Trash2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import {
  getTaskPriorityConfig,
  getTaskStatusConfig,
  getTaskTypeConfig,
} from './task.config'

const statusIconMap: Record<string, LucideIcon> = {
  '00': CircleDashed,
  '01': CirclePlay,
  '02': CircleCheckBig,
  '03': CirclePause,
  '04': Trash2,
}

const typeIconMap: Record<string, LucideIcon> = {
  '01': BriefcaseBusiness,
  '02': FlaskConical,
  '03': FileText,
  '04': UsersRound,
  '05': BarChart3,
}

export const ProjectTaskStatusBadge = ({ status }: { status: string }) => {
  const config = getTaskStatusConfig(status)
  const StatusIcon = statusIconMap[status] ?? CircleDashed

  return (
    <Badge
      variant="outline"
      size="md"
      shape="rounded"
      leftIcon={<StatusIcon size={11} strokeWidth={2.4} aria-hidden="true" />}
      iconClassName={`h-4 w-4 rounded-md ${config.icon}`}
      className={`w-fit justify-self-start whitespace-nowrap pr-2.5 text-[11px] tracking-[-0.01em] ${config.badge}`}
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
      leftIcon={<span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
      className={`w-fit justify-self-start whitespace-nowrap ${config.badge}`}
    >
      {config.label}
    </Badge>
  )
}

export const ProjectTaskTypeBadge = ({ typeCd }: { typeCd: string }) => {
  const config = getTaskTypeConfig(typeCd)
  const TypeIcon = typeIconMap[typeCd] ?? BriefcaseBusiness

  return (
    <Badge
      variant="outline"
      size="md"
      shape="rounded"
      leftIcon={<TypeIcon size={11} strokeWidth={2.2} aria-hidden="true" />}
      iconClassName={`h-4 w-4 rounded-md ${config.icon}`}
      className={`w-fit justify-self-start whitespace-nowrap pr-2.5 text-[11px] tracking-[-0.01em] ${config.badge}`}
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
