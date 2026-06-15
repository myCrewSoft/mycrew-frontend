import { Code2, Eye, Save, Stamp } from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from '../../components/common/button/Button'
import FormField from '../../components/common/form/formField/FormField'
import Textarea from '../../components/common/form/textarea/Textarea'
import Modal from '../../components/common/overlay/modal/Modal'
import type { TemplateFormState } from './approval.types'
import ApprovalHtmlDocument from './ApprovalHtmlDocument'

const TEMPLATE_EDITOR_ID = 'approval-template-html-editor'

// 결재 순서별 서명 슬롯 {{SIGN:n}} 을 가진 결재란 표 HTML을 생성한다.
// 인라인 스타일만 사용해 sandbox iframe(스크립트/외부 CSS 차단)에서도 그대로 렌더되게 한다.
const buildApprovalBox = (count: number) => {
  const headerCell = (text: string) =>
    `<td style="border:1px solid #334155;padding:4px 14px;background:#f1f5f9;font-weight:bold">${text}</td>`
  const signCell = (n: number) =>
    `<td style="border:1px solid #334155;width:84px;height:60px;vertical-align:middle">{{SIGN:${n}}}</td>`

  let headers = ''
  let signs = ''
  for (let i = 1; i <= count; i += 1) {
    headers += headerCell(`결재 ${i}`)
    signs += signCell(i)
  }

  return `
<table style="border-collapse:collapse;font-family:sans-serif;font-size:12px;text-align:center;float:right;margin:0 0 12px 12px">
  <tbody>
    <tr>${headers}</tr>
    <tr>${signs}</tr>
  </tbody>
</table>
`
}

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

  const handleInsertApprovalBox = () => {
    const countRaw = window.prompt('결재란에 넣을 결재(서명) 칸 수를 입력하세요. (1~6)', '3')
    if (countRaw === null) return
    const count = Math.min(6, Math.max(1, Math.floor(Number(countRaw)) || 3))
    const snippet = buildApprovalBox(count)

    const value = form.tmplatCn ?? ''
    const editor =
      viewMode === 'code'
        ? (document.getElementById(TEMPLATE_EDITOR_ID) as HTMLTextAreaElement | null)
        : null
    const start = editor?.selectionStart ?? value.length
    const end = editor?.selectionEnd ?? value.length

    const next = value.slice(0, start) + snippet + value.slice(end)
    onChange({ ...form, tmplatCn: next })
    setViewMode('code')

    // 상태 갱신 후 캐럿을 삽입한 결재란 뒤로 복원
    requestAnimationFrame(() => {
      const el = document.getElementById(TEMPLATE_EDITOR_ID) as HTMLTextAreaElement | null
      if (el) {
        const caret = start + snippet.length
        el.focus()
        el.setSelectionRange(caret, caret)
      }
    })
  }

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

          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Stamp size={15} />}
            onClick={handleInsertApprovalBox}
          >
            결재란 삽입
          </Button>
        </div>

        {viewMode === 'code' ? (
          <Textarea
            id={TEMPLATE_EDITOR_ID}
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
