import { useState } from 'react'
import { Clock4 } from 'lucide-react'
import Button from '../../components/common/button/Button'
import ApprovalDraftModal from '../approval/ApprovalDraftModal'
import {
  defaultDraftForm,
  defaultOtDraftInfo,
  type DraftFormState,
  type OtDraftInfo,
  type SelectedApprover,
} from '../approval/approval.types'
import { attendanceApi } from '../../api/attendanceApi'
import { ApiError } from '../../api/axiosInstance'

type Props = {
  onApplied?: () => void | Promise<void>
}

/**
 * 초과근무 사전 신청 버튼 + (기안 모달 확장) 초과근무 신청 모달.
 */
export default function OtApply({ onApplied }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<DraftFormState>(defaultDraftForm)
  const [approvers, setApprovers] = useState<SelectedApprover[]>([])
  const [otInfo, setOtInfo] = useState<OtDraftInfo>(defaultOtDraftInfo)

  const openModal = () => {
    setForm({ ...defaultDraftForm, docTtl: '초과근무 신청서' })
    setApprovers([])
    setOtInfo(defaultOtDraftInfo)
    setError('')
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!otInfo.otYmd) {
      setError('초과근무 일자를 선택하세요.')
      return
    }
    if (!otInfo.otBgnTm || !otInfo.otEndTm) {
      setError('초과근무 시간을 입력하세요.')
      return
    }
    if (otInfo.otEndTm <= otInfo.otBgnTm) {
      setError('종료 시각은 시작 시각 이후여야 합니다.')
      return
    }
    if (!form.docTtl.trim()) {
      setError('기안서 제목을 입력하세요.')
      return
    }
    if (approvers.length === 0) {
      setError('결재자를 한 명 이상 지정하세요.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await attendanceApi.applyOt({
        otYmd: otInfo.otYmd,
        otBgnTm: otInfo.otBgnTm,
        otEndTm: otInfo.otEndTm,
        reqRsn: otInfo.reqRsn.trim() || undefined,
        docTtl: form.docTtl.trim(),
        tmplatCd: form.tmplatCd.trim() || undefined,
        aprvlFullCn: form.aprvlFullCn,
        aprvlHopeDt: form.aprvlHopeDt
          ? new Date(form.aprvlHopeDt).toISOString()
          : undefined,
        approvalLines: approvers.map((a, idx) => ({
          aprvlOrd: idx + 1,
          aprvlMthdCd: '01',
          aprvrEmpIds: [a.id],
        })),
      })
      setOpen(false)
      alert('초과근무 신청이 결재 요청되었습니다.')
      if (onApplied) await onApplied()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '초과근무 신청에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="outline" leftIcon={<Clock4 size={16} />} onClick={openModal}>
        초과근무 신청
      </Button>

      <ApprovalDraftModal
        open={open}
        saving={saving}
        form={form}
        approvers={approvers}
        error={error}
        onChange={setForm}
        onApproversChange={setApprovers}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        otMode
        otInfo={otInfo}
        onOtInfoChange={setOtInfo}
        title="초과근무 신청"
        description="초과근무 정보를 입력하고 양식 내용을 작성한 뒤, 오른쪽에서 결재자를 지정하세요. 제출하면 곧바로 결재 요청됩니다."
        submitLabel="결재 요청"
      />
    </>
  )
}
