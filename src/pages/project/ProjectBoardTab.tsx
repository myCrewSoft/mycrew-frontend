import {
  ArrowLeft,
  Eye,
  FileText,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Send,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { boardApi } from '../../api/boardApi'
import {
  boardDetailApi,
  type BoardCommentMutationRequest,
} from '../../api/boardDetailApi'
import { profileApi } from '../../api/profileApi'
import { projectBoardApi } from '../../api/projectBoardApi'
import Button from '../../components/common/button/Button'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import Textarea from '../../components/common/form/textarea/Textarea'
import Modal from '../../components/common/overlay/modal/Modal'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
import { useEmployeeProfileDirectory } from '../../hooks/useEmployeeProfileDirectory'
import type {
  BoardCommentUpdateRequest,
  BoardCommentVO,
  BoardResponse,
  PageBoardResponse,
} from '../../types'
import BoardWriteForm from '../board/BoardWriteForm'
import BoardAttachmentImage from '../board/BoardAttachmentImage'
import BoardContentViewer from '../board/BoardContentViewer'

interface ProjectBoardTabProps {
  projectId: number
}

type BoardView = 'list' | 'create' | 'detail' | 'edit'

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
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

const getCurrentEmployeeId = () => {
  const employeeId = Number(localStorage.getItem('empId'))
  return Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null
}

const isImportant = (board: BoardResponse) =>
  board.imprtntYn?.trim().toUpperCase() === 'Y'

const formatCommentAuthor = (
  writerEmployeeId: number | undefined,
  writerName: string,
) => {
  if (writerName) {
    return `${writerName}(${writerEmployeeId ?? '-'})`
  }

  return `사원(${writerEmployeeId ?? '-'})`
}

const ProjectBoardTab = ({ projectId }: ProjectBoardTabProps) => {
  const { showToast } = useToast()
  const [view, setView] = useState<BoardView>('list')
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedBoard, setSelectedBoard] = useState<BoardResponse | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const currentEmployeeId = getCurrentEmployeeId()

  const {
    data: pageData,
    loading,
    error,
    execute: fetchBoards,
  } = useApi<PageBoardResponse, [{ projectId: number; page: number; keyword: string }]>(
    projectBoardApi.getBoards,
    { immediate: false },
  )
  const { execute: deleteBoard, loading: deleting } = useApi(
    boardApi.deleteBoard,
    { immediate: false },
  )
  const { execute: fetchBoardDetail, loading: detailLoading } = useApi(
    projectBoardApi.getBoardDetail,
    { immediate: false },
  )
  const { execute: createComment, loading: creatingComment } = useApi<
    number,
    [BoardCommentMutationRequest]
  >(boardDetailApi.createBoardComment, { immediate: false })
  const { execute: updateComment, loading: updatingComment } = useApi<
    number,
    [BoardCommentUpdateRequest]
  >(boardDetailApi.updateBoardComment, { immediate: false })
  const { execute: deleteComment, loading: deletingComment } = useApi<
    string,
    [number]
  >(boardDetailApi.deleteBoardComment, { immediate: false })
  const { execute: toggleLike, loading: togglingLike } = useApi(
    boardDetailApi.toggleBoardLike,
    { immediate: false },
  )
  const { data: currentProfile } = useApi(profileApi.getMyProfile)

  const boards = useMemo(() => pageData?.content ?? [], [pageData?.content])
  const totalPages = Math.max(pageData?.totalPages ?? 1, 1)
  const currentEmployeeName = currentProfile?.empNm?.trim() ?? ''
  const { getEmployeeProfile } = useEmployeeProfileDirectory()

  useEffect(() => {
    void fetchBoards({ projectId, page, keyword }).catch(() => undefined)
  }, [fetchBoards, keyword, page, projectId])

  const refreshBoards = async () => {
    const response = await fetchBoards({ projectId, page, keyword })
    const refreshedBoards = response.data?.content ?? []

    if (selectedBoard) {
      const refreshedSelected = refreshedBoards.find(
        (board) => board.boardId === selectedBoard.boardId,
      )
      if (refreshedSelected) setSelectedBoard(refreshedSelected)
    }
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setKeyword(searchKeyword.trim())
  }

  const openDetail = async (board: BoardResponse) => {
    try {
      const response = await fetchBoardDetail(board.boardId)
      setSelectedBoard(response.data ?? board)
      setCommentContent('')
      setView('detail')
      void fetchBoards({ projectId, page, keyword }).catch(() => undefined)
    } catch (detailError) {
      showToast({
        title:
          detailError instanceof Error
            ? detailError.message
            : '게시글 상세 조회에 실패했습니다.',
        variant: 'danger',
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedBoard) return

    try {
      await deleteBoard(selectedBoard.boardId)
      showToast({ title: '게시글이 삭제되었습니다.', variant: 'success' })
      setDeleteConfirmOpen(false)
      setSelectedBoard(null)
      setView('list')
      await refreshBoards()
    } catch (deleteError) {
      showToast({
        title:
          deleteError instanceof Error
            ? deleteError.message
            : '게시글 삭제에 실패했습니다.',
        variant: 'danger',
      })
    }
  }

  const handleLike = async () => {
    if (!selectedBoard || !currentEmployeeId) {
      showToast({
        title: '로그인한 사원 정보를 확인할 수 없습니다.',
        variant: 'danger',
      })
      return
    }

    try {
      const response = await toggleLike(selectedBoard.boardId, currentEmployeeId)
      const nextLiked =
        typeof response.data === 'boolean'
          ? response.data
          : !selectedBoard.isLiked

      setSelectedBoard({
        ...selectedBoard,
        isLiked: nextLiked,
        likeCnt: Math.max(
          (selectedBoard.likeCnt ?? 0) + (nextLiked ? 1 : -1),
          0,
        ),
      })
    } catch (likeError) {
      showToast({
        title:
          likeError instanceof Error
            ? likeError.message
            : '좋아요 처리에 실패했습니다.',
        variant: 'danger',
      })
    }
  }

  const handleCommentSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    if (!selectedBoard || !commentContent.trim()) return

    const request: BoardCommentMutationRequest = {
      boardId: selectedBoard.boardId,
      commentCn: commentContent.trim(),
      commentPrtId: null,
      commentDepth: 0,
      commentOrder: 1,
    }

    try {
      const response = await createComment(request)
      const newComment: BoardCommentVO = {
        commentId: response.data,
        boardId: selectedBoard.boardId,
        commentCn: request.commentCn,
        wrterEmpId: currentEmployeeId ?? undefined,
        wrteDt: new Date().toISOString(),
        commentDepth: 0,
        commentOrder: 1,
      }

      setSelectedBoard({
        ...selectedBoard,
        commentList: [...(selectedBoard.commentList ?? []), newComment],
      })
      setCommentContent('')
      showToast({ title: '댓글이 등록되었습니다.', variant: 'success' })
    } catch (commentError) {
      showToast({
        title:
          commentError instanceof Error
            ? commentError.message
            : '댓글 등록에 실패했습니다.',
        variant: 'danger',
      })
    }
  }

  const toggleCommentEdit = (comment: BoardCommentVO) => {
    if (!comment.commentId) return

    if (editingCommentId === comment.commentId) {
      setEditingCommentId(null)
      setEditingCommentContent('')
      return
    }

    setEditingCommentId(comment.commentId)
    setEditingCommentContent(comment.commentCn ?? '')
  }

  const handleCommentUpdate = async (
    event: FormEvent<HTMLFormElement>,
    commentId: number,
  ) => {
    event.preventDefault()
    const nextContent = editingCommentContent.trim()

    if (!selectedBoard || !nextContent) return

    try {
      await updateComment({
        commentId,
        commentCn: nextContent,
      })

      setSelectedBoard({
        ...selectedBoard,
        commentList: (selectedBoard.commentList ?? []).map((comment) =>
          comment.commentId === commentId
            ? { ...comment, commentCn: nextContent }
            : comment,
        ),
      })
      setEditingCommentId(null)
      setEditingCommentContent('')
      showToast({ title: '댓글이 수정되었습니다.', variant: 'success' })
    } catch (updateError) {
      showToast({
        title:
          updateError instanceof Error
            ? updateError.message
            : '댓글 수정에 실패했습니다.',
        variant: 'danger',
      })
    }
  }

  const handleCommentDelete = async (comment: BoardCommentVO) => {
    if (
      !selectedBoard ||
      !comment.commentId ||
      deletingComment
    ) {
      return
    }

    if (!window.confirm('댓글을 삭제하시겠습니까?')) return

    setDeletingCommentId(comment.commentId)

    try {
      await deleteComment(comment.commentId)
      setSelectedBoard({
        ...selectedBoard,
        commentList: (selectedBoard.commentList ?? []).filter(
          (item) =>
            item.commentId !== comment.commentId &&
            item.commentPrtId !== comment.commentId,
        ),
      })

      if (editingCommentId === comment.commentId) {
        setEditingCommentId(null)
        setEditingCommentContent('')
      }

      showToast({ title: '댓글이 삭제되었습니다.', variant: 'success' })
    } catch (deleteError) {
      showToast({
        title:
          deleteError instanceof Error
            ? deleteError.message
            : '댓글 삭제에 실패했습니다.',
        variant: 'danger',
      })
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (view === 'create') {
    return (
      <div className="mt-5 min-h-[560px]">
        <BoardWriteForm
          initialBoardType="free"
          initialBoardTypeCd="PROJ"
          projectId={projectId}
          onClose={() => setView('list')}
          onCreated={() => {
            setPage(1)
            setKeyword('')
            setSearchKeyword('')
            setView('list')
            void fetchBoards({
              projectId,
              page: 1,
              keyword: '',
            }).catch(() => undefined)
          }}
        />
      </div>
    )
  }

  if (view === 'edit' && selectedBoard) {
    return (
      <div className="mt-5 min-h-[560px]">
        <BoardWriteForm
          mode="edit"
          boardId={selectedBoard.boardId}
          initialBoardType="free"
          initialBoardTypeCd="PROJ"
          projectId={projectId}
          initialTitle={selectedBoard.boardSj}
          initialContent={selectedBoard.boardCn}
          initialImportantYn={selectedBoard.imprtntYn}
          initialCommentUseYn={selectedBoard.cmntUseYn}
          initialAttachmentFileId={selectedBoard.boardAtchFileId}
          onClose={() => setView('detail')}
          onUpdated={(request) => {
            setSelectedBoard({
              ...selectedBoard,
              ...request,
              projId: projectId,
            })
            setView('detail')
            void refreshBoards().catch(() => undefined)
          }}
        />
      </div>
    )
  }

  if (view === 'detail' && selectedBoard) {
    const commentsEnabled = selectedBoard.cmntUseYn?.toUpperCase() !== 'N'
    const canManage =
      currentEmployeeId !== null &&
      selectedBoard.frstRgtrId === currentEmployeeId

    return (
      <div className="mt-5">
        <article className="rounded-md border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => setView('list')}
            >
              목록
            </Button>
            {canManage && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Pencil size={15} />}
                  onClick={() => setView('edit')}
                >
                  수정
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={15} />}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  삭제
                </Button>
              </div>
            )}
          </header>

          <div className="p-6">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex items-start gap-2">
                {isImportant(selectedBoard) && (
                  <Badge variant="warning">중요</Badge>
                )}
                <h2 className="min-w-0 break-words text-xl font-bold text-slate-950">
                  {selectedBoard.boardSj}
                </h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-800">
                  {selectedBoard.empNm || '사원'}({selectedBoard.frstRgtrId})
                </span>
                <span>{formatDateTime(selectedBoard.frstRegDt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Eye size={14} /> {selectedBoard.viewCnt ?? 0}
                </span>
              </div>
            </div>

            <div className="min-h-48 break-words pb-3 pt-6 text-sm leading-7 text-slate-800">
              <BoardContentViewer content={selectedBoard.boardCn} />
            </div>

            <BoardAttachmentImage
              attachmentFileId={selectedBoard.boardAtchFileId}
              alt={`${selectedBoard.boardSj} 첨부 이미지`}
            />

            {selectedBoard.boardAtchFileId ? (
              <div className="flex items-center gap-2 border-b border-slate-200 py-4 text-sm text-slate-600">
                <Paperclip size={16} />
                첨부파일 ID {selectedBoard.boardAtchFileId}
              </div>
            ) : null}

            <div className="flex items-center justify-between py-4">
              <button
                type="button"
                disabled={togglingLike}
                onClick={() => void handleLike()}
                className={`inline-flex items-center gap-2 text-sm font-semibold ${
                  selectedBoard.isLiked
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <ThumbsUp size={17} />
                좋아요 {selectedBoard.likeCnt ?? 0}
              </button>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <MessageSquare size={17} />
                댓글 {selectedBoard.commentList?.length ?? 0}
              </span>
            </div>

            {commentsEnabled && (
              <section className="border-t border-slate-200 pt-5">
                <form
                  onSubmit={handleCommentSubmit}
                  className="rounded-md bg-slate-50 p-4"
                >
                  <Textarea
                    value={commentContent}
                    onChange={(event) => setCommentContent(event.target.value)}
                    placeholder="댓글을 입력하세요."
                    maxLength={1000}
                    className="min-h-20 resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      leftIcon={<Send size={15} />}
                      loading={creatingComment}
                      disabled={!commentContent.trim()}
                    >
                      댓글 등록
                    </Button>
                  </div>
                </form>

                <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {(selectedBoard.commentList ?? []).length > 0 ? (
                    (selectedBoard.commentList ?? []).map((comment, index) => {
                      const employeeProfile = getEmployeeProfile(
                        comment.wrterEmpId,
                      )
                      const commentAuthorName =
                        employeeProfile?.name ??
                        (comment.wrterEmpId === currentEmployeeId
                          ? currentEmployeeName
                          : '')

                      return (
                      <div
                        key={comment.commentId ?? index}
                        className="flex gap-3 px-4 py-3"
                      >
                        <ProfileAvatar
                          fileId={
                            employeeProfile?.profileFileId ??
                            (comment.wrterEmpId === currentEmployeeId
                              ? currentProfile?.prflImgFileId
                              : null)
                          }
                          name={commentAuthorName}
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-slate-800">
                              {formatCommentAuthor(
                                comment.wrterEmpId,
                                commentAuthorName,
                              )}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDateTime(comment.wrteDt)}
                            </span>
                          </div>
                        {editingCommentId === comment.commentId &&
                        comment.commentId ? (
                          <form
                            onSubmit={(event) =>
                              handleCommentUpdate(event, comment.commentId as number)
                            }
                            className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                          >
                            <Textarea
                              value={editingCommentContent}
                              onChange={(event) =>
                                setEditingCommentContent(event.target.value)
                              }
                              maxLength={1000}
                              autoFocus
                              className="min-h-20 resize-none bg-white"
                            />
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <span className="text-xs text-slate-400">
                                {editingCommentContent.length}/1000
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCommentEdit(comment)}
                                  disabled={updatingComment}
                                >
                                  취소
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  loading={updatingComment}
                                  disabled={!editingCommentContent.trim()}
                                >
                                  수정 완료
                                </Button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {comment.commentCn}
                          </p>
                        )}

                        {comment.wrterEmpId === currentEmployeeId &&
                          editingCommentId !== comment.commentId && (
                            <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => toggleCommentEdit(comment)}
                                className="text-slate-500 hover:text-blue-600"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                disabled={deletingComment}
                                onClick={() => void handleCommentDelete(comment)}
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 size={12} />
                                {deletingCommentId === comment.commentId
                                  ? '삭제 중'
                                  : '삭제'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      )
                    })
                  ) : (
                    <p className="px-4 py-7 text-center text-sm text-slate-400">
                      등록된 댓글이 없습니다.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </article>

        <Modal
          open={deleteConfirmOpen}
          title="게시글 삭제"
          description="삭제한 게시글은 복구할 수 없습니다."
          variant="danger"
          confirmText="삭제"
          cancelText="취소"
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => void handleDelete()}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                variant="danger"
                loading={deleting}
                onClick={() => void handleDelete()}
              >
                삭제
              </Button>
            </>
          }
        />
      </div>
    )
  }

  return (
    <section className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">프로젝트 보드</h2>
          <p className="mt-1 text-sm text-slate-500">
            프로젝트 구성원과 공지 및 업무 관련 내용을 공유합니다.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setView('create')}
        >
          게시글 작성
        </Button>
      </header>

      <form
        onSubmit={handleSearch}
        className="flex gap-2 border-b border-slate-100 px-5 py-4"
      >
        <SearchInput
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="제목&내용 검색"
          wrapperClassName="max-w-sm"
        />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      <div className="relative min-h-80">
        {detailLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 text-sm font-semibold text-slate-500">
            게시글을 불러오는 중입니다.
          </div>
        )}
        {loading ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-slate-400">
            게시글을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyState
              title="프로젝트 게시글을 불러오지 못했습니다."
              description={error.message}
              actions={
                <Button
                  variant="outline"
                  onClick={() => void refreshBoards().catch(() => undefined)}
                >
                  다시 시도
                </Button>
              }
            />
          </div>
        ) : boards.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText size={22} />}
              title="등록된 프로젝트 게시글이 없습니다."
              description="첫 게시글을 작성해 프로젝트 정보를 공유해 보세요."
              actions={
                <Button variant="primary" onClick={() => setView('create')}>
                  게시글 작성
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="grid h-11 grid-cols-[90px_minmax(0,1fr)_150px_130px_90px] items-center border-b border-slate-100 bg-slate-50 px-5 text-xs font-bold text-slate-500">
              <span>번호</span>
              <span>제목</span>
              <span>작성자</span>
              <span>작성일</span>
              <span>조회</span>
            </div>
            <div className="divide-y divide-slate-100">
              {boards.map((board) => (
                <button
                  key={board.boardId}
                  type="button"
                  onClick={() => void openDetail(board)}
                  className="grid min-h-14 w-full grid-cols-[90px_minmax(0,1fr)_150px_130px_90px] items-center px-5 text-left text-sm transition-colors hover:bg-slate-50"
                >
                  <span className="text-slate-500">{board.boardId}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    {isImportant(board) && (
                      <Badge variant="warning">중요</Badge>
                    )}
                    <span className="truncate font-semibold text-slate-800">
                      {board.boardSj}
                    </span>
                    {board.boardAtchFileId ? (
                      <Paperclip size={14} className="shrink-0 text-slate-400" />
                    ) : null}
                    {(board.commentList?.length ?? 0) > 0 && (
                      <span className="text-xs font-semibold text-blue-600">
                        [{board.commentList?.length}]
                      </span>
                    )}
                  </span>
                  <span className="truncate text-slate-600">
                    {board.empNm || '사원'}({board.frstRgtrId})
                  </span>
                  <span className="text-slate-500">
                    {formatDate(board.frstRegDt)}
                  </span>
                  <span className="text-slate-500">{board.viewCnt ?? 0}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {!loading && !error && boards.length > 0 && totalPages > 1 && (
        <div className="border-t border-slate-100 py-5">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </section>
  )
}

export default ProjectBoardTab
