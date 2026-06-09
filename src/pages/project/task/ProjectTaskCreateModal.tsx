import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { employeeApi } from '../../../api/employeeApi'
import Button from '../../../components/common/button/Button'
import EmployeeSearchPicker, {
  type EmployeeSearchItem,
} from '../../../components/common/employeeSearch/EmployeeSearchPicker'
import FormField from '../../../components/common/form/formField/FormField'
import Select from '../../../components/common/form/select/Select'
import Textarea from '../../../components/common/form/textarea/Textarea'
import Modal from '../../../components/common/overlay/modal/Modal'
import { useApiList } from '../../../hooks/useApi'
import {
  taskPriorityConfig,
  taskScopeConfig,
  taskStatusConfig,
  taskTypeConfig,
} from './task.config'
import type {
  ProjectTask,
  ProjectTaskPriorityCode,
  ProjectTaskScopeCode,
  ProjectTaskStatusCode,
  ProjectTaskTypeCode,
} from './task.types'

type TaskCreateForm = Omit<ProjectTask, 'taskId'>

interface ProjectTaskCreateModalProps {
  open: boolean
  initialStatus: ProjectTaskStatusCode
  onClose: () => void
  onCreate: (task: TaskCreateForm) => void
}

const defaultForm: TaskCreateForm = {
  projId: 1,
  taskTypeCd: '01',
  taskScopeCd: '01',
  taskMngrId: 1000,
  taskMngrName: '',
  taskStatCd: '00',
  taskPriorityCd: '02',
  taskNm: '',
  taskCn: '',
  taskBgngDt: '',
  taskEndDt: '',
  taskProgressRate: 0,
}

const ProjectTaskCreateModal = ({
  open,
  initialStatus,
  onClose,
  onCreate,
}: ProjectTaskCreateModalProps) => {
  const [form, setForm] = useState<TaskCreateForm>(defaultForm)
  const [selectedManagerIds, setSelectedManagerIds] = useState<Array<string | number>>([])
  const [taskNameError, setTaskNameError] = useState('')

  const { data: employeeData, execute: fetchEmployees } = useApiList(
    employeeApi.lookupEmployees,
    { immediate: false },
  )
  const employees: EmployeeSearchItem[] = employeeData ?? []
  const departments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))]

  useEffect(() => {
    if (!open) return

    setForm({ ...defaultForm, taskStatCd: initialStatus })
    setSelectedManagerIds([])
    setTaskNameError('')
    void fetchEmployees({})
  }, [fetchEmployees, initialStatus, open])

  const handleManagerChange = (nextEmployeeIds: Array<string | number>) => {
    setSelectedManagerIds(nextEmployeeIds.slice(-1))
  }

  const handleCreate = () => {
    const taskNm = form.taskNm.trim()

    if (!taskNm) {
      setTaskNameError('업무명을 입력해주세요.')
      return
    }

    const selectedManagerId = selectedManagerIds[0]
    const selectedManager = employees.find(
      (employee) => String(employee.id) === String(selectedManagerId),
    )

    onCreate({
      ...form,
      projId: form.taskScopeCd === '01' ? 1 : null,
      taskMngrId: selectedManager ? Number(selectedManager.id) : 0,
      taskMngrName: selectedManager?.name ?? '담당자 미지정',
      taskNm,
      taskCn: form.taskCn.trim() || '업무 상세내용이 없습니다.',
      taskBgngDt: form.taskBgngDt || '미정',
      taskEndDt: form.taskEndDt || '미정',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      title="업무 추가"
      description="TB_TASK 기준으로 프로젝트 업무를 등록합니다."
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" leftIcon={<Plus size={15} />} onClick={handleCreate}>
            등록하기
          </Button>
        </>
      }
    >
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
          placeholder="업무 목적이나 처리해야 할 내용을 간단히 적어주세요."
          rows={3}
          value={form.taskCn}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, taskCn: event.target.value }))
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="업무 타입"
            value={form.taskTypeCd}
            options={Object.entries(taskTypeConfig).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                taskTypeCd: event.target.value as ProjectTaskTypeCode,
              }))
            }
          />
          <Select
            label="업무 구분"
            value={form.taskScopeCd}
            options={Object.entries(taskScopeConfig).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                taskScopeCd: event.target.value as ProjectTaskScopeCode,
              }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="상태"
            value={form.taskStatCd}
            options={Object.entries(taskStatusConfig).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                taskStatCd: event.target.value as ProjectTaskStatusCode,
              }))
            }
          />
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
                taskPriorityCd: event.target.value as ProjectTaskPriorityCode,
              }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="시작 일시"
            type="date"
            value={form.taskBgngDt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, taskBgngDt: event.target.value }))
            }
          />
          <FormField
            label="종료 일시"
            type="date"
            value={form.taskEndDt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, taskEndDt: event.target.value }))
            }
          />
        </div>

        <FormField
          label="진척률"
          type="number"
          min={0}
          max={100}
          value={form.taskProgressRate}
          rightSlot={<span className="text-xs font-bold text-slate-400">%</span>}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              taskProgressRate: Math.min(100, Math.max(0, Number(event.target.value))),
            }))
          }
        />

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            업무 담당자
          </label>
          <EmployeeSearchPicker
            variant="detailed"
            employees={employees}
            departments={departments}
            selectedEmployeeIds={selectedManagerIds}
            onChange={handleManagerChange}
            emptyText="담당자로 지정할 사원을 검색해주세요."
          />
        </div>
      </div>
    </Modal>
  )
}

export default ProjectTaskCreateModal
