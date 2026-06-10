import { GripVertical, MoreHorizontal } from 'lucide-react'
import {
  ProjectTaskManagerAvatar,
  ProjectTaskPriorityIndicator,
  ProjectTaskStatusBadge,
  ProjectTaskTypeBadge,
} from './TaskBadges'
import type { ProjectTask } from './task.types'

interface ProjectTaskListProps {
  tasks: ProjectTask[]
  onOpenTask: (task: ProjectTask) => void
}

const ProjectTaskList = ({ tasks, onOpenTask }: ProjectTaskListProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[1.4fr_0.55fr_0.55fr_0.7fr_0.95fr_0.55fr_0.6fr_40px] items-center bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500">
          <span>업무명</span>
          <span>업무 유형</span>
          <span>상태</span>
          <span>담당자</span>
          <span>기간</span>
          <span>진척률</span>
          <span>우선순위</span>
          <span />
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div
              key={task.taskId}
              className="grid grid-cols-[1.4fr_0.55fr_0.55fr_0.7fr_0.95fr_0.55fr_0.6fr_40px] items-center px-5 py-3 text-sm transition-colors hover:bg-slate-50"
            >
              <button
                type="button"
                onClick={() => onOpenTask(task)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <GripVertical size={16} className="shrink-0 text-slate-300" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{task.taskNm}</p>
                  <p className="truncate text-xs font-medium text-slate-400">
                    {task.taskCn}
                  </p>
                </div>
              </button>
              <ProjectTaskTypeBadge typeCd={task.taskTypeCd} />
              <ProjectTaskStatusBadge status={task.taskStatCd} />
              <ProjectTaskManagerAvatar name={task.taskMngrNm} />
              <span className="text-xs font-medium text-slate-600">
                {task.taskBgngDt} ~ {task.taskEndDt}
              </span>
              <div className="pr-4">
                <div className="mb-1 flex justify-end text-xs font-bold text-slate-600">
                  {task.taskPrgrsSmry}%
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${task.taskPrgrsSmry}%` }}
                  />
                </div>
              </div>
              <ProjectTaskPriorityIndicator priority={task.taskPriorityCd} />
              <button
                type="button"
                onClick={() => onOpenTask(task)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="업무 상세 보기"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProjectTaskList
