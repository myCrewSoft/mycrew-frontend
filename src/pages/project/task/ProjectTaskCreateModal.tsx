import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ApiError } from '../../../api/axiosInstance'
import { taskApi } from '../../../api/taskApi'
import Button from '../../../components/common/button/Button'
import FormField from '../../../components/common/form/formField/FormField'
import Select from '../../../components/common/form/select/Select'
import Textarea from '../../../components/common/form/textarea/Textarea'
import Modal from '../../../components/common/overlay/modal/Modal'
import { taskPriorityConfig, taskStatusConfig, taskTypeConfig } from './task.config'
import type { ProjectTaskCreateForm, ProjectTaskStatusCode } from './task.types'

interface ProjectTaskCreateModalProps {
  open: boolean
  projectId: string | number
  initialStatus: ProjectTaskStatusCode
  onClose: () => void
  onCreated: () => void
}

const createDefaultForm = (
  projectId: string | number,
  taskStatCd: ProjectTaskStatusCode,
): ProjectTaskCreateForm => ({
  projId: Number(projectId),
  taskNm: '',
  taskCn: '',
  taskTypeCd: '01',
  taskStatCd,
  taskMngrId: 0,
  taskPriorityCd: '02',
  taskImprtncCd: '02',
  taskBgngDt: '',
  taskEndDt: '',
  empIdList: [],
})

const ProjectTaskCreateModal = ({
  open,
  projectId,
  initialStatus,
  onClose,
  onCreated,
}: ProjectTaskCreateModalProps) => {
  const [form, setForm] = useState<ProjectTaskCreateForm>(() =>
    createDefaultForm(projectId, initialStatus),
  )
  const [taskNameError, setTaskNameError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(createDefaultForm(projectId, initialStatus))
    setTaskNameError('')
    setSubmitError('')
  }, [open, projectId, initialStatus])

  const handleCreate = async () => {
    const taskNm = form.taskNm.trim()

    if (!taskNm) {
      setTaskNameError('업무명을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      await taskApi.createProjectTask(projectId, {
        ...form,
        projId: Number(projectId),
        taskNm,
        taskCn: form.taskCn.trim(),
        empIdList: form.empIdList.filter((empId) => Number.isFinite(empId)),
      })
      onCreated()
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

  const handleParticipantIdsChange = (value: string) => {
    const empIdList = value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item))

    setForm((prev) => ({ ...prev, empIdList }))
  }

  return (
    <Modal
      open={open}
      title="업무 추가"
      description="프로젝트 업무를 TaskCreateRequest DTO 형식으로 등록합니다."
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
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
          <FormField
            label="담당자 사번"
            type="number"
            min={0}
            value={form.taskMngrId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, taskMngrId: Number(event.target.value) }))
            }
          />
        </div>

        <FormField
          label="참여자 사번 목록"
          placeholder="예: 1001,1002"
          value={form.empIdList.join(',')}
          onChange={(event) => handleParticipantIdsChange(event.target.value)}
        />

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

        {submitError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {submitError}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ProjectTaskCreateModal
