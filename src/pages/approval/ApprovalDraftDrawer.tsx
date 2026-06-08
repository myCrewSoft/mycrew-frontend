import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Textarea from '../../components/common/form/textarea/Textarea'

export interface ApprovalDraftFormValues {
  title: string
  documentType: string
  approver: string
  reference: string
  dueDate: string
  content: string
}

interface ApprovalDraftDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: ApprovalDraftFormValues) => void
}

const initialFormValues: ApprovalDraftFormValues = {
  title: '',
  documentType: '업무기안',
  approver: '',
  reference: '',
  dueDate: '',
  content: '',
}

const documentTypeOptions = [
  { value: '업무기안', label: '업무기안' },
  { value: '지출결의', label: '지출결의' },
  { value: '휴가신청', label: '휴가신청' },
  { value: '구매요청', label: '구매요청' },
]

const ApprovalDraftDrawer = ({
  open,
  onClose,
  onSubmit,
}: ApprovalDraftDrawerProps) => {
  const [formValues, setFormValues] =
    useState<ApprovalDraftFormValues>(initialFormValues)
  const [errorMessage, setErrorMessage] = useState('')

  const updateFormValue = (
    key: keyof ApprovalDraftFormValues,
    value: string,
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  const resetForm = () => {
    setFormValues(initialFormValues)
    setErrorMessage('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.title.trim()) {
      setErrorMessage('기안서 제목을 입력해 주세요.')
      return
    }

    if (!formValues.approver.trim()) {
      setErrorMessage('결재자를 입력해 주세요.')
      return
    }

    if (!formValues.content.trim()) {
      setErrorMessage('기안 내용을 입력해 주세요.')
      return
    }

    onSubmit({
      ...formValues,
      title: formValues.title.trim(),
      approver: formValues.approver.trim(),
      reference: formValues.reference.trim(),
      content: formValues.content.trim(),
    })
    resetForm()
  }

  return (
    <aside
      className={`h-full shrink-0 overflow-hidden border-slate-200 bg-white transition-[width,border-color] duration-300 ease-out ${
        open ? 'w-[440px] border-l' : 'w-0 border-l border-transparent'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`flex h-full w-[440px] flex-col shadow-[-16px_0_32px_rgba(15,23,42,0.06)] transition-[transform,opacity] duration-300 ease-out ${
          open ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">기안서 작성</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              임시 UI에서 결재 상신 흐름을 확인합니다.
            </p>
          </div>
          <IconButton aria-label="기안서 작성 닫기" size="sm" onClick={handleClose}>
            <X size={18} />
          </IconButton>
        </header>

        <form
          id="approval-draft-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
        >
          <div className="flex flex-col gap-5">
            <FormField
              label="기안서 제목"
              placeholder="예: 신규 장비 구매 요청"
              value={formValues.title}
              onChange={(event) => updateFormValue('title', event.target.value)}
            />

            <Select
              label="문서 유형"
              options={documentTypeOptions}
              value={formValues.documentType}
              onChange={(event) =>
                updateFormValue('documentType', event.target.value)
              }
            />

            <FormField
              label="결재자"
              placeholder="예: 김민수 팀장"
              value={formValues.approver}
              onChange={(event) =>
                updateFormValue('approver', event.target.value)
              }
            />

            <FormField
              label="참조자"
              placeholder="예: 운영지원팀"
              value={formValues.reference}
              onChange={(event) =>
                updateFormValue('reference', event.target.value)
              }
            />

            <FormField
              label="희망 결재일"
              type="date"
              value={formValues.dueDate}
              onChange={(event) => updateFormValue('dueDate', event.target.value)}
            />

            <Textarea
              label="기안 내용"
              placeholder="기안 목적, 요청 내용, 기대 효과를 입력해 주세요."
              className="min-h-52"
              value={formValues.content}
              onChange={(event) =>
                updateFormValue('content', event.target.value)
              }
            />
          </div>
        </form>

        {errorMessage && (
          <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button type="submit" form="approval-draft-form">
            상신
          </Button>
        </footer>
      </div>
    </aside>
  )
}

export default ApprovalDraftDrawer
