import {
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import ApprovalDraftDrawer, {
  type ApprovalDraftFormValues,
} from './ApprovalDraftDrawer'

type ApprovalBox =
  | 'sent-progress'
  | 'sent-completed'
  | 'sent-rejected'
  | 'received-requests'
  | 'received-history'
  | 'received-completed'

interface ApprovalDocument {
  id: number
  title: string
  documentType: string
  requester: string
  approver: string
  status: '진행 중' | '완료' | '반려' | '결재 요청' | '결재 처리'
  submittedAt: string
  dueDate?: string
  summary: string
  box: ApprovalBox
}

const pageMeta: Record<
  ApprovalBox,
  {
    title: string
    description: string
    icon: typeof FileText
    badgeVariant: 'primary' | 'success' | 'danger' | 'warning' | 'outline'
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
  'received-requests': {
    title: '결재 요청 목록',
    description: '내 결재 처리가 필요한 수신 문서입니다.',
    icon: FileText,
    badgeVariant: 'primary',
  },
  'received-history': {
    title: '결재 내역',
    description: '내가 결재자로 처리한 문서 이력입니다.',
    icon: RotateCcw,
    badgeVariant: 'outline',
  },
  'received-completed': {
    title: '완료된 기안서 목록',
    description: '수신함에서 확인할 수 있는 결재 완료 문서입니다.',
    icon: CheckCircle2,
    badgeVariant: 'success',
  },
}

const routeToBox = (folder?: string, status?: string): ApprovalBox | null => {
  if (folder === 'sent' && status === 'progress') return 'sent-progress'
  if (folder === 'sent' && status === 'completed') return 'sent-completed'
  if (folder === 'sent' && status === 'rejected') return 'sent-rejected'
  if (folder === 'received' && status === 'requests') return 'received-requests'
  if (folder === 'received' && status === 'history') return 'received-history'
  if (folder === 'received' && status === 'completed') return 'received-completed'

  return null
}

const initialDocuments: ApprovalDocument[] = [
  {
    id: 1004,
    title: '영업팀 외근 교통비 정산',
    documentType: '지출결의',
    requester: '박지훈',
    approver: '김민수',
    status: '진행 중',
    submittedAt: '2026-06-05 09:20',
    dueDate: '2026-06-07',
    summary: '6월 1주차 고객사 방문 교통비 정산 요청입니다.',
    box: 'sent-progress',
  },
  {
    id: 1003,
    title: '신규 협업툴 도입 검토',
    documentType: '업무기안',
    requester: '박지훈',
    approver: '이서연',
    status: '완료',
    submittedAt: '2026-06-03 14:10',
    summary: '부서 간 업무 공유를 위한 협업툴 도입 검토 건입니다.',
    box: 'sent-completed',
  },
  {
    id: 1002,
    title: '행사 홍보물 추가 제작 요청',
    documentType: '구매요청',
    requester: '박지훈',
    approver: '최현우',
    status: '반려',
    submittedAt: '2026-06-02 11:40',
    summary: '예산 재검토 필요 의견으로 반려된 구매 요청입니다.',
    box: 'sent-rejected',
  },
  {
    id: 1001,
    title: '개발 장비 구매 승인 요청',
    documentType: '구매요청',
    requester: '정하린',
    approver: '박지훈',
    status: '결재 요청',
    submittedAt: '2026-06-06 10:05',
    dueDate: '2026-06-08',
    summary: '신규 입사자 지급용 노트북 구매 승인 요청입니다.',
    box: 'received-requests',
  },
  {
    id: 1000,
    title: '반기 워크숍 장소 예약',
    documentType: '업무기안',
    requester: '오세진',
    approver: '박지훈',
    status: '결재 처리',
    submittedAt: '2026-05-31 16:35',
    summary: '상반기 워크숍 장소 예약 품의에 대한 결재 이력입니다.',
    box: 'received-history',
  },
  {
    id: 999,
    title: '연차 휴가 신청',
    documentType: '휴가신청',
    requester: '윤다은',
    approver: '박지훈',
    status: '완료',
    submittedAt: '2026-05-29 13:45',
    summary: '6월 개인 연차 휴가 신청 완료 문서입니다.',
    box: 'received-completed',
  },
]

const formatDateTime = () =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

const ApprovalPage = () => {
  const { folder, status } = useParams<{ folder?: string; status?: string }>()
  const navigate = useNavigate()
  const currentBox = routeToBox(folder, status)
  const [documents, setDocuments] = useState(initialDocuments)
  const [keyword, setKeyword] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const openDraftDrawer = () => setDrawerOpen(true)
    window.addEventListener('approval:open-draft', openDraftDrawer)

    return () => {
      window.removeEventListener('approval:open-draft', openDraftDrawer)
    }
  }, [])

  const visibleDocuments = useMemo(() => {
    if (!currentBox) return []

    const normalizedKeyword = keyword.trim().toLowerCase()

    return documents.filter((document) => {
      const boxMatched = document.box === currentBox

      if (!normalizedKeyword) return boxMatched

      return (
        boxMatched &&
        [document.title, document.documentType, document.requester, document.approver]
          .join(' ')
          .toLowerCase()
          .includes(normalizedKeyword)
      )
    })
  }, [currentBox, documents, keyword])

  const handleDraftSubmit = (values: ApprovalDraftFormValues) => {
    const nextDocument: ApprovalDocument = {
      id: Date.now(),
      title: values.title,
      documentType: values.documentType,
      requester: '나',
      approver: values.approver,
      status: '진행 중',
      submittedAt: formatDateTime(),
      dueDate: values.dueDate || undefined,
      summary: values.content,
      box: 'sent-progress',
    }

    setDocuments((current) => [nextDocument, ...current])
    setDrawerOpen(false)
    navigate('/approval/sent/progress')
  }

  const meta = currentBox ? pageMeta[currentBox] : null
  const HeaderIcon = meta?.icon

  return (
    <div className="flex h-full min-h-0">
      <div className="min-h-0 min-w-0 flex-1">
        {meta && HeaderIcon ? (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <HeaderIcon size={21} />
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-black tracking-tight text-slate-950">
                      {meta.title}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {meta.description}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setDrawerOpen(true)}>기안서 작성</Button>
              </div>

              <div className="mt-4 max-w-xl">
                <SearchInput
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="제목, 문서 유형, 기안자, 결재자 검색"
                />
              </div>
            </section>

            <section className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {visibleDocuments.length > 0 ? (
                <div className="h-full overflow-y-auto">
                  <div className="grid grid-cols-[minmax(0,1.3fr)_140px_120px_130px_120px] border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-400">
                    <span>문서</span>
                    <span>기안자</span>
                    <span>결재자</span>
                    <span>상신일</span>
                    <span>상태</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {visibleDocuments.map((document) => (
                      <article
                        key={document.id}
                        className="grid grid-cols-[minmax(0,1.3fr)_140px_120px_130px_120px] items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-black text-slate-950">
                              {document.title}
                            </p>
                            <Badge variant="outline">{document.documentType}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                            {document.summary}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                          {document.requester}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {document.approver}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {document.submittedAt}
                        </span>
                        <Badge variant={meta.badgeVariant}>{document.status}</Badge>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="기안서가 없습니다."
                  description="검색 조건을 바꾸거나 기안서를 새로 작성해 주세요."
                />
              )}
            </section>
          </div>
        ) : null}
      </div>

      <ApprovalDraftDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleDraftSubmit}
      />
    </div>
  )
}

export default ApprovalPage
