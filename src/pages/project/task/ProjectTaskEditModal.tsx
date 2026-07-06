import { useMemo, useState } from 'react'
import { CheckCircle2, Save, UserCheck, X } from 'lucide-react'
import { ApiError } from '../../../api/axiosInstance'
import { taskApi } from '../../../api/taskApi'
import Button from '../../../components/common/button/Button'
import EmployeeSearchPicker, {
  type EmployeeSearchItem,
} from '../../../components/common/employeeSearch/EmployeeSearchPicker'
import FormField from '../../../components/common/form/formField/FormField'
import Select from '../../../components/common/form/select/Select'
import Textarea from '../../../components/common/form/textarea/Textarea'
import type { TaskUpdateRequest } from '../../../types'
import { taskPriorityConfig, taskStatusConfig } from './task.config'
import type { ProjectTaskDetail } from './task.types'

interface ProjectTaskEditModalProps {
  projectId: string | number
  task: ProjectTaskDetail
  onClose: () => void
  onUpdated: () => void | Promise<void>
}

const toDateTimeLocal = (value: string) => value.slice(0, 16)
const getEmployeeIdKey = (id: string | number | null) => String(id ?? '')
const COMPLETED_TASK_STATUS = '02'
const clampProgress = (value: number) => Math.min(100, Math.max(0, value))

const ProjectTaskEditModal = ({ projectId, task, onClose, onUpdated }: ProjectTaskEditModalProps) => {
  const initialParticipants = useMemo<EmployeeSearchItem[]>(
    () => task.employeeList.map((employee) => ({
      id: employee.empId,
      name: employee.empNm,
      department: employee.deptNm,
      position: employee.jobPstnNm || employee.jobGrdNm,
      profileImageFileId: employee.prflImgFileId,
    })),
    [task.employeeList],
  )
  const [form, setForm] = useState<TaskUpdateRequest>({
    taskNm: task.taskNm,
    taskCn: task.taskCn ?? '',
    taskMngrId: task.taskMngrId,
    taskStatCd: task.taskStatCd,
    taskPriorityCd: task.taskPriorityCd,
    taskImprtncCd: task.taskImprtncCd,
    taskPrgrsSmry: task.taskPrgrsSmry,
    taskBgngDt: toDateTimeLocal(task.taskBgngDt),
    taskEndDt: toDateTimeLocal(task.taskEndDt),
    empIdList: task.employeeList.map((employee) => employee.empId),
  })
  const [selectedParticipantItems, setSelectedParticipantItems] = useState(initialParticipants)
  const [taskNameError, setTaskNameError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedManager = selectedParticipantItems.find(
    (employee) => getEmployeeIdKey(employee.id) === getEmployeeIdKey(form.taskMngrId),
  )

  const handleParticipantChange = (nextIds: Array<string | number>) => {
    const empIdList = nextIds.map(Number)
    setSubmitError('')
    setForm((current) => ({
      ...current,
      empIdList,
      taskMngrId: empIdList.includes(current.taskMngrId)
        ? current.taskMngrId
        : (empIdList[0] ?? 0),
    }))
  }

  const handleStatusChange = (taskStatCd: string) => {
    setForm((current) => ({
      ...current,
      taskStatCd,
      taskPrgrsSmry:
        taskStatCd === COMPLETED_TASK_STATUS ? 100 : current.taskPrgrsSmry,
    }))
  }

  const handleProgressChange = (value: number) => {
    const taskPrgrsSmry = clampProgress(value)

    setForm((current) => ({
      ...current,
      taskPrgrsSmry,
      taskStatCd:
        taskPrgrsSmry === 100 ? COMPLETED_TASK_STATUS : current.taskStatCd,
    }))
  }

  const handleUpdate = async () => {
    const taskNm = form.taskNm.trim()
    if (!taskNm) {
      setTaskNameError('업무명을 입력해주세요.')
      return
    }
    if (form.empIdList.length === 0) {
      setSubmitError('참여자를 1명 이상 선택해주세요.')
      return
    }
    if (!form.taskMngrId) {
      setSubmitError('참여자 중 업무 담당자를 지정해주세요.')
      return
    }
    if (form.taskBgngDt && form.taskEndDt && form.taskBgngDt > form.taskEndDt) {
      setSubmitError('종료 일시는 시작 일시보다 빠를 수 없습니다.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      await taskApi.updateProjectTask(projectId, task.taskId, {
        ...form,
        taskNm,
        taskCn: String(form.taskCn ?? '').trim(),
      })
      await onUpdated()
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : '업무 수정 중 오류가 발생했습니다.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-[70] flex h-full w-[500px] max-w-full flex-col bg-white shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">업무 수정</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              업무 정보와 담당자, 참여자를 변경합니다.
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5">
            <FormField
              label="업무명"
              required
              value={form.taskNm}
              errorText={taskNameError}
              onChange={(event) => {
                setForm((current) => ({ ...current, taskNm: event.target.value }))
                setTaskNameError('')
              }}
            />
            <Textarea label="업무 상세내용" rows={3} value={form.taskCn} onChange={(event) => setForm((current) => ({ ...current, taskCn: event.target.value }))} />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="상태"
                value={form.taskStatCd}
                options={Object.entries(taskStatusConfig).map(([value, config]) => ({ value, label: config.label }))}
                onChange={(event) => handleStatusChange(event.target.value)}
              />
              <Select
                label="우선순위"
                value={form.taskPriorityCd}
                options={Object.entries(taskPriorityConfig).map(([value, config]) => ({ value, label: config.label }))}
                onChange={(event) => setForm((current) => ({ ...current, taskPriorityCd: event.target.value, taskImprtncCd: event.target.value }))}
              />
            </div>

            <FormField
              label="진척률"
              type="number"
              min={0}
              max={100}
              value={form.taskPrgrsSmry}
              rightSlot={<span className="text-sm font-bold text-slate-400">%</span>}
              onChange={(event) => handleProgressChange(Number(event.target.value))}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="시작 일시" type="datetime-local" value={form.taskBgngDt} onChange={(event) => setForm((current) => ({ ...current, taskBgngDt: event.target.value }))} />
              <FormField label="종료 일시" type="datetime-local" value={form.taskEndDt} onChange={(event) => setForm((current) => ({ ...current, taskEndDt: event.target.value }))} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">참여자 및 담당자 <span className="text-red-500">*</span></label>
                <span className="text-xs font-bold text-slate-400">{form.empIdList.length}명 선택</span>
              </div>
              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600"><UserCheck size={14} /> 현재 담당자</div>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{selectedManager?.name ?? task.taskMngrNm}</p>
              </div>
              <EmployeeSearchPicker
                variant="detailed"
                remoteSearch
                showAllOnEmpty
                showDepartmentFilter
                fixedParams={{ projId: Number(projectId) }}
                selectedEmployeeIds={form.empIdList}
                selectedEmployeeItems={selectedParticipantItems}
                onChange={handleParticipantChange}
                onSelectedItemsChange={setSelectedParticipantItems}
                emptyText="참여자로 지정할 사원을 검색해주세요."
                renderSelectedEmployeeAction={(employee) => {
                  const selected = getEmployeeIdKey(employee.id) === getEmployeeIdKey(form.taskMngrId)
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, taskMngrId: Number(employee.id) }))
                        setSubmitError('')
                      }}
                      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition-colors ${selected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'}`}
                    >
                      {selected ? <CheckCircle2 size={13} /> : <UserCheck size={13} />}
                      {selected ? '담당자' : '지정'}
                    </button>
                  )
                }}
              />
            </div>

            {submitError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{submitError}</div>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="primary" leftIcon={<Save size={15} />} loading={submitting} onClick={handleUpdate}>저장하기</Button>
        </div>
      </aside>
    </>
  )
}

export default ProjectTaskEditModal
