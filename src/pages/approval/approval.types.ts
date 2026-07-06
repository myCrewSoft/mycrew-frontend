import type { ApprovalTemplateResponse } from '../../types/approval'

export type ApprovalBox =
  | 'sent-progress'
  | 'sent-completed'
  | 'sent-rejected'
  | 'sent-temporary'
  | 'received-requests'
  | 'received-history'
  | 'received-completed'

export type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'outline'

export type DraftFormState = {
  docTtl: string
  tmplatCd: string
  aprvlHopeDt: string
  aprvlFullCn: string
}

export const defaultDraftForm: DraftFormState = {
  docTtl: '',
  tmplatCd: '',
  aprvlHopeDt: '',
  aprvlFullCn: '',
}

export type SelectedApprover = {
  id: number
  name: string
  department: string
  position: string
  prflImgFileId?: number | null
}

// 휴가 신청 모드에서 기안 모달이 추가로 받는 휴가 정보
export type LeaveDraftInfo = {
  leaveTypeCd: string
  leaveBgnYmd: string
  leaveEndYmd: string
  reqRsn: string
}

export const defaultLeaveDraftInfo: LeaveDraftInfo = {
  leaveTypeCd: '',
  leaveBgnYmd: '',
  leaveEndYmd: '',
  reqRsn: '',
}

// 초과근무 신청 모드에서 기안 모달이 추가로 받는 초과근무 정보
export type OtDraftInfo = {
  otYmd: string
  otBgnTm: string
  otEndTm: string
  reqRsn: string
}

export const defaultOtDraftInfo: OtDraftInfo = {
  otYmd: '',
  otBgnTm: '',
  otEndTm: '',
  reqRsn: '',
}

export type TemplateFormState = {
  tmplatCd: string
  tmplatNm: string
  tmplatCn: string
  useYn: string
}

export const defaultTemplateForm: TemplateFormState = {
  tmplatCd: '',
  tmplatNm: '',
  tmplatCn: '',
  useYn: 'Y',
}

export const toTemplateForm = (
  template?: ApprovalTemplateResponse | null,
): TemplateFormState => ({
  tmplatCd: template?.tmplatCd ?? '',
  tmplatNm: template?.tmplatNm ?? '',
  tmplatCn: template?.tmplatCn ?? '',
  useYn: template?.useYn ?? 'Y',
})

export const PAGE_SIZE = 10
