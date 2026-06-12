import { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  FileText,
  FolderKanban,
  Megaphone,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  ShieldQuestion,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/adminApi'
import { boardApi } from '../../api/boardApi'
import { ApiError } from '../../api/axiosInstance'
import {
  projectBoardApi,
  type ProjectBoardListParams,
} from '../../api/projectBoardApi'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import Modal from '../../components/common/overlay/modal/Modal'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
import type { BoardKind, BoardListParams } from '../../types/board'
import type {
  BoardResponse,
  BoardSideBarResponse,
  PageBoardResponse,
} from '../../types'
import type { ScopeOptionResponse } from '../../types/admin'
import BoardAttachmentImage from '../board/BoardAttachmentImage'
import BoardContentViewer from '../board/BoardContentViewer'
import BoardWriteForm from '../board/BoardWriteForm'

interface BoardTypeOption {
  value: AdminBoardKind
  label: string
  icon: typeof Megaphone
}

type AdminBoardKind = BoardKind | 'project'

type DepartmentBoardOption = BoardSideBarResponse & {
  deptCd?: string
}

const boardTypeOptions: BoardTypeOption[] = [
  { value: 'notice', label: '공지사항', icon: Megaphone },
  { value: 'department', label: '부서게시판', icon: FileText },
  { value: 'free', label: '자유게시판', icon: MessageSquare },
  { value: 'anonymous', label: '익명게시판', icon: ShieldQuestion },
  { value: 'project', label: '프로젝트 게시판', icon: FolderKanban },
]

const boardLabelByType: Record<AdminBoardKind, string> = {
  notice: '공지사항',
  department: '부서게시판',
  free: '자유게시판',
  anonymous: '익명게시판',
  project: '프로젝트 게시판',
}

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

const formatAuthor = (board: BoardResponse, type: AdminBoardKind) => {
  if (type === 'anonymous') return '익명'
  return `${board.empNm?.trim() || '사원'}(${board.frstRgtrId})`
}

const AdminBoardsPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [boardType, setBoardType] = useState<AdminBoardKind>('notice')
  const [departmentCode, setDepartmentCode] = useState('')
  const [projectId, setProjectId] = useState(0)
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailTarget, setDetailTarget] = useState<BoardResponse | null>(null)
  const [editTarget, setEditTarget] = useState<BoardResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BoardResponse | null>(null)

  const {
    data: pageData,
    loading,
    error,
    execute: loadBoards,
  } = useApi<PageBoardResponse, [BoardListParams]>(boardApi.getBoards, {
    immediate: false,
  })
  const {
    data: projectPageData,
    loading: projectLoading,
    error: projectError,
    execute: loadProjectBoards,
  } = useApi<PageBoardResponse, [ProjectBoardListParams]>(
    projectBoardApi.getBoards,
    { immediate: false },
  )
  const {
    data: sidebarData,
  } = useApi<BoardSideBarResponse[]>(boardApi.getBoardSideBar)
  const {
    data: projectOptions,
  } = useApi<ScopeOptionResponse[]>(adminApi.getProjectScopeOptions)
  const {
    loading: deleting,
    execute: deleteBoard,
  } = useApi<null, [number]>(boardApi.deleteBoard, { immediate: false })

  const departmentOptions = useMemo(() => {
    const departmentBoard = sidebarData?.find(
      (board) => board.boardTypeCd?.toUpperCase() === 'DEPT',
    )

    return (departmentBoard?.underlevel ?? []) as DepartmentBoardOption[]
  }, [sidebarData])

  const selectedDepartmentCode = boardType === 'department'
    ? departmentCode || departmentOptions[0]?.deptCd || ''
    : undefined
  const selectedProjectId = boardType === 'project'
    ? projectId || Number(projectOptions?.[0]?.scopeId ?? 0)
    : 0

  useEffect(() => {
    if (boardType === 'department' && !selectedDepartmentCode) return
    if (boardType === 'project') {
      if (!selectedProjectId) return

      void loadProjectBoards({
        projectId: selectedProjectId,
        page,
        keyword,
      })
      return
    }

    void loadBoards({
      type: boardType,
      page,
      keyword,
      departmentCode: selectedDepartmentCode,
    })
  }, [
    boardType,
    keyword,
    loadBoards,
    loadProjectBoards,
    page,
    selectedDepartmentCode,
    selectedProjectId,
  ])

  const activePageData = boardType === 'project' ? projectPageData : pageData
  const activeLoading = boardType === 'project' ? projectLoading : loading
  const activeError = boardType === 'project' ? projectError : error
  const boards = activePageData?.content ?? []
  const totalPages = Math.max(activePageData?.totalPages ?? 1, 1)
  const totalElements = activePageData?.totalElements ?? 0
  const importantCount = boards.filter(
    (board) => board.imprtntYn?.toUpperCase() === 'Y',
  ).length
  const attachmentCount = boards.filter(
    (board) => Boolean(board.boardAtchFileId),
  ).length

  const changeBoardType = (nextType: AdminBoardKind) => {
    setBoardType(nextType)
    setPage(1)
    setKeyword('')
    setSearchText('')
  }

  const submitSearch = () => {
    setPage(1)
    setKeyword(searchText.trim())
  }

  const refreshBoards = () => {
    if (boardType === 'department' && !selectedDepartmentCode) return
    if (boardType === 'project') {
      if (!selectedProjectId) return

      void loadProjectBoards({
        projectId: selectedProjectId,
        page,
        keyword,
      })
      return
    }

    void loadBoards({
      type: boardType,
      page,
      keyword,
      departmentCode: selectedDepartmentCode,
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    try {
      await deleteBoard(deleteTarget.boardId)
      showToast({
        title: '게시글이 삭제되었습니다.',
        variant: 'success',
      })
      setDeleteTarget(null)
      refreshBoards()
    } catch (deleteError) {
      showToast({
        title: '게시글을 삭제하지 못했습니다.',
        description: deleteError instanceof ApiError
          ? deleteError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    }
  }

  if (editTarget) {
    return (
      <section className="flex min-h-[calc(100vh-7rem)] w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline">ADMIN BOARD EDIT</Badge>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              관리자 게시글 수정
            </h2>
          </div>
          <Button variant="outline" onClick={() => setEditTarget(null)}>
            목록으로
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <BoardWriteForm
            mode="edit"
            boardId={editTarget.boardId}
            initialBoardType={boardType === 'project' ? 'notice' : boardType}
            initialBoardTypeCd={editTarget.boardTypeCd}
            departmentCode={editTarget.deptCd || selectedDepartmentCode}
            projectId={editTarget.projId || selectedProjectId || undefined}
            initialTitle={editTarget.boardSj}
            initialContent={editTarget.boardCn}
            initialImportantYn={editTarget.imprtntYn}
            initialCommentUseYn={editTarget.cmntUseYn}
            initialAttachmentFileId={editTarget.boardAtchFileId}
            onClose={() => setEditTarget(null)}
            onUpdated={() => {
              showToast({
                title: '게시글이 수정되었습니다.',
                variant: 'success',
              })
              refreshBoards()
            }}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="outline">BOARD_POST_DELETE</Badge>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">게시판 관리</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            게시판별 게시글을 조회하고 운영 권한에 따라 삭제할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={refreshBoards}
            disabled={activeLoading}
          >
            새로고침
          </Button>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/boards/notices?mode=create')}
          >
            공지 작성
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {boardTypeOptions.map((option) => {
          const Icon = option.icon
          const active = boardType === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => changeBoardType(option.value)}
              className={`flex h-14 items-center gap-3 rounded-lg border px-4 text-left transition ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
              }`}
            >
              <Icon size={19} />
              <span className="text-sm font-bold">{option.label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-bold text-slate-500">전체 게시글</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {totalElements.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-bold text-slate-500">현재 페이지 중요글</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{importantCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-bold text-slate-500">현재 페이지 첨부글</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{attachmentCount}</p>
        </div>
      </div>

      <ContentCard
        title={`${boardLabelByType[boardType]} 게시글`}
        description="제목 검색과 페이지 이동 결과가 백엔드 조회 조건에 그대로 반영됩니다."
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
          {boardType === 'department' && (
            <select
              value={selectedDepartmentCode}
              onChange={(event) => {
                setDepartmentCode(event.target.value)
                setPage(1)
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
            >
              {departmentOptions.map((department) => (
                <option
                  key={department.deptCd}
                  value={department.deptCd}
                >
                  {department.boardName}
                </option>
              ))}
            </select>
          )}
          {boardType === 'project' && (
            <select
              value={selectedProjectId}
              onChange={(event) => {
                setProjectId(Number(event.target.value))
                setPage(1)
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
            >
              {(projectOptions ?? []).map((project) => (
                <option key={project.scopeId} value={project.scopeId}>
                  {project.scopeName}
                </option>
              ))}
            </select>
          )}

          <form
            className="flex min-w-0 flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
          >
            <SearchInput
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="게시글 제목 검색"
            />
            <Button type="submit" className="shrink-0">
              검색
            </Button>
          </form>
        </div>

        {activeError ? (
          <EmptyState
            title="게시글을 불러오지 못했습니다."
            description={activeError.message}
            actions={
              <Button variant="outline" onClick={refreshBoards}>
                다시 시도
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {activeLoading && (
              <div className="py-10 text-center text-sm font-semibold text-slate-500">
                게시글을 불러오는 중입니다.
              </div>
            )}

            {!activeLoading && (
              <DataTable
                data={boards}
                getRowKey={(board) => String(board.boardId)}
                emptyText="조건에 맞는 게시글이 없습니다."
                columns={[
                  {
                    key: 'boardId',
                    header: '번호',
                    className: 'w-20',
                    render: (board) => board.boardId,
                  },
                  {
                    key: 'title',
                    header: '제목',
                    render: (board) => (
                      <div className="flex min-w-0 items-center gap-2">
                        {board.imprtntYn?.toUpperCase() === 'Y' && (
                          <Badge variant="warning">중요</Badge>
                        )}
                        <span className="truncate font-semibold text-slate-900">
                          {board.boardSj}
                        </span>
                        {board.boardAtchFileId ? (
                          <Paperclip size={14} className="shrink-0 text-slate-400" />
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'author',
                    header: '작성자',
                    className: 'w-44',
                    render: (board) => formatAuthor(board, boardType),
                  },
                  {
                    key: 'date',
                    header: '작성일',
                    className: 'w-32',
                    render: (board) => formatDate(board.frstRegDt),
                  },
                  {
                    key: 'view',
                    header: '조회',
                    className: 'w-20 text-right',
                    render: (board) => board.viewCnt?.toLocaleString() ?? 0,
                  },
                  {
                    key: 'actions',
                    header: '관리',
                    className: 'w-44 text-right',
                    render: (board) => (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => setDetailTarget(board)}
                        >
                          상세
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() => setDeleteTarget(board)}
                        >
                          삭제
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            )}

            {!activeLoading && totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            )}
          </div>
        )}
      </ContentCard>

      <Modal
        open={Boolean(detailTarget)}
        title="관리자 게시글 상세"
        description={`${boardLabelByType[boardType]} 운영 상세 정보`}
        size="xl"
        onClose={() => setDetailTarget(null)}
        footer={
          <>
            <Button
              variant="primary"
              leftIcon={<Pencil size={15} />}
              onClick={() => {
                setEditTarget(detailTarget)
                setDetailTarget(null)
              }}
            >
              게시글 수정
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 size={15} />}
              onClick={() => {
                setDeleteTarget(detailTarget)
                setDetailTarget(null)
              }}
            >
              게시글 삭제
            </Button>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              닫기
            </Button>
          </>
        }
      >
        {detailTarget && (
          <article>
            <div className="border-b border-slate-200 pb-5">
              <div className="flex flex-wrap items-start gap-2">
                {detailTarget.imprtntYn?.toUpperCase() === 'Y' && (
                  <Badge variant="warning">중요</Badge>
                )}
                <Badge variant="neutral">{boardLabelByType[boardType]}</Badge>
              </div>

              <h3 className="mt-3 break-words text-xl font-bold text-slate-950">
                {detailTarget.boardSj}
              </h3>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-bold text-slate-400">게시글 번호</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {detailTarget.boardId}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-bold text-slate-400">작성자</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {formatAuthor(detailTarget, boardType)}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-bold text-slate-400">작성일</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {formatDate(detailTarget.frstRegDt)}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-bold text-slate-400">조회수</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {detailTarget.viewCnt?.toLocaleString() ?? 0}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="min-h-44 break-words py-6 text-sm leading-7 text-slate-800">
              <BoardContentViewer content={detailTarget.boardCn} />
            </div>

            <BoardAttachmentImage
              attachmentFileId={detailTarget.boardAtchFileId}
              alt={`${detailTarget.boardSj} 첨부 이미지`}
            />

            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Badge variant="neutral">
                댓글 {detailTarget.commentList?.length ?? 0}
              </Badge>
              <Badge variant="neutral">
                좋아요 {detailTarget.likeCnt ?? 0}
              </Badge>
              <Badge variant={detailTarget.cmntUseYn === 'Y' ? 'success' : 'danger'}>
                댓글 {detailTarget.cmntUseYn === 'Y' ? '허용' : '중지'}
              </Badge>
              {detailTarget.boardAtchFileId ? (
                <Badge variant="outline">
                  첨부파일 ID {detailTarget.boardAtchFileId}
                </Badge>
              ) : null}
            </div>
          </article>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="게시글 삭제"
        description="삭제된 게시글은 목록에서 더 이상 조회되지 않습니다."
        variant="danger"
        confirmText="삭제"
        cancelText="취소"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={() => void confirmDelete()}
            >
              삭제
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          <strong className="text-slate-950">{deleteTarget?.boardSj}</strong>
          {' '}게시글을 삭제하시겠습니까?
        </p>
      </Modal>
    </section>
  )
}

export default AdminBoardsPage
