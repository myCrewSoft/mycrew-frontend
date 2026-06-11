import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  FileArchive,
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
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Textarea from '../../components/common/form/textarea/Textarea'
import BoardWriteForm from './BoardWriteForm'
import BoardAttachmentImage from './BoardAttachmentImage'
import { Viewer } from '@toast-ui/react-editor'
import { boardApi, type BoardMutationRequest } from '../../api/boardApi'
import {
  boardDetailApi,
  type BoardCommentMutationRequest,
  type BoardLikeResponse,
} from '../../api/boardDetailApi'
import { profileApi } from '../../api/profileApi'
import { useApi } from '../../hooks/useApi'
import type { BoardKind } from '../../types/board'
import type { BoardCommentUpdateRequest, BoardResponse } from '../../types'

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

const getBoardTypeFromCode = (boardTypeCd?: string, fallback: BoardKind = 'notice'): BoardKind => {
  const normalizedCode = boardTypeCd?.trim().toUpperCase()

  if (normalizedCode === 'DEPT') return 'department'
  if (normalizedCode === 'FREE') return 'free'
  if (normalizedCode === 'ANON') return 'anonymous'
  if (normalizedCode === 'NOTICE') return 'notice'

  return fallback
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

const isImportantBoard = (detail: BoardResponse) =>
  detail.imprtntYn?.trim().toUpperCase() === 'Y'

const getCurrentEmployeeId = () => {
  const employeeId = Number(localStorage.getItem('empId'))

  return Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null
}

const formatCommentAuthor = (
  writerEmployeeId: number | undefined,
  boardType: BoardKind,
  currentEmployeeId: number | null,
  currentEmployeeName: string,
) => {
  if (boardType === 'anonymous') return '익명'

  if (
    writerEmployeeId === currentEmployeeId &&
    currentEmployeeName
  ) {
    return `${currentEmployeeName}(${writerEmployeeId})`
  }

  return `사원(${writerEmployeeId ?? '-'})`
}

const parseBoardLikeState = (
  response: BoardLikeResponse,
  fallback: { isLiked: boolean; likeCnt: number },
) => {
  const likedValue = response.isLiked ?? response.liked
  const countValue = response.likeCnt ?? response.likeCount ?? response.count

  return {
    isLiked: typeof likedValue === 'boolean'
      ? likedValue
      : fallback.isLiked,
    likeCnt: typeof countValue === 'number' && Number.isFinite(countValue)
      ? countValue
      : fallback.likeCnt,
  }
}

const getBoardListPath = (boardType: BoardKind, deptCd?: string) => {
  if (boardType === 'department') {
    return deptCd
      ? `/boards/dept/${encodeURIComponent(deptCd)}`
      : '/boards/departments'
  }

  if (boardType === 'free') return '/boards/free'
  if (boardType === 'anonymous') return '/boards/anonymous'

  return '/boards/notices'
}

const BoardDetailPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { boardId, deptCd } = useParams()
  const boardType = getBoardTypeFromPath(location.pathname)
  const numericBoardId = Number(boardId)
  const detailStateKey = getDetailStateKey(boardType, numericBoardId, deptCd)
  const [commentContent, setCommentContent] = useState('')
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const [likeState, setLikeState] = useState<{
    key: string
    isLiked: boolean
    likeCnt: number
  } | null>(null)
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

  const {
    loading: deleting,
    execute: deleteBoard,
  } = useApi<null, [number]>(boardApi.deleteBoard, { immediate: false })

  const {
    loading: creatingComment,
    error: commentError,
    execute: createBoardComment,
  } = useApi<number, [BoardCommentMutationRequest]>(
    boardDetailApi.createBoardComment,
    { immediate: false },
  )

  const {
    loading: updatingComment,
    error: updateCommentError,
    execute: updateBoardComment,
  } = useApi<number, [BoardCommentUpdateRequest]>(
    boardDetailApi.updateBoardComment,
    { immediate: false },
  )

  const {
    loading: deletingComment,
    execute: deleteBoardComment,
  } = useApi<string, [number]>(
    boardDetailApi.deleteBoardComment,
    { immediate: false },
  )

  const {
    execute: fetchBoardLike,
  } = useApi<BoardLikeResponse, [number, number]>(
    boardDetailApi.getBoardLike,
    { immediate: false },
  )

  const {
    loading: togglingLike,
    execute: toggleBoardLike,
  } = useApi<boolean, [number, number]>(
    boardDetailApi.toggleBoardLike,
    { immediate: false },
  )

  const {
    data: currentProfile,
  } = useApi(profileApi.getMyProfile)

  const detail = updatedDetail?.key === detailStateKey
    ? updatedDetail.detail
    : fetchedDetail
  const isEditMode = editModeKey === detailStateKey
  const currentEmployeeId = getCurrentEmployeeId()
  const currentEmployeeName = currentProfile?.empNm?.trim() ?? ''
  const canDeletePost = detail ? currentEmployeeId === detail.frstRgtrId : false
  const currentLikeState = likeState?.key === detailStateKey
    ? likeState
    : {
        key: detailStateKey,
        isLiked: detail?.isLiked ?? false,
        likeCnt: detail?.likeCnt ?? 0,
      }
  const boardListPath = `${getBoardListPath(boardType, deptCd)}${location.search}`

  const navigateToBoardList = () => {
    navigate(boardListPath)
  }

  useEffect(() => {
    if (!Number.isFinite(numericBoardId)) return

    void fetchBoardDetail({
      boardType,
      boardId: numericBoardId,
      deptCd,
    })
  }, [boardType, deptCd, fetchBoardDetail, numericBoardId])

  useEffect(() => {
    if (!Number.isFinite(numericBoardId) || !currentEmployeeId) return

    let active = true

    void fetchBoardLike(numericBoardId, currentEmployeeId)
      .then((response) => {
        if (!active) return

        const nextLikeState = parseBoardLikeState(response.data ?? {}, {
          isLiked: false,
          likeCnt: 0,
        })

        setLikeState({
          key: detailStateKey,
          ...nextLikeState,
        })
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [
    currentEmployeeId,
    detailStateKey,
    fetchBoardLike,
    numericBoardId,
  ])

  const comments = useMemo(
    () => detail?.commentList ?? [],
    [detail?.commentList],
  )

  const hasAttachment = Boolean(detail?.boardAtchFileId)
  const commentsEnabled = detail ? isCommentEnabled(detail, boardType) : false
  const trimmedComment = commentContent.trim()
  const trimmedReply = replyContent.trim()
  const trimmedEditingComment = editingCommentContent.trim()

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !detail ||
      !commentsEnabled ||
      !trimmedComment ||
      !Number.isFinite(numericBoardId)
    ) {
      return
    }

    try {
      const response = await createBoardComment({
        boardId: numericBoardId,
        commentCn: trimmedComment,
        commentPrtId: null,
        commentDepth: 0,
        commentOrder: 1,
      })
      const createdCommentId = response.data

      setUpdatedDetail((currentDetailState) => {
        const baseDetail = currentDetailState?.key === detailStateKey
          ? currentDetailState.detail
          : detail

        return {
          key: detailStateKey,
          detail: {
            ...baseDetail,
            commentList: [
              ...(baseDetail.commentList ?? []),
              {
                commentId: createdCommentId,
                boardId: numericBoardId,
                commentCn: trimmedComment,
                wrterEmpId: currentEmployeeId ?? undefined,
                wrteDt: new Date().toISOString(),
                commentDepth: 0,
                commentOrder: (baseDetail.commentList?.length ?? 0) + 1,
              },
            ],
          },
        }
      })
      setCommentContent('')
    } catch {
      // useApi의 error 상태를 입력 영역 아래에 표시합니다.
    }
  }

  const handleReplyToggle = (commentId?: number) => {
    if (!commentId) return

    if (replyTargetId === commentId) {
      setReplyTargetId(null)
      setReplyContent('')
      return
    }

    setEditingCommentId(null)
    setEditingCommentContent('')
    setReplyTargetId(commentId)
    setReplyContent('')
  }

  const handleReplySubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    parentCommentId: number,
  ) => {
    event.preventDefault()

    if (
      !detail ||
      !commentsEnabled ||
      !trimmedReply ||
      !Number.isFinite(numericBoardId)
    ) {
      return
    }

    const siblingReplies = comments.filter(
      (comment) => comment.commentPrtId === parentCommentId,
    )
    const nextReplyOrder = siblingReplies.length + 1

    try {
      const response = await createBoardComment({
        boardId: numericBoardId,
        commentCn: trimmedReply,
        commentPrtId: parentCommentId,
        commentDepth: 1,
        commentOrder: nextReplyOrder,
      })
      const createdCommentId = response.data

      setUpdatedDetail((currentDetailState) => {
        const baseDetail = currentDetailState?.key === detailStateKey
          ? currentDetailState.detail
          : detail
        const nextCommentList = [...(baseDetail.commentList ?? [])]
        const parentIndex = nextCommentList.findIndex(
          (comment) => comment.commentId === parentCommentId,
        )
        let insertIndex = parentIndex + 1

        while (
          insertIndex < nextCommentList.length &&
          nextCommentList[insertIndex].commentPrtId === parentCommentId
        ) {
          insertIndex += 1
        }

        nextCommentList.splice(insertIndex, 0, {
          commentId: createdCommentId,
          boardId: numericBoardId,
          commentCn: trimmedReply,
          wrterEmpId: currentEmployeeId ?? undefined,
          wrteDt: new Date().toISOString(),
          commentPrtId: parentCommentId,
          commentDepth: 1,
          commentOrder: nextReplyOrder,
        })

        return {
          key: detailStateKey,
          detail: {
            ...baseDetail,
            commentList: nextCommentList,
          },
        }
      })
      setReplyTargetId(null)
      setReplyContent('')
    } catch {
      // useApi의 error 상태를 답글 입력 영역 아래에 표시합니다.
    }
  }

  const handleCommentEditToggle = (
    commentId: number | undefined,
    commentContentValue: string | undefined,
  ) => {
    if (!commentId) return

    if (editingCommentId === commentId) {
      setEditingCommentId(null)
      setEditingCommentContent('')
      return
    }

    setReplyTargetId(null)
    setReplyContent('')
    setEditingCommentId(commentId)
    setEditingCommentContent(commentContentValue ?? '')
  }

  const handleCommentUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
    commentId: number,
  ) => {
    event.preventDefault()

    if (!trimmedEditingComment) return

    try {
      await updateBoardComment({
        commentId,
        commentCn: trimmedEditingComment,
      })

      setUpdatedDetail((currentDetailState) => {
        const baseDetail = currentDetailState?.key === detailStateKey
          ? currentDetailState.detail
          : detail

        if (!baseDetail) return currentDetailState

        return {
          key: detailStateKey,
          detail: {
            ...baseDetail,
            commentList: (baseDetail.commentList ?? []).map((comment) =>
              comment.commentId === commentId
                ? {
                    ...comment,
                    commentCn: trimmedEditingComment,
                  }
                : comment,
            ),
          },
        }
      })
      setEditingCommentId(null)
      setEditingCommentContent('')
    } catch {
      // useApi의 error 상태를 댓글 수정 영역 아래에 표시합니다.
    }
  }

  const handleCommentDelete = async (
    commentId: number | undefined,
    isReply: boolean,
  ) => {
    if (!commentId || deletingComment) return

    const confirmMessage = isReply
      ? '이 답글을 삭제할까요?'
      : '이 댓글을 삭제할까요? 연결된 답글도 함께 삭제될 수 있습니다.'

    if (!window.confirm(confirmMessage)) return

    setDeletingCommentId(commentId)

    try {
      await deleteBoardComment(commentId)

      setUpdatedDetail((currentDetailState) => {
        const baseDetail = currentDetailState?.key === detailStateKey
          ? currentDetailState.detail
          : detail

        if (!baseDetail) return currentDetailState

        return {
          key: detailStateKey,
          detail: {
            ...baseDetail,
            commentList: (baseDetail.commentList ?? []).filter((comment) =>
              isReply
                ? comment.commentId !== commentId
                : comment.commentId !== commentId &&
                  comment.commentPrtId !== commentId,
            ),
          },
        }
      })

      if (editingCommentId === commentId) {
        setEditingCommentId(null)
        setEditingCommentContent('')
      }

      if (replyTargetId === commentId) {
        setReplyTargetId(null)
        setReplyContent('')
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : '댓글 삭제에 실패했습니다.'

      window.alert(message)
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleLikeToggle = async () => {
    if (
      !currentEmployeeId ||
      !Number.isFinite(numericBoardId) ||
      togglingLike
    ) {
      return
    }

    try {
      const toggleResponse = await toggleBoardLike(
        numericBoardId,
        currentEmployeeId,
      )
      const nextLiked = toggleResponse.data ?? !currentLikeState.isLiked
      const fallbackLikeState = {
        isLiked: nextLiked,
        likeCnt: Math.max(
          0,
          currentLikeState.likeCnt + (nextLiked ? 1 : -1),
        ),
      }

      try {
        const likeResponse = await fetchBoardLike(
          numericBoardId,
          currentEmployeeId,
        )
        const nextLikeState = parseBoardLikeState(
          likeResponse.data ?? {},
          fallbackLikeState,
        )

        setLikeState({
          key: detailStateKey,
          ...nextLikeState,
        })
      } catch {
        setLikeState({
          key: detailStateKey,
          ...fallbackLikeState,
        })
      }
    } catch (likeError) {
      const message = likeError instanceof Error
        ? likeError.message
        : '좋아요 처리에 실패했습니다.'

      window.alert(message)
    }
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

  const handleDeleteClick = async () => {
    if (!detail || !Number.isFinite(numericBoardId)) return

    if (!canDeletePost) {
      window.alert('본인이 작성한 게시글만 삭제할 수 있습니다.')
      return
    }

    if (!window.confirm('게시글을 삭제할까요?')) return

    try {
      await deleteBoard(numericBoardId)
      navigate(getBoardListPath(boardType, deptCd), { replace: true })
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : '게시글 삭제에 실패했습니다.'

      window.alert(message)
    }
  }

  if (isEditMode && detail && Number.isFinite(numericBoardId)) {
    const detailBoardType = getBoardTypeFromCode(detail.boardTypeCd, boardType)
    const detailDepartmentCode = detail.deptCd?.trim() || deptCd

    return (
      <BoardWriteForm
        mode="edit"
        boardId={numericBoardId}
        initialBoardType={detailBoardType}
        initialBoardTypeCd={detail.boardTypeCd}
        departmentCode={detailDepartmentCode}
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
          aria-label="목록으로 돌아가기"
          title="목록으로 돌아가기"
          onClick={navigateToBoardList}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft size={19} />
        </button>
        <button
          type="button"
          onClick={navigateToBoardList}
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
                <Button size="sm" variant="secondary" onClick={navigateToBoardList}>
                  목록으로
                </Button>
              }
            />
          )}

          {!loading && !error && !detail && (
            <EmptyState
              title="게시글 정보가 없습니다."
              actions={
                <Button size="sm" variant="secondary" onClick={navigateToBoardList}>
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
                    {isImportantBoard(detail) && (
                      <Badge variant="warning" size="sm" className="shrink-0 rounded-md">
                        중요
                      </Badge>
                    )}
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
                    {canDeletePost && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="h-9 rounded-md px-3"
                        leftIcon={<Trash2 size={15} />}
                        loading={deleting}
                        onClick={handleDeleteClick}
                      >
                        삭제
                      </Button>
                    )}
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

              <div className="break-words pb-3 pt-7 text-[15px] font-medium leading-7 text-slate-800">
                <Viewer initialValue={detail.boardCn ?? ''} />
              </div>

              <BoardAttachmentImage
                attachmentFileId={detail.boardAtchFileId}
                alt={`${detail.boardSj} 첨부 이미지`}
              />

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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 text-sm font-bold">
                <button
                  type="button"
                  aria-pressed={currentLikeState.isLiked}
                  disabled={togglingLike}
                  onClick={handleLikeToggle}
                  className={`inline-flex items-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    currentLikeState.isLiked
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-blue-600'
                  }`}
                >
                  <ThumbsUp size={17} />
                  좋아요 {currentLikeState.likeCnt}
                </button>
                {commentsEnabled && (
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <MessageSquare size={17} />
                    댓글 {getCommentCount(detail)}
                  </span>
                )}
              </div>

              {commentsEnabled ? (
                <section className="pt-5">
                  <form
                    onSubmit={handleCommentSubmit}
                    className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <Textarea
                      value={commentContent}
                      onChange={(event) => setCommentContent(event.target.value)}
                      maxLength={1000}
                      placeholder="댓글을 입력하세요."
                      className="min-h-24 resize-none rounded-lg"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-400">
                        {commentContent.length}/1000
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        loading={creatingComment}
                        disabled={!trimmedComment}
                        leftIcon={<Send size={15} />}
                      >
                        등록
                      </Button>
                    </div>
                    {commentError && (
                      <p className="mt-2 text-sm font-semibold text-red-500">
                        {commentError.message}
                      </p>
                    )}
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
                              : comment.wrterEmpId === currentEmployeeId &&
                                  currentEmployeeName
                                ? currentEmployeeName.slice(0, 1)
                                : String(comment.wrterEmpId ?? '?').slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-bold text-slate-800">
                                {formatCommentAuthor(
                                  comment.wrterEmpId,
                                  boardType,
                                  currentEmployeeId,
                                  currentEmployeeName,
                                )}
                              </span>
                              {Boolean(comment.commentDepth) && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                                  답글
                                </span>
                              )}
                            </div>
                            {editingCommentId === comment.commentId &&
                            comment.commentId ? (
                              <form
                                onSubmit={(event) =>
                                  handleCommentUpdate(event, comment.commentId as number)
                                }
                                className="mt-2 rounded-md border border-slate-200 bg-white p-3"
                              >
                                <Textarea
                                  value={editingCommentContent}
                                  onChange={(event) =>
                                    setEditingCommentContent(event.target.value)
                                  }
                                  maxLength={1000}
                                  autoFocus
                                  placeholder="댓글을 수정하세요."
                                  className="min-h-20 resize-none rounded-md"
                                />
                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <span className="text-xs font-medium text-slate-400">
                                    {editingCommentContent.length}/1000
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        handleCommentEditToggle(
                                          comment.commentId,
                                          comment.commentCn,
                                        )
                                      }
                                    >
                                      취소
                                    </Button>
                                    <Button
                                      type="submit"
                                      size="sm"
                                      loading={updatingComment}
                                      disabled={!trimmedEditingComment}
                                    >
                                      수정 완료
                                    </Button>
                                  </div>
                                </div>
                                {updateCommentError && (
                                  <p className="mt-2 text-sm font-semibold text-red-500">
                                    {updateCommentError.message}
                                  </p>
                                )}
                              </form>
                            ) : (
                              <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">
                                {comment.commentCn}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-xs font-medium text-slate-500">
                              <span>{formatDateTime(comment.wrteDt)}</span>
                              {!comment.commentDepth &&
                                editingCommentId !== comment.commentId && (
                                <button
                                  type="button"
                                  className="font-semibold text-slate-600 hover:text-blue-600"
                                  onClick={() => handleReplyToggle(comment.commentId)}
                                >
                                  {replyTargetId === comment.commentId ? '취소' : '답글'}
                                </button>
                              )}
                              {comment.wrterEmpId === currentEmployeeId &&
                                editingCommentId !== comment.commentId && (
                                  <>
                                    <button
                                      type="button"
                                      className="font-semibold text-slate-600 hover:text-blue-600"
                                      onClick={() =>
                                        handleCommentEditToggle(
                                          comment.commentId,
                                          comment.commentCn,
                                        )
                                      }
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                      disabled={deletingComment}
                                      onClick={() =>
                                        handleCommentDelete(
                                          comment.commentId,
                                          Boolean(comment.commentDepth),
                                        )
                                      }
                                    >
                                      <Trash2 size={12} />
                                      {deletingCommentId === comment.commentId
                                        ? '삭제 중'
                                        : '삭제'}
                                    </button>
                                  </>
                                )}
                            </div>
                            {!comment.commentDepth &&
                              replyTargetId === comment.commentId &&
                              comment.commentId && (
                                <form
                                  onSubmit={(event) =>
                                    handleReplySubmit(event, comment.commentId as number)
                                  }
                                  className="mt-3 rounded-md border border-slate-200 bg-white p-3"
                                >
                                  <Textarea
                                    value={replyContent}
                                    onChange={(event) => setReplyContent(event.target.value)}
                                    maxLength={1000}
                                    autoFocus
                                    placeholder="답글을 입력하세요."
                                    className="min-h-20 resize-none rounded-md"
                                  />
                                  <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-xs font-medium text-slate-400">
                                      {replyContent.length}/1000
                                    </span>
                                    <Button
                                      type="submit"
                                      size="sm"
                                      loading={creatingComment}
                                      disabled={!trimmedReply}
                                      leftIcon={<Send size={14} />}
                                    >
                                      답글 등록
                                    </Button>
                                  </div>
                                  {commentError && (
                                    <p className="mt-2 text-sm font-semibold text-red-500">
                                      {commentError.message}
                                    </p>
                                  )}
                                </form>
                              )}
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
