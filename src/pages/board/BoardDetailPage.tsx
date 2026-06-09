import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  FileArchive,
  Menu,
  Megaphone,
  MessageSquare,
  Paperclip,
  Pencil,
  Send,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/button/Button'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Textarea from '../../components/common/form/textarea/Textarea'
import BoardWriteForm from './BoardWriteForm'
import { boardDetailApi } from '../../api/boardDetailApi'
import { useApi } from '../../hooks/useApi'
import type { BoardKind } from '../../types/board'
import type { BoardMutationRequest } from '../../api/boardApi'
import type { BoardResponse } from '../../types'

const boardLabelByType: Record<BoardKind, string> = {
  notice: '공지사항',
  department: '부서게시판',
  free: '자유게시판',
  anonymous: '익명게시판',
}

const boardBadgeClassByType: Record<BoardKind, string> = {
  notice: 'border-blue-200 bg-blue-50 text-blue-600',
  department: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  free: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  anonymous: 'border-violet-200 bg-violet-50 text-violet-600',
}

const getBoardTypeFromPath = (pathname: string): BoardKind => {
  if (pathname.includes('/departments') || pathname.includes('/dept/')) return 'department'
  if (pathname.includes('/free')) return 'free'
  if (pathname.includes('/anonymous') || pathname.includes('/anon')) return 'anonymous'
  return 'notice'
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getCommentCount = (detail: BoardResponse) => detail.commentList?.length ?? 0

const isCommentEnabled = (detail: BoardResponse, boardType: BoardKind) => {
  const useYn = detail.cmntUseYn?.toUpperCase()

  if (useYn === 'Y') return true
  if (useYn === 'N') return false

  return boardType !== 'notice'
}

const getDetailStateKey = (boardType: BoardKind, boardId: number, deptCd = '') =>
  `${boardType}:${deptCd}:${boardId}`

const formatBoardAuthor = (detail: BoardResponse, boardType: BoardKind) => {
  if (boardType === 'anonymous') return '익명'

  const employeeName = detail.empNm?.trim()

  if (employeeName) {
    return `${employeeName}(${detail.frstRgtrId})`
  }

  return `사원(${detail.frstRgtrId})`
}

const BoardDetailPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { boardId, deptCd } = useParams()
  const boardType = getBoardTypeFromPath(location.pathname)
  const numericBoardId = Number(boardId)
  const detailStateKey = getDetailStateKey(boardType, numericBoardId, deptCd)
  const [commentContent, setCommentContent] = useState('')
  const [editModeKey, setEditModeKey] = useState<string | null>(null)
  const [updatedDetail, setUpdatedDetail] = useState<{
    key: string
    detail: BoardResponse
  } | null>(null)

  const {
    data: fetchedDetail,
    loading,
    error,
    execute: fetchBoardDetail,
  } = useApi(boardDetailApi.getBoardDetail, { immediate: false })

  const detail = updatedDetail?.key === detailStateKey
    ? updatedDetail.detail
    : fetchedDetail
  const isEditMode = editModeKey === detailStateKey

  useEffect(() => {
    if (!Number.isFinite(numericBoardId)) return

    void fetchBoardDetail({
      boardType,
      boardId: numericBoardId,
      deptCd,
    })
  }, [boardType, deptCd, fetchBoardDetail, numericBoardId])

  const comments = useMemo(
    () => detail?.commentList ?? [],
    [detail?.commentList],
  )

  const hasAttachment = Boolean(detail?.boardAtchFileId)
  const commentsEnabled = detail ? isCommentEnabled(detail, boardType) : false
  const trimmedComment = commentContent.trim()

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleEditClick = () => {
    setEditModeKey(detailStateKey)
  }

  const handleUpdated = (request: BoardMutationRequest) => {
    setUpdatedDetail((currentDetailState) => {
      const baseDetail = currentDetailState?.key === detailStateKey
        ? currentDetailState.detail
        : fetchedDetail

      if (!baseDetail) return currentDetailState

      const nextDetail = {
        ...baseDetail,
        boardTypeCd: request.boardTypeCd,
        boardSj: request.boardSj,
        boardCn: request.boardCn,
        boardAtchFileId: request.boardAtchFileId,
        deptCd: request.deptCd,
        projId: request.projId,
        imprtntYn: request.imprtntYn,
        cmntUseYn: request.cmntUseYn,
      }

      return {
        key: detailStateKey,
        detail: nextDetail,
      }
    })
  }

  const handleDeleteClick = () => {
    window.alert('게시글 삭제 기능은 API 연결 후 사용할 수 있습니다.')
  }

  if (isEditMode && detail && Number.isFinite(numericBoardId)) {
    return (
      <BoardWriteForm
        mode="edit"
        boardId={numericBoardId}
        initialBoardType={boardType}
        departmentCode={deptCd}
        initialTitle={detail.boardSj}
        initialContent={detail.boardCn}
        initialImportantYn={detail.imprtntYn}
        initialCommentUseYn={detail.cmntUseYn}
        initialAttachmentFileId={detail.boardAtchFileId}
        onClose={() => setEditModeKey(null)}
        onUpdated={handleUpdated}
      />
    )
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-6 text-sm font-semibold text-slate-500">
        <button
          type="button"
          aria-label="게시판 메뉴"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu size={19} />
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-slate-500 transition-colors hover:text-slate-900"
        >
          게시판
        </button>
        <ChevronRight size={15} />
        <span>{boardLabelByType[boardType]}</span>
        <ChevronRight size={15} />
        <span className="text-slate-900">게시글 상세</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-7">
        <article className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          {loading && (
            <div className="flex min-h-80 items-center justify-center text-sm font-semibold text-slate-500">
              게시글을 불러오는 중입니다.
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="게시글을 불러오지 못했습니다."
              description={error.message}
              actions={
                <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>
                  목록으로
                </Button>
              }
            />
          )}

          {!loading && !error && !detail && (
            <EmptyState
              title="게시글 정보가 없습니다."
              actions={
                <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>
                  목록으로
                </Button>
              }
            />
          )}

          {!loading && !error && detail && (
            <>
              <div className="border-b border-slate-200 pb-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold ${boardBadgeClassByType[boardType]}`}
                    >
                      {boardLabelByType[boardType]}
                    </span>
                    <h1 className="min-w-0 break-words text-2xl font-bold text-slate-950">
                      {detail.boardSj}
                    </h1>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-md px-3"
                      leftIcon={<Pencil size={15} />}
                      onClick={handleEditClick}
                    >
                      수정
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="h-9 rounded-md px-3"
                      leftIcon={<Trash2 size={15} />}
                      onClick={handleDeleteClick}
                    >
                      삭제
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
                  <span className="font-bold text-slate-800">
                    {formatBoardAuthor(detail, boardType)}
                  </span>
                  {detail.deptCd && <span>부서 {detail.deptCd}</span>}
                  <span>{formatDateTime(detail.frstRegDt)}</span>
                  <span>조회 {detail.viewCnt ?? 0}</span>
                </div>
              </div>

              <div className="whitespace-pre-wrap break-words border-b border-slate-200 py-7 text-[15px] font-medium leading-7 text-slate-800">
                {detail.boardCn}
              </div>

              <section className="border-b border-slate-200 py-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Paperclip size={16} />
                  첨부파일 {hasAttachment ? 1 : 0}
                </h2>

                {hasAttachment ? (
                  <div className="flex h-11 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-500 text-white">
                      <FileArchive size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      첨부파일 ID {detail.boardAtchFileId}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-11 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-400">
                    첨부된 파일이 없습니다.
                  </div>
                )}
              </section>

              {commentsEnabled ? (
                <section className="pt-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
                    <button type="button" className="inline-flex items-center gap-2 text-blue-600">
                      <ThumbsUp size={17} />
                      좋아요 {detail.likeCnt ?? 0}
                    </button>
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <MessageSquare size={17} />
                      댓글 {getCommentCount(detail)}
                    </span>
                  </div>

                  <form
                    onSubmit={handleCommentSubmit}
                    className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <Textarea
                      value={commentContent}
                      onChange={(event) => setCommentContent(event.target.value)}
                      maxLength={500}
                      placeholder="댓글을 입력하세요."
                      className="min-h-24 resize-none rounded-lg"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-400">
                        {commentContent.length}/500
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!trimmedComment}
                        leftIcon={<Send size={15} />}
                      >
                        등록
                      </Button>
                    </div>
                  </form>

                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                    {comments.length > 0 ? (
                      comments.map((comment, index) => (
                        <div
                          key={comment.commentId ?? index}
                          className={`flex gap-3 px-4 py-4 ${
                            comment.commentDepth ? 'bg-slate-50 pl-10' : ''
                          }`}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                            {boardType === 'anonymous'
                              ? '익'
                              : String(comment.wrterEmpId ?? '?').slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-bold text-slate-800">
                                {boardType === 'anonymous'
                                  ? '익명'
                                  : `사원(${comment.wrterEmpId ?? '-'})`}
                              </span>
                              {Boolean(comment.commentDepth) && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                                  답글
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">
                              {comment.commentCn}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs font-medium text-slate-500">
                              <span>{formatDateTime(comment.wrteDt)}</span>
                              <button type="button" className="font-semibold text-slate-600 hover:text-blue-600">
                                답글
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                        등록된 댓글이 없습니다.
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section className="pt-5">
                  <div className="flex h-16 items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-slate-700">
                    <Megaphone size={18} className="text-slate-700" />
                    이 게시글은 댓글 기능을 제공하지 않습니다.
                  </div>
                </section>
              )}
            </>
          )}
        </article>
      </div>
    </section>
  )
}

export default BoardDetailPage
