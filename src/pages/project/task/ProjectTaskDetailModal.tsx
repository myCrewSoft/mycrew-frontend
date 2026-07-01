import { useEffect } from 'react'
import {
  BriefcaseBusiness,
  CalendarDays,
  Pencil,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { taskApi } from '../../../api/taskApi'
import Button from '../../../components/common/button/Button'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import Modal from '../../../components/common/overlay/modal/Modal'
import {
  ProjectTaskPriorityIndicator,
  ProjectTaskStatusBadge,
  ProjectTaskTypeBadge,
} from './TaskBadges'
import { getTaskStatusConfig } from './task.config'
import type { ProjectTask, ProjectTaskDetail } from './task.types'
import { formatDateTime } from '../../../utils/date'
import { useApi } from '../../../hooks/useApi'

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
  const {
    data: detail,
    loading,
    error,
    execute: fetchTaskDetail,
  } = useApi(taskApi.getProjectTaskDetail, { immediate: false })
  const taskId = task?.taskId

  useEffect(() => {
    if (taskId === undefined) return
    void fetchTaskDetail(projectId, taskId).catch(() => undefined)
  }, [fetchTaskDetail, projectId, taskId])

  if (!task) return null

  const resolvedDetail = detail?.taskId === task.taskId ? detail : null
  const visibleTask = resolvedDetail ?? task
  const status = getTaskStatusConfig(visibleTask.taskStatCd)
  const employeeList = Array.isArray(resolvedDetail?.employeeList)
    ? resolvedDetail.employeeList
    : []
  const managerPosition =
    resolvedDetail?.jobPstnNm || resolvedDetail?.jobGrdNm || '직급 정보 없음'
  const managerDepartment = resolvedDetail?.deptNm || '부서 정보 없음'
  const progress = Math.min(Math.max(visibleTask.taskPrgrsSmry, 0), 100)

  return (
    <Modal
      open={Boolean(task)}
      title="업무 상세"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="primary"
            leftIcon={<Pencil size={15} />}
            disabled={loading || !resolvedDetail}
            onClick={() => resolvedDetail && onEdit(resolvedDetail)}
          >
            수정
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {loading && (
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            상세 정보를 불러오는 중입니다.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error.message || '업무 상세 조회 중 오류가 발생했습니다.'}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ProjectTaskStatusBadge status={visibleTask.taskStatCd} />
            <ProjectTaskPriorityIndicator priority={visibleTask.taskPriorityCd} />
            <ProjectTaskTypeBadge typeCd={visibleTask.taskTypeCd} />
          </div>
          <h3 className="text-xl font-black leading-8 tracking-tight text-slate-950">
            {visibleTask.taskNm}
          </h3>
          {visibleTask.taskCn && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {visibleTask.taskCn}
            </p>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CalendarDays size={16} />
              </span>
              업무 기간
            </div>
            <div className="space-y-1 text-sm font-bold text-slate-800">
              <p>{formatDateTime(visibleTask.taskBgngDt)}</p>
              <p className="text-slate-400">~ {formatDateTime(visibleTask.taskEndDt)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <UserRound size={16} />
              </span>
              업무 담당자
            </div>
            <div className="flex items-center gap-3">
              <ProfileAvatar
                fileId={visibleTask.prflImgFileId}
                name={visibleTask.taskMngrNm}
                size={44}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {visibleTask.taskMngrNm}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {managerDepartment} · {managerPosition}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <UsersRound size={16} />
              </span>
              <div>
                <h4 className="text-sm font-black text-slate-900">참여자</h4>
                <p className="text-xs text-slate-500">업무를 함께 수행하는 구성원입니다.</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {employeeList.length}명
            </span>
          </div>

          {employeeList.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {employeeList.map((employee) => (
                <div
                  key={employee.empId}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                >
                  <ProfileAvatar
                    fileId={employee.prflImgFileId}
                    name={employee.empNm}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black text-slate-900">
                        {employee.empNm}
                      </p>
                      {employee.empId === visibleTask.taskMngrId && (
                        <span className="shrink-0 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                          담당자
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {employee.deptNm || '부서 정보 없음'} ·{' '}
                      {employee.jobPstnNm || employee.jobGrdNm || '직급 정보 없음'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              등록된 참여자가 없습니다.
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-slate-900 p-5 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness size={16} className="text-blue-300" />
              <span className="text-sm font-bold text-slate-200">업무 진척률</span>
            </div>
            <span className="text-xl font-black">{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full ${status.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>
      </div>
    </Modal>
  )
}

export default ProjectTaskDetailModal
