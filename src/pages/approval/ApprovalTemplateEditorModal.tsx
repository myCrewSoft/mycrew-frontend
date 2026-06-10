import { Code2, Eye, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from '../../components/common/button/Button'
import FormField from '../../components/common/form/formField/FormField'
import Textarea from '../../components/common/form/textarea/Textarea'
import Modal from '../../components/common/overlay/modal/Modal'
import type { TemplateFormState } from './approval.types'
import ApprovalHtmlDocument from './ApprovalHtmlDocument'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  saving: boolean
  form: TemplateFormState
  error: string
  onChange: (nextForm: TemplateFormState) => void
  onClose: () => void
  onSubmit: () => Promise<void>
}

export default function ApprovalTemplateEditorModal({
  open,
  mode,
  saving,
  form,
  error,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setViewMode('code')
  }, [open])

  return (
    <Modal
      open={open}
      title={mode === 'create' ? '결재 양식 만들기' : '결재 양식 수정'}
      description="HTML로 작성한 결재 양식을 저장하면 사용자는 문서 형태의 미리보기로 확인할 수 있습니다."
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button loading={saving} leftIcon={<Save size={16} />} onClick={() => void onSubmit()}>
            저장
          </Button>
        </>
      }
    >
      <div className="approval-template-form">
        <div className="approval-template-form__grid">
          {mode === 'edit' ? (
            <FormField label="템플릿 코드" value={form.tmplatCd} disabled />
          ) : null}
          <FormField
            label="양식명"
            placeholder="예: 휴가 신청서"
            value={form.tmplatNm}
            onChange={(event) => onChange({ ...form, tmplatNm: event.target.value })}
          />
          <FormField
            label="사용 여부"
            placeholder="Y 또는 N"
            value={form.useYn}
            onChange={(event) =>
              onChange({ ...form, useYn: event.target.value.toUpperCase() })
            }
          />
        </div>

        <div className="approval-template-form__toolbar">
          <Button
            size="sm"
            variant={viewMode === 'code' ? 'primary' : 'outline'}
            leftIcon={<Code2 size={15} />}
            onClick={() => setViewMode('code')}
          >
            HTML 편집
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'preview' ? 'primary' : 'outline'}
            leftIcon={<Eye size={15} />}
            onClick={() => setViewMode('preview')}
          >
            문서 미리보기
          </Button>
        </div>

        {viewMode === 'code' ? (
          <Textarea
            label="HTML 양식"
            className="approval-template-form__editor"
            placeholder="<h1>휴가 신청서</h1>"
            value={form.tmplatCn}
            onChange={(event) => onChange({ ...form, tmplatCn: event.target.value })}
          />
        ) : (
          <div className="approval-template-form__preview-wrap">
            <span className="approval-template-form__preview-label">문서 미리보기</span>
            <ApprovalHtmlDocument html={form.tmplatCn} />
          </div>
        )}
        {error ? <p className="approval-draft-form__error">{error}</p> : null}
      </div>
    </Modal>
  )
}
