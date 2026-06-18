import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { approvalApi } from '../../api/approvalApi'
import { useToast } from '../../components/common/toast/useToast'
import type {
  ApprovalAiApprovalLineJobResponseDTO,
  ApprovalAiApproverCandidateDTO,
  ApprovalAiContentJobResponseDTO,
  ApprovalDocumentDetailResponse,
  ApprovalDraftRequestDTO,
} from '../../types/approval'
import { defaultDraftForm } from './approval.types'
import type { DraftFormState, SelectedApprover } from './approval.types'
import { getApiErrorMessage } from './approval.utils'

const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const AI_DRAFT_JOB_POLL_INTERVAL_MS = 2_000
const AI_DRAFT_JOB_TIMEOUT_MS = 10 * 60 * 1_000

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const pollAiDraftContentJob = async (
  jobId: number,
): Promise<ApprovalAiContentJobResponseDTO> => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < AI_DRAFT_JOB_TIMEOUT_MS) {
    await delay(AI_DRAFT_JOB_POLL_INTERVAL_MS)
    const response = await approvalApi.getAiDraftContentJob(jobId)
    const job = response.data.data

    if (!job) {
      throw new Error('AI 기안서 본문 생성 작업 상태를 확인할 수 없습니다.')
    }
    if (job.status === 'SUCCEEDED') {
      return job
    }
    if (job.status === 'FAILED') {
      throw new Error(job.errorMessage || 'AI 기안서 본문 생성에 실패했습니다.')
    }
  }

  throw new Error('AI 기안서 본문 생성 시간이 초과되었습니다.')
}

const pollAiApprovalLineJob = async (
  jobId: number,
): Promise<ApprovalAiApprovalLineJobResponseDTO> => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < AI_DRAFT_JOB_TIMEOUT_MS) {
    await delay(AI_DRAFT_JOB_POLL_INTERVAL_MS)
    const response = await approvalApi.getAiApprovalLineJob(jobId)
    const job = response.data.data

    if (!job) {
      throw new Error('AI 결재선 자동 지정 작업 상태를 확인할 수 없습니다.')
    }
    if (job.status === 'SUCCEEDED') {
      return job
    }
    if (job.status === 'FAILED') {
      throw new Error(job.errorMessage || 'AI 결재선 자동 지정에 실패했습니다.')
    }
  }

  throw new Error('AI 결재선 자동 지정 시간이 초과되었습니다.')
}

const hasApprovalLineContext = (form: DraftFormState, aiPrompt: string) =>
  Boolean(
    aiPrompt.trim() ||
    form.docTtl.trim() ||
    form.tmplatCd.trim() ||
    form.aprvlFullCn.trim(),
  )

const toSelectedApprover = (
  approver: ApprovalAiApproverCandidateDTO,
): SelectedApprover => ({
  id: approver.empId,
  name: approver.empNm,
  department: approver.deptNm ?? '',
  position: approver.jobPstnNm ?? approver.jobGrdNm ?? '',
  prflImgFileId: approver.prflImgFileId ?? null,
})

export function useDraftModal(onSuccess?: () => void | Promise<void>) {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [draftOpen, setDraftOpen] = useState(false)
  const [draftForm, setDraftForm] = useState<DraftFormState>(defaultDraftForm)
  const [draftApprovers, setDraftApprovers] = useState<SelectedApprover[]>([])
  const [draftError, setDraftError] = useState('')
  const [draftSaving, setDraftSaving] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiApprovalLineGenerating, setAiApprovalLineGenerating] = useState(false)
  const [editingDocSn, setEditingDocSn] = useState<number | null>(null)

  useEffect(() => {
    const openDraft = () => {
      setEditingDocSn(null)
      setDraftForm(defaultDraftForm)
      setDraftApprovers([])
      setDraftError('')
      setAiPrompt('')
      setDraftOpen(true)
    }
    window.addEventListener('approval:open-draft', openDraft)
    return () => window.removeEventListener('approval:open-draft', openDraft)
  }, [])

  const openDraftForEdit = useCallback((detail: ApprovalDocumentDetailResponse) => {
    setEditingDocSn(detail.drftDocSn)
    setDraftForm({
      docTtl: detail.docTtl ?? '',
      tmplatCd: detail.tmplatCd ?? '',
      aprvlHopeDt: toDateTimeLocalValue(detail.aprvlHopeDt),
      aprvlFullCn: detail.aprvlFullCn ?? '',
    })
    const approvers: SelectedApprover[] = [...(detail.approvalSteps ?? [])]
      .sort((a, b) => a.aprvlOrd - b.aprvlOrd)
      .map((step) => ({
        id: step.aprvrEmpId,
        name: step.aprvrEmpNm,
        department: step.aprvrDeptNm ?? '',
        position: step.aprvrJobPstnNm ?? '',
        prflImgFileId: step.aprvrPrflImgFileId ?? null,
      }))
    setDraftApprovers(approvers)
    setDraftError('')
    setAiPrompt('')
    setDraftOpen(true)
  }, [])

  const resetDraftState = useCallback(() => {
    setDraftForm(defaultDraftForm)
    setDraftApprovers([])
    setEditingDocSn(null)
    setAiPrompt('')
  }, [])

  const handleGenerateAiDraftContent = useCallback(async () => {
    const prompt = aiPrompt.trim()
    if (!prompt) {
      setDraftError('AI에게 요청할 기안 내용을 입력하세요.')
      return
    }

    setAiGenerating(true)
    setDraftError('')
    try {
      if (editingDocSn == null) {
        const response = await approvalApi.createAiDraftContentSaveJob({
          userPrompt: prompt,
          tmplatCd: draftForm.tmplatCd.trim() || undefined,
        })
        const startedJob = response.data.data
        if (!startedJob?.jobId) {
          throw new Error('AI 기안서 양식 임시저장 작업을 시작하지 못했습니다.')
        }

        setDraftOpen(false)
        resetDraftState()
        showToast({
          title: 'AI 양식 생성 요청을 접수했습니다.',
          description: '완료되면 알림으로 안내됩니다. 임시저장함에서 확인하세요.',
          variant: 'success',
        })
        return
      }

      const response = await approvalApi.createAiDraftContentJob({
        userPrompt: prompt,
        tmplatCd: draftForm.tmplatCd.trim() || undefined,
      })
      const startedJob = response.data.data
      if (!startedJob?.jobId) {
        throw new Error('AI 기안서 본문 생성 작업을 시작하지 못했습니다.')
      }
      const result =
        startedJob.status === 'SUCCEEDED'
          ? startedJob
          : await pollAiDraftContentJob(startedJob.jobId)

      setDraftForm((current) => ({
        ...current,
        docTtl: result.docTtl ?? current.docTtl,
        tmplatCd: result.tmplatCd ?? current.tmplatCd,
        aprvlFullCn: result.aprvlFullCn ?? current.aprvlFullCn,
      }))
      showToast({
        title: 'AI 양식 생성이 완료되었습니다.',
        description: '내용을 확인한 뒤 결재선을 지정하거나 직접 수정할 수 있습니다.',
        variant: 'success',
      })
    } catch (error) {
      setDraftError(getApiErrorMessage(error, 'AI 기안서 본문 생성에 실패했습니다.'))
    } finally {
      setAiGenerating(false)
    }
  }, [aiPrompt, draftForm.tmplatCd, editingDocSn, resetDraftState, showToast])

  const handleGenerateAiApprovalLine = useCallback(async () => {
    if (!hasApprovalLineContext(draftForm, aiPrompt)) {
      setDraftError('결재선 자동 지정을 위해 기안 내용이나 제목을 입력하세요.')
      return
    }

    setAiApprovalLineGenerating(true)
    setDraftError('')
    try {
      const response = await approvalApi.createAiApprovalLineJob({
        userPrompt: aiPrompt.trim() || undefined,
        docTtl: draftForm.docTtl.trim() || undefined,
        tmplatCd: draftForm.tmplatCd.trim() || undefined,
        aprvlFullCn: draftForm.aprvlFullCn.trim() ? draftForm.aprvlFullCn : undefined,
      })
      const startedJob = response.data.data
      if (!startedJob?.jobId) {
        throw new Error('AI 결재선 자동 지정 작업을 시작하지 못했습니다.')
      }
      const result =
        startedJob.status === 'SUCCEEDED'
          ? startedJob
          : await pollAiApprovalLineJob(startedJob.jobId)
      const approvers = (result.approvers ?? []).map(toSelectedApprover)
      if (approvers.length === 0) {
        throw new Error('AI가 유효한 결재자를 추천하지 못했습니다.')
      }

      setDraftApprovers(approvers)
      showToast({
        title: 'AI 결재선이 지정되었습니다.',
        description: '추천된 결재자를 확인하고 필요하면 수정하세요.',
        variant: 'success',
      })
    } catch (error) {
      setDraftError(getApiErrorMessage(error, 'AI 결재선 자동 지정에 실패했습니다.'))
    } finally {
      setAiApprovalLineGenerating(false)
    }
  }, [aiPrompt, draftForm, showToast])

  const handleSaveDraft = useCallback(async () => {
    if (!draftForm.docTtl.trim()) {
      setDraftError('기안서 제목을 입력하세요.')
      return
    }
    if (!draftForm.aprvlFullCn.trim()) {
      setDraftError('결재 내용을 입력하세요.')
      return
    }
    if (draftApprovers.length === 0) {
      setDraftError('결재자를 한 명 이상 선택하세요.')
      return
    }

    setDraftSaving(true)
    setDraftError('')
    const isEditing = editingDocSn != null
    const request: ApprovalDraftRequestDTO = {
      drftDocSn: isEditing ? editingDocSn : undefined,
      docTtl: draftForm.docTtl.trim(),
      tmplatCd: draftForm.tmplatCd.trim() || undefined,
      aprvlHopeDt: draftForm.aprvlHopeDt
        ? new Date(draftForm.aprvlHopeDt).toISOString()
        : undefined,
      aprvlFullCn: draftForm.aprvlFullCn,
      approvalLines: draftApprovers.map((approver, idx) => ({
        aprvlOrd: idx + 1,
        aprvlMthdCd: '01',
        aprvrEmpIds: [approver.id],
      })),
    }

    try {
      await approvalApi.saveTemporaryDraft(request)
      setDraftOpen(false)
      resetDraftState()
      showToast({
        title: isEditing ? '기안서를 수정했습니다.' : '기안서를 임시저장했습니다.',
        variant: 'success',
      })
      if (onSuccess) await onSuccess()
      window.dispatchEvent(new Event('approval:refresh-counts'))
      if (!isEditing) navigate('/approval/sent/temporary')
    } catch (error) {
      setDraftError(
        getApiErrorMessage(
          error,
          isEditing ? '기안서 수정에 실패했습니다.' : '기안서 임시저장에 실패했습니다.',
        ),
      )
    } finally {
      setDraftSaving(false)
    }
  }, [draftForm, draftApprovers, editingDocSn, showToast, navigate, onSuccess, resetDraftState])

  const closeDraft = useCallback(() => {
    setDraftOpen(false)
    setDraftError('')
    setEditingDocSn(null)
    setAiPrompt('')
  }, [])

  return {
    draftOpen,
    setDraftOpen,
    draftForm,
    setDraftForm,
    draftApprovers,
    setDraftApprovers,
    draftError,
    draftSaving,
    aiPrompt,
    aiGenerating,
    aiContentGenerating: aiGenerating,
    aiApprovalLineGenerating,
    canGenerateAiApprovalLine: hasApprovalLineContext(draftForm, aiPrompt),
    isEditingDraft: editingDocSn != null,
    setAiPrompt,
    handleGenerateAiDraft: handleGenerateAiDraftContent,
    handleGenerateAiDraftContent,
    handleGenerateAiApprovalLine,
    openDraftForEdit,
    handleSaveDraft,
    closeDraft,
  }
}
