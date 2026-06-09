import { CalendarDays, ClipboardList, UserRound } from 'lucide-react'
import Button from '../../../components/common/button/Button'
import Modal from '../../../components/common/overlay/modal/Modal'
import {
  ProjectTaskManagerAvatar,
  ProjectTaskPriorityIndicator,
  ProjectTaskScopeBadge,
  ProjectTaskStatusBadge,
  ProjectTaskTypeBadge,
} from './TaskBadges'
import { taskStatusConfig } from './task.config'
import type { ProjectTask } from './task.types'

interface ProjectTaskDetailModalProps {
  task: ProjectTask | null
  onClose: () => void
}

const ProjectTaskDetailModal = ({ task, onClose }: ProjectTaskDetailModalProps) => {
  if (!task) return null
  const status = taskStatusConfig[task.taskStatCd]

  return (
    <Modal
      open={Boolean(task)}
      title="업무 상세정보"
      description="TB_TASK 기준 업무 상세 정보를 확인합니다."
      size="md"
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ProjectTaskStatusBadge status={task.taskStatCd} />
            <ProjectTaskPriorityIndicator priority={task.taskPriorityCd} />
            <ProjectTaskTypeBadge typeCd={task.taskTypeCd} />
            <ProjectTaskScopeBadge scopeCd={task.taskScopeCd} />
          </div>
          <h3 className="text-lg font-bold leading-7 text-slate-950">{task.taskNm}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{task.taskCn}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <ClipboardList size={14} />
              업무 ID
            </div>
            <p className="text-sm font-bold text-slate-800">TASK-{task.taskId}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <CalendarDays size={14} />
              업무 기간
            </div>
            <p className="text-sm font-bold text-slate-800">
              {task.taskBgngDt} ~ {task.taskEndDt}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <UserRound size={14} />
              담당자
            </div>
            <ProjectTaskManagerAvatar name={task.taskMngrName} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-slate-700">프로젝트 연결</p>
            <p className="text-sm font-medium text-slate-600">
              {task.projId ? `프로젝트 ID ${task.projId}` : '개인 업무'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-slate-700">담당자 ID</p>
            <p className="text-sm font-medium text-slate-600">{task.taskMngrId}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">진척률</span>
            <span className="font-bold text-slate-800">{task.taskProgressRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${status.bar}`}
              style={{ width: `${task.taskProgressRate}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ProjectTaskDetailModal
