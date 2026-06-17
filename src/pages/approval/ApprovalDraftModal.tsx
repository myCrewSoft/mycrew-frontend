import { Search, Send, Sparkles, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { approvalApi } from '../../api/approvalApi'
import { employeeApi } from '../../api/employeeApi'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import Button from '../../components/common/button/Button'
import FormField from '../../components/common/form/formField/FormField'
import Modal from '../../components/common/overlay/modal/Modal'
import type { EmployeeLookupResponse } from '../../types'
import type { ApprovalTemplateResponse } from '../../types/approval'
import type { AtndLeaveType } from '../../api/attendanceApi'
import type {
  DraftFormState,
  LeaveDraftInfo,
  OtDraftInfo,
  SelectedApprover,
} from './approval.types'

// lookup 응답의 profileImageUrl(`/api/files/images/{id}`)에서 파일 ID만 추출한다.
const extractProfileFileId = (
  profileImageUrl?: string | null,
): number | null => {
  if (!profileImageUrl) return null
  const matched = profileImageUrl.match(/(\d+)\s*$/)
  return matched ? Number(matched[1]) : null
}

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
  aiPrompt?: string
  aiGenerating?: boolean
  onAiPromptChange?: (value: string) => void
  onGenerateAiDraft?: () => Promise<void>
  // ── 휴가 신청 모드(옵션) ──
  leaveMode?: boolean
  leaveInfo?: LeaveDraftInfo
  leaveTypes?: AtndLeaveType[]
  onLeaveInfoChange?: (next: LeaveDraftInfo) => void
  // ── 초과근무 신청 모드(옵션) ──
  otMode?: boolean
  otInfo?: OtDraftInfo
  onOtInfoChange?: (next: OtDraftInfo) => void
  title?: string
  description?: string
  submitLabel?: string
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
  aiPrompt = '',
  aiGenerating = false,
  onAiPromptChange,
  onGenerateAiDraft,
  leaveMode = false,
  leaveInfo,
  leaveTypes = [],
  onLeaveInfoChange,
  otMode = false,
  otInfo,
  onOtInfoChange,
  title,
  description,
  submitLabel,
}: Props) {
  const [templates, setTemplates] = useState<ApprovalTemplateResponse[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeResults, setEmployeeResults] = useState<EmployeeLookupResponse[]>([])
  const [employeeLoading, setEmployeeLoading] = useState(false)
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  // iframe 에디터: ref + 최신 form/onChange를 ref로 보관해 stale closure 방지
  const editorFrameRef = useRef<HTMLIFrameElement>(null)
  const formRef = useRef(form)
  const onChangeRef = useRef(onChange)
  useEffect(() => { formRef.current = form }, [form])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const showAiDraft = Boolean(onGenerateAiDraft && onAiPromptChange && !leaveMode && !otMode)

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

  // 템플릿 선택 or 모달 열릴 때 iframe에 HTML을 직접 기록 (style 격리)
  useEffect(() => {
    if (!open) return
    const frame = editorFrameRef.current
    if (!frame) return
    const doc = frame.contentDocument
    if (!doc) return
    const html = formRef.current.aprvlFullCn
    doc.open()
    doc.write(html || '<p></p>')
    doc.close()
    const body = doc.body
    if (!body) return
    body.contentEditable = 'true'
    body.style.outline = 'none'
    body.style.cursor = 'text'
    const controller = new AbortController()
    doc.addEventListener(
      'input',
      () => {
        // head 스타일을 보존하면서 body 내용만 갱신
        const headHtml = doc.head?.innerHTML ?? ''
        const bodyHtml = body.innerHTML
        const fullHtml = headHtml
          ? `<!DOCTYPE html><html><head>${headHtml}</head><body>${bodyHtml}</body></html>`
          : bodyHtml
        onChangeRef.current({ ...formRef.current, aprvlFullCn: fullHtml })
      },
      { signal: controller.signal },
    )
    return () => controller.abort()
  }, [form.tmplatCd, open])

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

  const addApprover = (emp: EmployeeLookupResponse) => {
    if (approvers.some((a) => a.id === emp.id)) return
    onApproversChange([
      ...approvers,
      {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        prflImgFileId: extractProfileFileId(emp.profileImageUrl),
      },
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
      title={title ?? '기안서 작성'}
      description={
        description ??
        '결재 양식을 선택하고 내용을 작성한 뒤, 오른쪽에서 결재자를 순서대로 지정하세요.'
      }
      onClose={onClose}
      size="xl"
      maxWidthClassName="max-w-7xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button loading={saving} leftIcon={<Send size={16} />} onClick={() => void onSubmit()}>
            {submitLabel ?? '임시저장'}
          </Button>
        </>
      }
    >
      {/* 2-컬럼 레이아웃: 왼쪽 = 내용 작성, 오른쪽 = 결재자 선택 */}
      <div className="approval-draft-layout">

        {/* ── 왼쪽: 기안서 내용 ── */}
        <div className="approval-draft-layout__main">
          <div className="approval-draft-form">
            {showAiDraft && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-blue-700">
                  <Sparkles size={16} />
                  <span>AI 초안 생성</span>
                </div>
                <textarea
                  className="min-h-20 w-full resize-y rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                  placeholder="예: 6월 20일부터 21일까지 개인 사유로 휴가 신청서 작성해줘."
                  value={aiPrompt}
                  disabled={aiGenerating || saving}
                  onChange={(event) => onAiPromptChange?.(event.target.value)}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={aiGenerating}
                    disabled={!aiPrompt.trim() || saving}
                    leftIcon={<Sparkles size={14} />}
                    onClick={() => void onGenerateAiDraft?.()}
                  >
                    AI로 임시저장
                  </Button>
                </div>
              </div>
            )}
            {/* 휴가 신청 모드: 휴가 정보 입력 */}
            {leaveMode && leaveInfo && onLeaveInfoChange && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                <p className="mb-3 text-sm font-black text-blue-700">휴가 정보</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600">휴가 종류</span>
                    <select
                      className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-blue-500"
                      value={leaveInfo.leaveTypeCd}
                      onChange={(e) =>
                        onLeaveInfoChange({ ...leaveInfo, leaveTypeCd: e.target.value })
                      }
                    >
                      <option value="">선택</option>
                      {leaveTypes.map((t) => (
                        <option key={t.leaveTypeCd} value={t.leaveTypeCd}>
                          {t.leaveTypeNm}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600">시작일</span>
                    <input
                      type="date"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-blue-500"
                      value={leaveInfo.leaveBgnYmd}
                      onChange={(e) =>
                        onLeaveInfoChange({ ...leaveInfo, leaveBgnYmd: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600">종료일</span>
                    <input
                      type="date"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-blue-500"
                      value={leaveInfo.leaveEndYmd}
                      onChange={(e) =>
                        onLeaveInfoChange({ ...leaveInfo, leaveEndYmd: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-600">사유</span>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-blue-500"
                    placeholder="예: 개인 사유"
                    value={leaveInfo.reqRsn}
                    onChange={(e) =>
                      onLeaveInfoChange({ ...leaveInfo, reqRsn: e.target.value })
                    }
                  />
                </label>
              </div>
            )}

            {/* 초과근무 신청 모드: 초과근무 정보 입력 */}
            {otMode && otInfo && onOtInfoChange && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="mb-3 text-sm font-black text-amber-700">초과근무 정보</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600">일자</span>
                    <input
                      type="date"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-amber-500"
                      value={otInfo.otYmd}
                      onChange={(e) => onOtInfoChange({ ...otInfo, otYmd: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600">시작 시각</span>
                    <input
                      type="time"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-amber-500"
                      value={otInfo.otBgnTm}
                      onChange={(e) => onOtInfoChange({ ...otInfo, otBgnTm: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600">종료 시각</span>
                    <input
                      type="time"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-amber-500"
                      value={otInfo.otEndTm}
                      onChange={(e) => onOtInfoChange({ ...otInfo, otEndTm: e.target.value })}
                    />
                  </label>
                </div>
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-600">사유</span>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium outline-none focus:border-amber-500"
                    placeholder="예: 긴급 배포 대응"
                    value={otInfo.reqRsn}
                    onChange={(e) => onOtInfoChange({ ...otInfo, reqRsn: e.target.value })}
                  />
                </label>
              </div>
            )}

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

            {/* 결재 내용 – iframe 에디터 (style 태그 격리) */}
            <div>
              <label className="approval-draft-form__label">결재 내용</label>
              <iframe
                ref={editorFrameRef}
                className="approval-draft-form__content-editor"
                title="결재 내용 편집기"
                sandbox="allow-same-origin"
              />
            </div>

            {error ? <p className="approval-draft-form__error">{error}</p> : null}
          </div>
        </div>

        {/* ── 오른쪽: 결재선 패널 ── */}
        <div className="approval-draft-layout__approver-panel">
          <div className="approval-approver-panel">
            <div className="approval-approver-panel__header">
              <UserPlus size={16} />
              <span>결재선 설정</span>
            </div>

            <p className="approval-approver-panel__desc">
              결재자를 검색해 추가하면 위에서부터 1순위로 순차 결재됩니다.
            </p>

            {/* 사원 검색 */}
            <div className="approval-approver-panel__search" ref={dropdownRef}>
              <div className="approval-approver-panel__search-input-wrap">
                <Search size={14} className="approval-approver-panel__search-icon" />
                <input
                  type="text"
                  className="approval-approver-panel__search-input"
                  placeholder="이름으로 결재자 검색"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value)
                    setShowEmployeeDropdown(true)
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                />
              </div>
              {showEmployeeDropdown && (employeeLoading || employeeResults.length > 0) && (
                <div className="approval-approver-panel__dropdown">
                  {employeeLoading ? (
                    <div className="approval-approver-panel__dropdown-item approval-approver-panel__dropdown-item--loading">
                      검색 중...
                    </div>
                  ) : (
                    employeeResults.map((emp) => {
                      const alreadyAdded = approvers.some((a) => a.id === emp.id)
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          className={`approval-approver-panel__dropdown-item${alreadyAdded ? ' approval-approver-panel__dropdown-item--added' : ''}`}
                          onClick={() => addApprover(emp)}
                          disabled={alreadyAdded}
                          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                          <ProfileAvatar
                            fileId={extractProfileFileId(emp.profileImageUrl)}
                            name={emp.name}
                            size={32}
                          />
                          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <span className="approval-approver-panel__emp-name">{emp.name}</span>
                            <span className="approval-approver-panel__emp-meta">
                              {emp.department} · {emp.position}
                            </span>
                          </span>
                          {alreadyAdded && (
                            <span className="approval-approver-panel__badge">추가됨</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* 결재선 목록 */}
            {approvers.length === 0 ? (
              <div className="approval-approver-panel__empty">
                <UserPlus size={28} strokeWidth={1.5} />
                <p>결재자를 추가하세요</p>
              </div>
            ) : (
              <ol className="approval-approver-panel__list">
                {approvers.map((a, idx) => (
                  <li key={a.id} className="approval-approver-panel__item">
                    <span className="approval-approver-panel__order">{idx + 1}</span>
                    {idx < approvers.length - 1 && (
                      <span className="approval-approver-panel__connector" />
                    )}
                    <ProfileAvatar
                      fileId={a.prflImgFileId}
                      name={a.name}
                      size={32}
                    />
                    <div className="approval-approver-panel__info">
                      <span className="approval-approver-panel__name">{a.name}</span>
                      <span className="approval-approver-panel__sub">
                        {a.department} · {a.position}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="approval-approver-panel__remove"
                      onClick={() => removeApprover(a.id)}
                      aria-label={`${a.name} 제거`}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

      </div>
    </Modal>
  )
}
