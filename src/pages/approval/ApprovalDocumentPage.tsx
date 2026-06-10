import {
  CheckCircle2,
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
import { useNavigate } from 'react-router-dom'
import { approvalApi, type ApprovalPageParams } from '../../api/approvalApi'
import type { PageInfo } from '../../api/axiosInstance'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import { useToast } from '../../components/common/toast/useToast'
import type {
  ApprovalActionRequestDTO,
  ApprovalDocumentDetailResponse,
  ApprovalDraftSummaryResponse,
} from '../../types/approval'
import {
  PAGE_SIZE,
} from './approval.types'
import {
  formatDateTime,
  getApiErrorMessage,
  getListRequest,
  getStatusLabel,
  getStatusVariant,
  getStepStatusLabel,
  pageMeta,
  routeToBox,
} from './approval.utils'
import ApprovalActionModal from './ApprovalActionModal'
import ApprovalDraftModal from './ApprovalDraftModal'
import ApprovalHtmlDocument from './ApprovalHtmlDocument'
import ApprovalPagination from './ApprovalPagination'
import { useDraftModal } from './useDraftModal'

type Props = {
  folder?: string
  status?: string
}

export default function ApprovalDocumentPage({ folder, status }: Props) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const currentBox = routeToBox(folder, status)

  const [documents, setDocuments] = useState<ApprovalDraftSummaryResponse[]>([])
  const [pagination, setPagination] = useState<PageInfo | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)
  const [detail, setDetail] = useState<ApprovalDocumentDetailResponse | null>(null)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = pagination?.totalPages ?? 0
  const meta = currentBox ? pageMeta[currentBox] : pageMeta['sent-progress']
  const HeaderIcon = meta.icon

  const loadList = useCallback(async () => {
    if (!currentBox) return
    setListLoading(true)
    setErrorMessage('')
    try {
      const params: ApprovalPageParams = { page, size: PAGE_SIZE }
      if (keyword) params.keyword = keyword
      const response = await getListRequest(currentBox, params)
      const rawData = response.data.data
      const nextDocuments: ApprovalDraftSummaryResponse[] = Array.isArray(rawData)
        ? rawData
        : (rawData as unknown as { content?: ApprovalDraftSummaryResponse[] })?.content ?? []
      const nextPagination = response.data.pagination ?? null
      setDocuments(nextDocuments)
      setPagination(nextPagination)
      setSelectedDocumentId((current) => {
        if (current && nextDocuments.some((d) => d.drftDocSn === current)) return current
        return nextDocuments[0]?.drftDocSn ?? null
      })
    } catch (error) {
      setDocuments([])
      setPagination(null)
      setSelectedDocumentId(null)
      setErrorMessage(getApiErrorMessage(error, '결재 문서 목록을 불러오지 못했습니다.'))
    } finally {
      setListLoading(false)
    }
  }, [currentBox, keyword, page])

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

  const {
    draftOpen,
    setDraftOpen,
    draftForm,
    setDraftForm,
    draftApprovers,
    setDraftApprovers,
    draftError,
    draftSaving,
    handleSaveDraft,
    closeDraft,
  } = useDraftModal(loadList)

  useEffect(() => {
    if (!currentBox) {
      navigate('/approval/sent/progress', { replace: true })
    }
  }, [currentBox, navigate])

  // currentBox 변경 시 관련 state 초기화 — render phase에서 처리하여 경고 방지
  const [prevBox, setPrevBox] = useState(currentBox)
  if (prevBox !== currentBox) {
    setPrevBox(currentBox)
    setSelectedDocumentId(null)
    setDetail(null)
    setKeywordInput('')
    setKeyword('')
    setPage(0)
    setDocuments([])
    setPagination(null)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList()
  }, [loadList])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail()
  }, [loadDetail])

  const selectedSummary = useMemo(
    () => documents.find((d) => d.drftDocSn === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  )

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setKeyword(keywordInput.trim())
  }

  const handlePageChange = (next: number) => {
    setPage(next)
    setSelectedDocumentId(null)
    setDetail(null)
  }


  const mutateAndReload = async (action: () => Promise<unknown>, successTitle: string) => {
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
    const request: ApprovalActionRequestDTO = reason.trim() ? { reason: reason.trim() } : {}
    void mutateAndReload(async () => {
      await approvalApi.canApprove(selectedDocumentId)
      await approvalApi.approveApproval(selectedDocumentId, request)
    }, '결재를 승인했습니다.')
  }

  const handleReject = () => {
    if (!selectedDocumentId) return
    if (!reason.trim()) {
      showToast({ title: '반려 사유를 입력하세요.', variant: 'danger' })
      return
    }
    void mutateAndReload(async () => {
      await approvalApi.canReject(selectedDocumentId)
      await approvalApi.rejectApproval(selectedDocumentId, { reason: reason.trim() })
    }, '결재를 반려했습니다.')
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

      {errorMessage ? <div className="approval-page__error">{errorMessage}</div> : null}

      <section className="approval-page__workspace">
        <div className="approval-page__list-panel">
          {listLoading ? (
            <div className="approval-page__loading">결재 문서를 불러오는 중입니다.</div>
          ) : documents.length > 0 ? (
            <>
              <div className="approval-page__document-list">
                {documents.map((document) => {
                  const selected = selectedDocumentId === document.drftDocSn
                  const statusVariant = getStatusVariant(document.aprvlDocSttsCd)
                  return (
                    <button
                      key={document.drftDocSn}
                      type="button"
                      className={`approval-page__document-row${selected ? ' approval-page__document-row--selected' : ''}`}
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
                          {document.rtrnRsn ? (
                            <span>반려 사유: {document.rtrnRsn}</span>
                          ) : null}
                        </div>
                      </div>
                      <Badge variant={statusVariant}>
                        {getStatusLabel(document.aprvlDocSttsCd)}
                      </Badge>
                    </button>
                  )
                })}
              </div>
              <ApprovalPagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
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
                <ApprovalHtmlDocument html={detail.aprvlFullCn} />
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

      <ApprovalDraftModal
        open={draftOpen}
        saving={draftSaving}
        form={draftForm}
        approvers={draftApprovers}
        error={draftError}
        onChange={setDraftForm}
        onApproversChange={setDraftApprovers}
        onClose={closeDraft}
        onSubmit={handleSaveDraft}
      />

      <ApprovalActionModal
        open={actionMode === 'approve'}
        title="결재 승인"
        description="현재 문서를 승인합니다. 사유는 선택 입력입니다."
        loading={actionLoading}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => setActionMode(null)}
        onConfirm={handleApprove}
      />

      <ApprovalActionModal
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
