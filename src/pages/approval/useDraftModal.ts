import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { approvalApi } from '../../api/approvalApi'
import { useToast } from '../../components/common/toast/useToast'
import type {
  ApprovalDocumentDetailResponse,
  ApprovalDraftRequestDTO,
} from '../../types/approval'
import { defaultDraftForm } from './approval.types'
import type { DraftFormState, SelectedApprover } from './approval.types'
import { getApiErrorMessage } from './approval.utils'

// LocalDateTime 문자열을 datetime-local input 값(yyyy-MM-ddTHH:mm)으로 변환
const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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
  // 수정 모드일 때 대상 기안문 일련번호. null 이면 신규 작성.
  const [editingDocSn, setEditingDocSn] = useState<number | null>(null)

  // 사이드바 "기안서 작성" 버튼 이벤트 수신 (항상 신규 작성 모드로 연다)
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

  // 임시저장 문서를 수정 모드로 모달에 불러온다.
  const openDraftForEdit = useCallback((detail: ApprovalDocumentDetailResponse) => {
    setEditingDocSn(detail.drftDocSn)
    setDraftForm({
      docTtl: detail.docTtl ?? '',
      tmplatCd: detail.tmplatCd ?? '',
      aprvlHopeDt: toDateTimeLocalValue(detail.aprvlHopeDt),
      aprvlFullCn: detail.aprvlFullCn ?? '',
    })
    // 결재선(단계별 1명 순차 결재)을 순서대로 결재자 목록으로 복원
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

  const handleGenerateAiDraft = useCallback(async () => {
    const prompt = aiPrompt.trim()
    if (!prompt) {
      setDraftError('AI에게 요청할 기안 내용을 입력하세요.')
      return
    }

    setAiGenerating(true)
    setDraftError('')
    try {
      const response = await approvalApi.createAiDraft({
        userPrompt: prompt,
        tmplatCd: draftForm.tmplatCd.trim() || undefined,
      })
      const result = response.data.data
      setDraftOpen(false)
      resetDraftState()
      showToast({
        title: 'AI 기안서 초안이 임시저장되었습니다.',
        description: result?.docTtl
          ? `${result.docTtl} 문서를 임시저장함에서 수정할 수 있습니다.`
          : undefined,
        variant: 'success',
      })
      if (onSuccess) await onSuccess()
      window.dispatchEvent(new Event('approval:refresh-counts'))
      navigate('/approval/sent/temporary')
    } catch (error) {
      setDraftError(getApiErrorMessage(error, 'AI 기안서 초안 생성에 실패했습니다.'))
    } finally {
      setAiGenerating(false)
    }
  }, [aiPrompt, draftForm.tmplatCd, navigate, onSuccess, resetDraftState, showToast])

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
      // 수정 모드면 대상 문서 일련번호를 함께 보내 기존 임시저장 문서를 갱신한다.
      drftDocSn: isEditing ? editingDocSn : undefined,
      docTtl: draftForm.docTtl.trim(),
      tmplatCd: draftForm.tmplatCd.trim() || undefined,
      aprvlHopeDt: draftForm.aprvlHopeDt
        ? new Date(draftForm.aprvlHopeDt).toISOString()
        : undefined,
      aprvlFullCn: draftForm.aprvlFullCn,
      // 결재자 1명 = 1단계 순차 결재 (병렬 결재 아님)
      approvalLines: draftApprovers.map((a, idx) => ({
        aprvlOrd: idx + 1,
        aprvlMthdCd: '01',
        aprvrEmpIds: [a.id],
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
      // 사이드바 카운트 갱신 신호
      window.dispatchEvent(new Event('approval:refresh-counts'))
      // 신규 작성 시에만 임시저장함으로 이동 (수정 시 현재 화면 유지)
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
    isEditingDraft: editingDocSn != null,
    setAiPrompt,
    handleGenerateAiDraft,
    openDraftForEdit,
    handleSaveDraft,
    closeDraft,
  }
}
