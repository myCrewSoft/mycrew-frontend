import {
  CheckCircle2,
  Clock3,
  FileText,
  PenLine,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  XCircle,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { approvalApi, type ApprovalKeywordSearchParams } from '../../api/approvalApi'
import { ApiError } from '../../api/axiosInstance'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import FormField from '../../components/common/form/formField/FormField'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import Textarea from '../../components/common/form/textarea/Textarea'
import Modal from '../../components/common/overlay/modal/Modal'
import { useToast } from '../../components/common/toast/useToast'
import type {
  ApprovalActionRequestDTO,
  ApprovalDocumentDetailResponse,
  ApprovalDraftRequestDTO,
  ApprovalDraftSummaryResponse,
} from '../../types/approval'
import './ApprovalPage.css'

type ApprovalBox =
  | 'sent-progress'
  | 'sent-completed'
  | 'sent-rejected'
  | 'sent-temporary'
  | 'received-requests'
  | 'received-history'
  | 'received-completed'

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'outline'

type DraftFormState = {
  docTtl: string
  tmplatCd: string
  aprvlHopeDt: string
  aprvlFullCn: string
  aprvlMthdCd: string
  approverIds: string
}

const defaultDraftForm: DraftFormState = {
  docTtl: '',
  tmplatCd: '',
  aprvlHopeDt: '',
  aprvlFullCn: '',
  aprvlMthdCd: 'APPROVAL',
  approverIds: '',
}

const pageMeta: Record<
  ApprovalBox,
  {
    title: string
    description: string
    icon: typeof FileText
    badgeVariant: BadgeVariant
  }
> = {
  'sent-progress': {
    title: '진행 중 기안서 목록',
    description: '내가 상신했고 아직 결재가 완료되지 않은 기안서입니다.',
    icon: Clock3,
    badgeVariant: 'warning',
  },
  'sent-completed': {
    title: '완료된 기안서 목록',
    description: '내가 상신한 문서 중 결재가 완료된 기안서입니다.',
    icon: CheckCircle2,
    badgeVariant: 'success',
  },
  'sent-rejected': {
    title: '반려된 기안서 목록',
    description: '내가 상신한 문서 중 반려 처리된 기안서입니다.',
    icon: XCircle,
    badgeVariant: 'danger',
  },
  'sent-temporary': {
    title: '임시저장 기안서',
    description: '임시저장한 기안서를 확인하고 다시 결재 요청할 수 있습니다.',
    icon: PenLine,
    badgeVariant: 'outline',
  },
  'received-requests': {
    title: '결재 요청 목록',
    description: '내 결재 처리가 필요한 수신 문서입니다.',
    icon: FileText,
    badgeVariant: 'primary',
  },
  'received-history': {
    title: '결재 내역',
    description: '내가 결재자로 승인 또는 반려 처리한 문서 이력입니다.',
    icon: RotateCcw,
    badgeVariant: 'outline',
  },
  'received-completed': {
    title: '결재 완료 문서',
    description: '내가 승인 처리했고 최종 완료된 문서입니다.',
    icon: CheckCircle2,
    badgeVariant: 'success',
  },
}

const routeToBox = (folder?: string, status?: string): ApprovalBox | null => {
  if (folder === 'sent' && status === 'progress') return 'sent-progress'
  if (folder === 'sent' && status === 'completed') return 'sent-completed'
  if (folder === 'sent' && status === 'rejected') return 'sent-rejected'
  if (folder === 'sent' && status === 'temporary') return 'sent-temporary'
  if (folder === 'received' && status === 'requests') return 'received-requests'
  if (folder === 'received' && status === 'history') return 'received-history'
  if (folder === 'received' && status === 'completed') return 'received-completed'

  return null
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

const getStatusLabel = (statusCode: string) => {
  const normalized = statusCode.toUpperCase()

  if (normalized.includes('TEMP')) return '임시저장'
  if (normalized.includes('PROGRESS') || normalized.includes('PRGRS')) return '진행 중'
  if (normalized.includes('COMPLETE') || normalized.includes('CMPTN')) return '완료'
  if (normalized.includes('REJECT') || normalized.includes('RTRN')) return '반려'
  if (normalized.includes('REQUEST')) return '결재 요청'

  return statusCode || '-'
}

const getStepStatusLabel = (statusCode: string) => {
  const normalized = statusCode.toUpperCase()

  if (normalized.includes('APPROVE') || normalized.includes('APRVD')) return '승인'
  if (normalized.includes('REJECT') || normalized.includes('RTRN')) return '반려'
  if (normalized.includes('WAIT')) return '대기'
  if (normalized.includes('PROGRESS') || normalized.includes('PRGRS')) return '진행 중'

  return statusCode || '-'
}

const getStatusVariant = (statusCode: string): BadgeVariant => {
  const label = getStatusLabel(statusCode)

  if (label === '완료') return 'success'
  if (label === '반려') return 'danger'
  if (label === '진행 중') return 'warning'
  if (label === '결재 요청') return 'primary'

  return 'outline'
}

const getListRequest = (
  box: ApprovalBox,
  params?: ApprovalKeywordSearchParams,
) => {
  switch (box) {
    case 'sent-progress':
      return approvalApi.getProgressApprovalList(params)
    case 'sent-completed':
      return approvalApi.getCompletedApprovalList(params)
    case 'sent-rejected':
      return approvalApi.getRejectedApprovalList(params)
    case 'sent-temporary':
      return approvalApi.getTemporaryApprovalList(params)
    case 'received-requests':
      return approvalApi.getRequestedApprovalList(params)
    case 'received-history':
      return approvalApi.getHistoryApprovalList(params)
    case 'received-completed':
      return approvalApi.getCompletedApprovalDocumentList(params)
  }
}

const parseApproverIds = (value: string) =>
  value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((item) => Number.isInteger(item) && item > 0)

function DraftModal({
  open,
  saving,
  form,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  form: DraftFormState
  error: string
  onChange: (nextForm: DraftFormState) => void
  onClose: () => void
  onSubmit: () => Promise<void>
}) {
  return (
    <Modal
      open={open}
      title="기안서 작성"
      description="백엔드 임시저장 API에서 지원하는 제목, 템플릿, 희망일, 본문, 결재선을 입력합니다."
      onClose={onClose}
      size="lg"
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
          <FormField
            label="템플릿 코드"
            placeholder="예: EXPENSE_REPORT"
            value={form.tmplatCd}
            onChange={(event) => onChange({ ...form, tmplatCd: event.target.value })}
          />
          <FormField
            label="결재 희망 일시"
            type="datetime-local"
            value={form.aprvlHopeDt}
            onChange={(event) => onChange({ ...form, aprvlHopeDt: event.target.value })}
          />
        </div>
        <div className="approval-draft-form__grid">
          <FormField
            label="결재 방식 코드"
            placeholder="예: APPROVAL"
            value={form.aprvlMthdCd}
            onChange={(event) => onChange({ ...form, aprvlMthdCd: event.target.value })}
          />
          <FormField
            label="결재자 사원 ID"
            placeholder="예: 1001, 1002"
            value={form.approverIds}
            helperText="쉼표 또는 공백으로 여러 명을 입력할 수 있습니다."
            onChange={(event) => onChange({ ...form, approverIds: event.target.value })}
          />
        </div>
        <Textarea
          label="결재 내용"
          className="approval-draft-form__textarea"
          placeholder="결재 전문 내용을 입력하세요."
          value={form.aprvlFullCn}
          onChange={(event) => onChange({ ...form, aprvlFullCn: event.target.value })}
        />
        {error ? <p className="approval-draft-form__error">{error}</p> : null}
      </div>
    </Modal>
  )
}

function ActionModal({
  open,
  title,
  description,
  loading,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  loading: boolean
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void | Promise<void>
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button loading={loading} onClick={() => void onConfirm()}>
            확인
          </Button>
        </>
      }
    >
      <Textarea
        label="처리 사유"
        placeholder="승인 또는 반려 사유를 입력하세요."
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
    </Modal>
  )
}

export default function ApprovalPage() {
  const { folder, status } = useParams<{ folder?: string; status?: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const currentBox = routeToBox(folder, status)

  const [documents, setDocuments] = useState<ApprovalDraftSummaryResponse[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)
  const [detail, setDetail] = useState<ApprovalDocumentDetailResponse | null>(null)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)
  const [draftForm, setDraftForm] = useState(defaultDraftForm)
  const [draftError, setDraftError] = useState('')
  const [reason, setReason] = useState('')
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const meta = currentBox ? pageMeta[currentBox] : pageMeta['sent-progress']
  const HeaderIcon = meta.icon

  const loadList = useCallback(async () => {
    if (!currentBox) return

    setListLoading(true)
    setErrorMessage('')

    try {
      const response = await getListRequest(
        currentBox,
        keyword ? { keyword } : undefined,
      )
      const nextDocuments = response.data.data ?? []
      setDocuments(nextDocuments)
      setSelectedDocumentId((current) => {
        if (current && nextDocuments.some((document) => document.drftDocSn === current)) {
          return current
        }

        return nextDocuments[0]?.drftDocSn ?? null
      })
    } catch (error) {
      setDocuments([])
      setSelectedDocumentId(null)
      setErrorMessage(getApiErrorMessage(error, '결재 문서 목록을 불러오지 못했습니다.'))
    } finally {
      setListLoading(false)
    }
  }, [currentBox, keyword])

  const loadDetail = useCallback(async () => {
    if (!selectedDocumentId) {
      setDetail(null)
      return
    }

    setDetailLoading(true)

    try {
      const response =
        currentBox && currentBox.startsWith('sent')
          ? await approvalApi.getApprovalStatus(selectedDocumentId)
          : await approvalApi.getApprovalDetail(selectedDocumentId)
      setDetail(response.data.data ?? null)
    } catch (error) {
      setDetail(null)
      showToast({
        title: '결재 문서 상세 조회 실패',
        description: getApiErrorMessage(error, '결재 문서 상세를 불러오지 못했습니다.'),
        variant: 'danger',
      })
    } finally {
      setDetailLoading(false)
    }
  }, [currentBox, selectedDocumentId, showToast])

  useEffect(() => {
    if (!currentBox) {
      navigate('/approval/sent/progress', { replace: true })
    }
  }, [currentBox, navigate])

  useEffect(() => {
    setSelectedDocumentId(null)
    setDetail(null)
    setKeywordInput('')
    setKeyword('')
  }, [currentBox])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  useEffect(() => {
    const openDraft = () => setDraftOpen(true)
    window.addEventListener('approval:open-draft', openDraft)

    return () => {
      window.removeEventListener('approval:open-draft', openDraft)
    }
  }, [])

  const selectedSummary = useMemo(
    () => documents.find((document) => document.drftDocSn === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  )

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(keywordInput.trim())
  }

  const handleSaveDraft = async () => {
    const approverIds = parseApproverIds(draftForm.approverIds)

    if (!draftForm.docTtl.trim()) {
      setDraftError('기안서 제목을 입력하세요.')
      return
    }

    if (!draftForm.aprvlFullCn.trim()) {
      setDraftError('결재 내용을 입력하세요.')
      return
    }

    if (!draftForm.aprvlMthdCd.trim() || approverIds.length === 0) {
      setDraftError('결재 방식 코드와 결재자 사원 ID를 입력하세요.')
      return
    }

    setActionLoading(true)
    setDraftError('')

    const request: ApprovalDraftRequestDTO = {
      docTtl: draftForm.docTtl.trim(),
      tmplatCd: draftForm.tmplatCd.trim() || undefined,
      aprvlHopeDt: draftForm.aprvlHopeDt
        ? new Date(draftForm.aprvlHopeDt).toISOString()
        : undefined,
      aprvlFullCn: draftForm.aprvlFullCn,
      approvalLines: [
        {
          aprvlMthdCd: draftForm.aprvlMthdCd.trim(),
          aprvlOrd: 1,
          aprvrEmpIds: approverIds,
        },
      ],
    }

    try {
      await approvalApi.saveTemporaryDraft(request)
      setDraftOpen(false)
      setDraftForm(defaultDraftForm)
      showToast({ title: '기안서를 임시저장했습니다.', variant: 'success' })
      navigate('/approval/sent/temporary')
      await loadList()
    } catch (error) {
      setDraftError(getApiErrorMessage(error, '기안서 임시저장에 실패했습니다.'))
    } finally {
      setActionLoading(false)
    }
  }

  const mutateAndReload = async (
    action: () => Promise<unknown>,
    successTitle: string,
  ) => {
    setActionLoading(true)

    try {
      await action()
      setActionMode(null)
      setReason('')
      showToast({ title: successTitle, variant: 'success' })
      await loadList()
      await loadDetail()
    } catch (error) {
      showToast({
        title: '결재 처리 실패',
        description: getApiErrorMessage(error, '결재 처리 중 오류가 발생했습니다.'),
        variant: 'danger',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = () => {
    if (!selectedDocumentId) return

    const request: ApprovalActionRequestDTO = reason.trim()
      ? { reason: reason.trim() }
      : {}

    void mutateAndReload(
      async () => {
        await approvalApi.canApprove(selectedDocumentId)
        await approvalApi.approveApproval(selectedDocumentId, request)
      },
      '결재를 승인했습니다.',
    )
  }

  const handleReject = () => {
    if (!selectedDocumentId) return

    if (!reason.trim()) {
      showToast({
        title: '반려 사유를 입력하세요.',
        variant: 'danger',
      })
      return
    }

    void mutateAndReload(
      async () => {
        await approvalApi.canReject(selectedDocumentId)
        await approvalApi.rejectApproval(selectedDocumentId, { reason: reason.trim() })
      },
      '결재를 반려했습니다.',
    )
  }

  const handleSubmitDraft = () => {
    if (!selectedDocumentId) return
    void mutateAndReload(
      () => approvalApi.submitApproval(selectedDocumentId),
      '결재 요청을 보냈습니다.',
    )
  }

  const handleWithdraw = () => {
    if (!selectedDocumentId) return
    void mutateAndReload(
      () => approvalApi.withdrawApproval(selectedDocumentId),
      '결재 문서를 회수했습니다.',
    )
  }

  return (
    <div className="approval-page">
      <section className="approval-page__header">
        <div className="approval-page__header-top">
          <div className="approval-page__title-group">
            <span className="approval-page__icon-box">
              <HeaderIcon size={21} />
            </span>
            <div className="approval-page__title-text">
              <h1 className="approval-page__title">{meta.title}</h1>
              <p className="approval-page__description">{meta.description}</p>
            </div>
          </div>
          <div className="approval-page__header-actions">
            <Button
              variant="outline"
              loading={listLoading}
              leftIcon={<RefreshCcw size={16} />}
              onClick={() => void loadList()}
            >
              새로고침
            </Button>
            <Button leftIcon={<PenLine size={16} />} onClick={() => setDraftOpen(true)}>
              기안서 작성
            </Button>
          </div>
        </div>

        <form className="approval-page__search" onSubmit={handleSearch}>
          <SearchInput
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="제목, 기안자, 결재자 검색"
          />
          <Button type="submit" variant="outline" leftIcon={<Search size={16} />}>
            검색
          </Button>
        </form>
      </section>

      {errorMessage ? (
        <div className="approval-page__error">{errorMessage}</div>
      ) : null}

      <section className="approval-page__workspace">
        <div className="approval-page__list-panel">
          {listLoading ? (
            <div className="approval-page__loading">결재 문서를 불러오는 중입니다.</div>
          ) : documents.length > 0 ? (
            <div className="approval-page__document-list">
              {documents.map((document) => {
                const selected = selectedDocumentId === document.drftDocSn
                const statusVariant = getStatusVariant(document.aprvlDocSttsCd)

                return (
                  <button
                    key={document.drftDocSn}
                    type="button"
                    className={`approval-page__document-row ${
                      selected ? 'approval-page__document-row--selected' : ''
                    }`}
                    onClick={() => setSelectedDocumentId(document.drftDocSn)}
                  >
                    <div className="approval-page__document-info">
                      <div className="approval-page__document-title-line">
                        <p className="approval-page__document-title">
                          {document.docTtl || '(제목 없음)'}
                        </p>
                        <Badge variant="outline">{document.tmplatCd || '템플릿 없음'}</Badge>
                      </div>
                      <p className="approval-page__document-summary">
                        기안자 {document.drafterEmpNm || '-'} · 결재자{' '}
                        {document.approverNames || '-'}
                      </p>
                      <div className="approval-page__document-meta">
                        <span>{formatDateTime(document.drftReqstDt)}</span>
                        {document.rtrnRsn ? <span>반려 사유: {document.rtrnRsn}</span> : null}
                      </div>
                    </div>
                    <Badge variant={statusVariant}>{getStatusLabel(document.aprvlDocSttsCd)}</Badge>
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="기안서가 없습니다."
              description="검색 조건을 바꾸거나 기안서를 새로 작성해 주세요."
            />
          )}
        </div>

        <div className="approval-page__detail-panel">
          {detailLoading ? (
            <div className="approval-page__loading">상세 정보를 불러오는 중입니다.</div>
          ) : detail ? (
            <>
              <div className="approval-page__detail-header">
                <div>
                  <div className="approval-page__detail-title-line">
                    <h2 className="approval-page__detail-title">
                      {detail.docTtl || selectedSummary?.docTtl || '(제목 없음)'}
                    </h2>
                    <Badge variant={getStatusVariant(detail.aprvlDocSttsCd)}>
                      {getStatusLabel(detail.aprvlDocSttsCd)}
                    </Badge>
                  </div>
                  <p className="approval-page__detail-subtitle">
                    {detail.drafterDeptNm || '-'} · {detail.drafterEmpNm || '-'} ·{' '}
                    {detail.drafterJobGrdNm || detail.drafterJobPstnNm || '-'}
                  </p>
                </div>
                <div className="approval-page__detail-actions">
                  {currentBox === 'sent-temporary' ? (
                    <Button size="sm" leftIcon={<Send size={15} />} onClick={handleSubmitDraft}>
                      결재 요청
                    </Button>
                  ) : null}
                  {currentBox === 'sent-progress' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<RotateCcw size={15} />}
                      onClick={handleWithdraw}
                    >
                      회수
                    </Button>
                  ) : null}
                  {currentBox === 'received-requests' ? (
                    <>
                      <Button
                        size="sm"
                        leftIcon={<CheckCircle2 size={15} />}
                        onClick={() => setActionMode('approve')}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<XCircle size={15} />}
                        onClick={() => setActionMode('reject')}
                      >
                        반려
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="approval-page__summary-grid">
                <div>
                  <span>기안 요청일</span>
                  <strong>{formatDateTime(detail.drftReqstDt)}</strong>
                </div>
                <div>
                  <span>희망 결재일</span>
                  <strong>{formatDateTime(detail.aprvlHopeDt)}</strong>
                </div>
                <div>
                  <span>완료일</span>
                  <strong>{formatDateTime(detail.aprvlCmptnDt)}</strong>
                </div>
                <div>
                  <span>템플릿</span>
                  <strong>{detail.tmplatCd || '-'}</strong>
                </div>
              </div>

              {detail.statusMessages.length > 0 ? (
                <div className="approval-page__status-messages">
                  {detail.statusMessages.map((message) => (
                    <span key={message}>{message}</span>
                  ))}
                </div>
              ) : null}

              <section className="approval-page__detail-section">
                <h3>결재선</h3>
                <div className="approval-page__step-list">
                  {detail.approvalSteps.map((step) => (
                    <div key={step.aprvlStepSn} className="approval-page__step-row">
                      <span className="approval-page__step-order">{step.aprvlOrd}</span>
                      <div>
                        <strong>{step.aprvrEmpNm}</strong>
                        <p>
                          {getStepStatusLabel(step.aprvlPrgrsCd)} ·{' '}
                          {formatDateTime(step.aprvlDt)}
                        </p>
                        {step.aprvlRsn || step.rtrnRsn ? (
                          <p>{step.aprvlRsn || step.rtrnRsn}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="approval-page__detail-section">
                <h3>결재 내용</h3>
                <article className="approval-page__content-box">
                  {detail.aprvlFullCn || '결재 내용이 없습니다.'}
                </article>
              </section>
            </>
          ) : (
            <EmptyState
              title="문서를 선택하세요."
              description="왼쪽 목록에서 기안서를 선택하면 상세 내용과 처리 버튼이 표시됩니다."
            />
          )}
        </div>
      </section>

      <DraftModal
        open={draftOpen}
        saving={actionLoading}
        form={draftForm}
        error={draftError}
        onChange={setDraftForm}
        onClose={() => {
          setDraftOpen(false)
          setDraftError('')
        }}
        onSubmit={handleSaveDraft}
      />

      <ActionModal
        open={actionMode === 'approve'}
        title="결재 승인"
        description="현재 문서를 승인합니다. 사유는 선택 입력입니다."
        loading={actionLoading}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => setActionMode(null)}
        onConfirm={handleApprove}
      />

      <ActionModal
        open={actionMode === 'reject'}
        title="결재 반려"
        description="현재 문서를 반려합니다. 반려 사유를 입력해야 합니다."
        loading={actionLoading}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => setActionMode(null)}
        onConfirm={handleReject}
      />
    </div>
  )
}
