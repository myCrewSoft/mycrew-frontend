import { useEffect, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import Button from '../../components/common/button/Button'
import ApprovalDraftModal from '../approval/ApprovalDraftModal'
import {
  defaultDraftForm,
  defaultLeaveDraftInfo,
  type DraftFormState,
  type LeaveDraftInfo,
  type SelectedApprover,
} from '../approval/approval.types'
import { attendanceApi, type AtndLeaveType } from '../../api/attendanceApi'
import { ApiError } from '../../api/axiosInstance'

type Props = {
  onApplied?: () => void | Promise<void>
}

/**
 * 휴가 신청 버튼 + (기안 모달 확장) 휴가 신청 모달.
 * 신청자가 휴가 정보(종류/기간/사유)를 입력하고 양식 내용/결재선을 직접 작성한 뒤
 * 제출하면 전자결재 문서가 생성되어 곧바로 결재 요청됩니다.
 */
export default function LeaveApply({ onApplied }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<DraftFormState>(defaultDraftForm)
  const [approvers, setApprovers] = useState<SelectedApprover[]>([])
  const [leaveInfo, setLeaveInfo] = useState<LeaveDraftInfo>(defaultLeaveDraftInfo)
  const [leaveTypes, setLeaveTypes] = useState<AtndLeaveType[]>([])

  useEffect(() => {
    if (!open) return
    attendanceApi
      .getLeaveTypes()
      .then((res) => setLeaveTypes(res.data.data ?? []))
      .catch(() => setLeaveTypes([]))
  }, [open])

  const openModal = () => {
    setForm({ ...defaultDraftForm, docTtl: '휴가 신청서' })
    setApprovers([])
    setLeaveInfo(defaultLeaveDraftInfo)
    setError('')
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!leaveInfo.leaveTypeCd) {
      setError('휴가 종류를 선택하세요.')
      return
    }
    if (!leaveInfo.leaveBgnYmd || !leaveInfo.leaveEndYmd) {
      setError('휴가 기간을 입력하세요.')
      return
    }
    if (leaveInfo.leaveEndYmd < leaveInfo.leaveBgnYmd) {
      setError('종료일은 시작일 이후여야 합니다.')
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
      await attendanceApi.applyLeave({
        leaveTypeCd: leaveInfo.leaveTypeCd,
        leaveBgnYmd: leaveInfo.leaveBgnYmd,
        leaveEndYmd: leaveInfo.leaveEndYmd,
        reqRsn: leaveInfo.reqRsn.trim() || undefined,
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
      alert('휴가 신청이 결재 요청되었습니다.')
      if (onApplied) await onApplied()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '휴가 신청에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="primary" leftIcon={<CalendarPlus size={16} />} onClick={openModal}>
        휴가 신청
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
        leaveMode
        leaveInfo={leaveInfo}
        leaveTypes={leaveTypes}
        onLeaveInfoChange={setLeaveInfo}
        title="휴가 신청"
        description="휴가 정보를 입력하고 양식 내용을 작성한 뒤, 오른쪽에서 결재자를 지정하세요. 제출하면 곧바로 결재 요청됩니다."
        submitLabel="결재 요청"
      />
    </>
  )
}
