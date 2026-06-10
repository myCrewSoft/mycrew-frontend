import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { approvalApi } from '../../api/approvalApi'
import { employeeApi } from '../../api/employeeApi'
import Button from '../../components/common/button/Button'
import FormField from '../../components/common/form/formField/FormField'
import Modal from '../../components/common/overlay/modal/Modal'
import type { EmployeeLookupResponse } from '../../types'
import type { ApprovalTemplateResponse } from '../../types/approval'
import type { DraftFormState, SelectedApprover } from './approval.types'

type Props = {
  open: boolean
  saving: boolean
  form: DraftFormState
  approvers: SelectedApprover[]
  error: string
  onChange: (nextForm: DraftFormState) => void
  onApproversChange: (next: SelectedApprover[]) => void
  onClose: () => void
  onSubmit: () => Promise<void>
}

export default function ApprovalDraftModal({
  open,
  saving,
  form,
  approvers,
  error,
  onChange,
  onApproversChange,
  onClose,
  onSubmit,
}: Props) {
  const [templates, setTemplates] = useState<ApprovalTemplateResponse[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeResults, setEmployeeResults] = useState<EmployeeLookupResponse[]>([])
  const [employeeLoading, setEmployeeLoading] = useState(false)
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 모달 열릴 때 템플릿 목록 로드
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplatesLoading(true)
    approvalApi
      .getApprovalTemplates()
      .then((res) => setTemplates(res.data.data ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false))
  }, [open])

  // 템플릿 선택 시 contenteditable에 HTML 삽입
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = form.aprvlFullCn
    }
  }, [form.tmplatCd]) // eslint-disable-line react-hooks/exhaustive-deps

  // 사원 검색 디바운스
  useEffect(() => {
    if (!employeeSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmployeeResults([])
      return
    }
    setEmployeeLoading(true)
    const timer = setTimeout(() => {
      employeeApi
        .lookupEmployees({ keyword: employeeSearch })
        .then((res) => setEmployeeResults(res.data.data ?? []))
        .catch(() => setEmployeeResults([]))
        .finally(() => setEmployeeLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [employeeSearch])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowEmployeeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTemplateChange = (tmplatCd: string) => {
    const selected = templates.find((t) => t.tmplatCd === tmplatCd)
    const content = selected?.tmplatCn ?? ''
    onChange({ ...form, tmplatCd, aprvlFullCn: content })
  }

  const handleContentInput = () => {
    if (contentRef.current) {
      onChange({ ...form, aprvlFullCn: contentRef.current.innerHTML })
    }
  }

  const addApprover = (emp: EmployeeLookupResponse) => {
    if (approvers.some((a) => a.id === emp.id)) return
    onApproversChange([
      ...approvers,
      { id: emp.id, name: emp.name, department: emp.department, position: emp.position },
    ])
    setEmployeeSearch('')
    setEmployeeResults([])
    setShowEmployeeDropdown(false)
  }

  const removeApprover = (id: number) => {
    onApproversChange(approvers.filter((a) => a.id !== id))
  }

  return (
    <Modal
      open={open}
      title="기안서 작성"
      description="결재 양식을 선택하면 내용이 자동으로 채워집니다. 내용을 직접 수정하고 결재자를 지정하세요."
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button loading={saving} leftIcon={<Send size={16} />} onClick={() => void onSubmit()}>
            임시저장
          </Button>
        </>
      }
    >
      <div className="approval-draft-form">
        <FormField
          label="기안서 제목"
          placeholder="예: 신규 장비 구매 품의"
          value={form.docTtl}
          onChange={(event) => onChange({ ...form, docTtl: event.target.value })}
        />

        <div className="approval-draft-form__grid">
          {/* 템플릿 셀렉트박스 */}
          <div>
            <label className="approval-draft-form__label">결재 양식</label>
            <select
              className="approval-draft-form__select"
              value={form.tmplatCd}
              disabled={templatesLoading}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">
                {templatesLoading ? '양식 불러오는 중...' : '양식을 선택하세요'}
              </option>
              {templates.map((t) => (
                <option key={t.tmplatCd} value={t.tmplatCd}>
                  {t.tmplatNm} ({t.tmplatCd})
                </option>
              ))}
            </select>
          </div>

          <FormField
            label="결재 희망 일시"
            type="datetime-local"
            value={form.aprvlHopeDt}
            onChange={(event) => onChange({ ...form, aprvlHopeDt: event.target.value })}
          />
        </div>

        {/* 결재 내용 – contenteditable HTML 편집 */}
        <div>
          <label className="approval-draft-form__label">결재 내용</label>
          <div
            ref={contentRef}
            className="approval-draft-form__content-editor approval-page__html-document"
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            data-placeholder="양식을 선택하거나 직접 내용을 입력하세요."
          />
        </div>

        {/* 결재자 선택 */}
        <div>
          <label className="approval-draft-form__label">결재자</label>

          {approvers.length > 0 && (
            <div className="approval-draft-form__approver-chips">
              {approvers.map((a, idx) => (
                <span key={a.id} className="approval-draft-form__approver-chip">
                  <span className="approval-draft-form__approver-chip-order">{idx + 1}</span>
                  {a.name} · {a.position}
                  <button
                    type="button"
                    className="approval-draft-form__approver-chip-remove"
                    onClick={() => removeApprover(a.id)}
                    aria-label={`${a.name} 제거`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="approval-draft-form__employee-search" ref={dropdownRef}>
            <input
              type="text"
              className="approval-draft-form__employee-input"
              placeholder="이름으로 사원 검색"
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value)
                setShowEmployeeDropdown(true)
              }}
              onFocus={() => setShowEmployeeDropdown(true)}
            />
            {showEmployeeDropdown && (employeeLoading || employeeResults.length > 0) && (
              <div className="approval-draft-form__employee-dropdown">
                {employeeLoading ? (
                  <div className="approval-draft-form__employee-option approval-draft-form__employee-option--loading">
                    검색 중...
                  </div>
                ) : (
                  employeeResults.map((emp) => {
                    const alreadyAdded = approvers.some((a) => a.id === emp.id)
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        className={`approval-draft-form__employee-option${alreadyAdded ? ' approval-draft-form__employee-option--added' : ''}`}
                        onClick={() => addApprover(emp)}
                        disabled={alreadyAdded}
                      >
                        <span className="approval-draft-form__employee-name">{emp.name}</span>
                        <span className="approval-draft-form__employee-meta">
                          {emp.department} · {emp.position}
                        </span>
                        {alreadyAdded && (
                          <span className="approval-draft-form__employee-added-badge">추가됨</span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {error ? <p className="approval-draft-form__error">{error}</p> : null}
      </div>
    </Modal>
  )
}
