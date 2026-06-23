import { useEffect, useState } from 'react'
import { CalendarDays, ClipboardList, Pencil, UserRound } from 'lucide-react'
import { ApiError } from '../../../api/axiosInstance'
import { taskApi } from '../../../api/taskApi'
import Button from '../../../components/common/button/Button'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import Modal from '../../../components/common/overlay/modal/Modal'
import {
  ProjectTaskManagerAvatar,
  ProjectTaskPriorityIndicator,
  ProjectTaskStatusBadge,
  ProjectTaskTypeBadge,
} from './TaskBadges'
import { getTaskStatusConfig } from './task.config'
import type { ProjectTask, ProjectTaskDetail } from './task.types'

interface ProjectTaskDetailModalProps {
  projectId: string | number
  task: ProjectTask | null
  onClose: () => void
  onEdit: (task: ProjectTaskDetail) => void
}

const ProjectTaskDetailModal = ({
  projectId,
  task,
  onClose,
  onEdit,
}: ProjectTaskDetailModalProps) => {
  const [detail, setDetail] = useState<ProjectTaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!task) {
      setDetail(null)
      setErrorMessage('')
      return
    }

    let mounted = true
    setLoading(true)
    setErrorMessage('')

    taskApi
      .getProjectTaskDetail(projectId, task.taskId)
      .then((response) => {
        if (mounted) {
          setDetail(response.data.data ?? null)
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : '업무 상세 조회 중 오류가 발생했습니다.',
          )
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [projectId, task])

  if (!task) return null

  const visibleTask = detail ?? task
  const status = getTaskStatusConfig(visibleTask.taskStatCd)
  const employeeList = (
    Array.isArray(detail?.employeeList) ? detail.employeeList : []
  ) as Array<{ empId: number; empNm: string }>

  return (
    <Modal
      open={Boolean(task)}
      title="업무 상세정보"
      description="백엔드 TaskDetailResponse DTO를 조회해 표시합니다."
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="primary"
            leftIcon={<Pencil size={15} />}
            disabled={loading || !detail}
            onClick={() => detail && onEdit(detail)}
          >
            수정
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {loading && (
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            상세 정보를 불러오는 중입니다.
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ProjectTaskStatusBadge status={visibleTask.taskStatCd} />
            <ProjectTaskPriorityIndicator priority={visibleTask.taskPriorityCd} />
            <ProjectTaskTypeBadge typeCd={visibleTask.taskTypeCd} />
          </div>
          <h3 className="text-lg font-bold leading-7 text-slate-950">{visibleTask.taskNm}</h3>
          {visibleTask.taskCn && (
            <p className="mt-2 text-sm leading-6 text-slate-600">{visibleTask.taskCn}</p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <ClipboardList size={14} />
              업무 ID
            </div>
            <p className="text-sm font-bold text-slate-800">TASK-{visibleTask.taskId}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <CalendarDays size={14} />
              업무 기간
            </div>
            <p className="text-sm font-bold text-slate-800">
              {visibleTask.taskBgngDt} ~ {visibleTask.taskEndDt}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">
              <UserRound size={14} />
              담당자
            </div>
            <ProjectTaskManagerAvatar
              name={visibleTask.taskMngrNm}
              fileId={visibleTask.prflImgFileId}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-slate-700">프로젝트 ID</p>
            <p className="text-sm font-medium text-slate-600">{visibleTask.projId}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-slate-700">담당자 ID</p>
            <p className="text-sm font-medium text-slate-600">{visibleTask.taskMngrId}</p>
          </div>
        </div>

        {employeeList.length > 0 && (
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">참여자</p>
            <div className="flex flex-wrap gap-2">
              {employeeList.map((employee) => (
                <span
                  key={employee.empId}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs font-bold text-slate-600"
                >
                  <ProfileAvatar
                    fileId={employee.prflImgFileId}
                    name={employee.empNm}
                    size={24}
                  />
                  {employee.empNm}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">진척률</span>
            <span className="font-bold text-slate-800">{visibleTask.taskPrgrsSmry}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${status.bar}`}
              style={{ width: `${visibleTask.taskPrgrsSmry}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ProjectTaskDetailModal
