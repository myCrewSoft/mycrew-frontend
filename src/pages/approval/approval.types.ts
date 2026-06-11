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
