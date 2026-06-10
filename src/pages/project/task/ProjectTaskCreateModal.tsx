import { useMemo, useState } from 'react'
import { CheckCircle2, Plus, UserCheck, X } from 'lucide-react'
import { ApiError } from '../../../api/axiosInstance'
import { taskApi } from '../../../api/taskApi'
import Button from '../../../components/common/button/Button'
import EmployeeSearchPicker, {
  type EmployeeSearchItem,
} from '../../../components/common/employeeSearch/EmployeeSearchPicker'
import FormField from '../../../components/common/form/formField/FormField'
import Select from '../../../components/common/form/select/Select'
import Textarea from '../../../components/common/form/textarea/Textarea'
import { taskPriorityConfig, taskStatusConfig, taskTypeConfig } from './task.config'
import type { ProjectTaskStatusCode, TaskCreateForm } from './task.types'

interface ProjectTaskCreateModalProps {
  open: boolean
  initialStatus: ProjectTaskStatusCode
  projId: number
  onClose: () => void
  onCreated: () => void
}

const createDefaultForm = (
  projId: number,
  taskStatCd: ProjectTaskStatusCode,
): Omit<TaskCreateForm, 'empIdList'> => ({
  projId,
  taskTypeCd: '01',
  taskMngrId: 0,
  taskStatCd,
  taskPriorityCd: '02',
  taskImprtncCd: '02',
  taskNm: '',
  taskCn: '',
  taskBgngDt: '',
  taskEndDt: '',
})

const getEmployeeIdKey = (id: string | number | null) => String(id ?? '')

const ProjectTaskCreateModal = ({
  open,
  initialStatus,
  projId,
  onClose,
  onCreated,
}: ProjectTaskCreateModalProps) => {
  const [form, setForm] = useState<Omit<TaskCreateForm, 'empIdList'>>(() =>
    createDefaultForm(projId, initialStatus),
  )
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Array<string | number>>([])
  const [selectedParticipantItems, setSelectedParticipantItems] = useState<EmployeeSearchItem[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string | number | null>(null)
  const [taskNameError, setTaskNameError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedManager = useMemo(
    () =>
      selectedParticipantItems.find(
        (employee) => getEmployeeIdKey(employee.id) === getEmployeeIdKey(selectedManagerId),
      ),
    [selectedManagerId, selectedParticipantItems],
  )

  const resetForm = () => {
    setSelectedParticipantIds([])
    setSelectedParticipantItems([])
    setSelectedManagerId(null)
    setTaskNameError('')
    setSubmitError('')
    setForm(createDefaultForm(projId, initialStatus))
  }

  const handleParticipantChange = (nextIds: Array<string | number>) => {
    setSelectedParticipantIds(nextIds)
    setSubmitError('')

    setSelectedManagerId((currentManagerId) => {
      const currentManagerStillSelected = nextIds.some(
        (id) => getEmployeeIdKey(id) === getEmployeeIdKey(currentManagerId),
      )

      return currentManagerStillSelected ? currentManagerId : nextIds[0] ?? null
    })
  }

  const handleCreate = async () => {
    const taskNm = form.taskNm.trim()
    if (!taskNm) {
      setTaskNameError('업무명을 입력해주세요.')
      return
    }

    if (selectedParticipantIds.length === 0) {
      setSubmitError('참가자를 1명 이상 선택해주세요.')
      return
    }

    if (selectedManagerId === null) {
      setSubmitError('참가자 중 업무 담당자를 지정해주세요.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      await taskApi.createProjectTask(projId, {
        ...form,
        projId,
        taskNm,
        taskCn: form.taskCn.trim(),
        taskMngrId: Number(selectedManagerId),
        empIdList: selectedParticipantIds.map(Number),
      })
      onCreated()
      resetForm()
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : '업무 등록 중 오류가 발생했습니다.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={handleClose}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[500px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">업무 추가</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              참가자를 선택하고 담당자를 바로 지정합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5">
            <FormField
              label="업무명"
              required
              placeholder="예: 결제 승인 API 예외 처리 구현"
              value={form.taskNm}
              errorText={taskNameError}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, taskNm: event.target.value }))
                setTaskNameError('')
              }}
            />

            <Textarea
              label="업무 상세내용"
              placeholder="업무 목적이나 처리해야 할 내용을 입력해주세요."
              rows={3}
              value={form.taskCn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, taskCn: event.target.value }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="업무 유형"
                value={form.taskTypeCd}
                options={Object.entries(taskTypeConfig).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, taskTypeCd: event.target.value }))
                }
              />
              <Select
                label="상태"
                value={form.taskStatCd}
                options={Object.entries(taskStatusConfig).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, taskStatCd: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="우선순위"
                value={form.taskPriorityCd}
                options={Object.entries(taskPriorityConfig).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    taskPriorityCd: event.target.value,
                    taskImprtncCd: event.target.value,
                  }))
                }
              />
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                  <UserCheck size={14} />
                  현재 담당자
                </div>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">
                  {selectedManager ? selectedManager.name : '참가자를 선택하면 자동 지정됩니다.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="시작 일시"
                type="datetime-local"
                value={form.taskBgngDt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, taskBgngDt: event.target.value }))
                }
              />
              <FormField
                label="종료 일시"
                type="datetime-local"
                value={form.taskEndDt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, taskEndDt: event.target.value }))
                }
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  참가자 및 담당자 <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-slate-400">
                  {selectedParticipantIds.length}명 선택
                </span>
              </div>
              <EmployeeSearchPicker
                variant="detailed"
                remoteSearch
                showAllOnEmpty
                showDepartmentFilter
                fixedParams={{ projId }}
                selectedEmployeeIds={selectedParticipantIds}
                selectedEmployeeItems={selectedParticipantItems}
                onChange={handleParticipantChange}
                onSelectedItemsChange={setSelectedParticipantItems}
                emptyText="참가자로 지정할 사원을 검색해주세요."
                renderSelectedEmployeeAction={(employee) => {
                  const selected =
                    getEmployeeIdKey(employee.id) === getEmployeeIdKey(selectedManagerId)

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedManagerId(employee.id)
                        setSubmitError('')
                      }}
                      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition-colors ${
                        selected
                          ? 'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                      }`}
                    >
                      {selected ? <CheckCircle2 size={13} /> : <UserCheck size={13} />}
                      {selected ? '담당자' : '지정'}
                    </button>
                  )
                }}
              />
            </div>

            {submitError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {submitError}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={15} />}
            loading={submitting}
            onClick={handleCreate}
          >
            등록하기
          </Button>
        </div>
      </aside>
    </>
  )
}

export default ProjectTaskCreateModal