import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { approvalApi } from '../../api/approvalApi'
import { useToast } from '../../components/common/toast/useToast'
import type { ApprovalDraftRequestDTO } from '../../types/approval'
import { defaultDraftForm } from './approval.types'
import type { DraftFormState, SelectedApprover } from './approval.types'
import { getApiErrorMessage } from './approval.utils'

export function useDraftModal(onSuccess?: () => void | Promise<void>) {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [draftOpen, setDraftOpen] = useState(false)
  const [draftForm, setDraftForm] = useState<DraftFormState>(defaultDraftForm)
  const [draftApprovers, setDraftApprovers] = useState<SelectedApprover[]>([])
  const [draftError, setDraftError] = useState('')
  const [draftSaving, setDraftSaving] = useState(false)

  // 사이드바 "기안서 작성" 버튼 이벤트 수신
  useEffect(() => {
    const openDraft = () => setDraftOpen(true)
    window.addEventListener('approval:open-draft', openDraft)
    return () => window.removeEventListener('approval:open-draft', openDraft)
  }, [])

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
    const request: ApprovalDraftRequestDTO = {
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
      setDraftForm(defaultDraftForm)
      setDraftApprovers([])
      showToast({ title: '기안서를 임시저장했습니다.', variant: 'success' })
      if (onSuccess) await onSuccess()
      navigate('/approval/sent/temporary')
    } catch (error) {
      setDraftError(getApiErrorMessage(error, '기안서 임시저장에 실패했습니다.'))
    } finally {
      setDraftSaving(false)
    }
  }, [draftForm, draftApprovers, showToast, navigate, onSuccess])

  const closeDraft = useCallback(() => {
    setDraftOpen(false)
    setDraftError('')
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
    handleSaveDraft,
    closeDraft,
  }
}
