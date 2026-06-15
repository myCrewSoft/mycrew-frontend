import { useEffect, useMemo, useRef, useState } from 'react'
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
  Send,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  Square,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { boardApi } from '../../api/boardApi'
import {
  boardDetailApi,
  type BoardCommentMutationRequest,
  type BoardLikeResponse,
} from '../../api/boardDetailApi'
import { ApiError } from '../../api/axiosInstance'
import { profileApi } from '../../api/profileApi'
import {
  projectBoardApi,
  type ProjectBoardListParams,
} from '../../api/projectBoardApi'
import Button from '../../components/common/button/Button'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import Textarea from '../../components/common/form/textarea/Textarea'
import Modal from '../../components/common/overlay/modal/Modal'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
import { useEmployeeProfileDirectory } from '../../hooks/useEmployeeProfileDirectory'
import type { BoardKind, BoardListParams } from '../../types/board'
import type {
  BoardCommentUpdateRequest,
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

interface AdminBoardDetailParams {
  boardType: AdminBoardKind
  boardId: number
  deptCd?: string
}

interface BoardRiskAnalysis {
  riskScore: number
  reason: string
}

// GET 방식의 스트리밍 API는 URL 길이 제한이 있으므로 인코딩된 메시지 크기를 제한합니다.
// 제목은 항상 포함하고, 본문은 허용 범위 안에서 최대한 많이 전달합니다.
const buildBoardAnalysisMessage = (board: BoardResponse) => {
  const document = new DOMParser().parseFromString(board.boardCn ?? '', 'text/html')
  const content = document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  const prefix = `게시글 제목: ${board.boardSj}\n게시글 내용: `
  const maxEncodedLength = 6000

  let low = 0
  let high = content.length

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    const candidate = `${prefix}${content.slice(0, middle)}`

    if (encodeURIComponent(candidate).length <= maxEncodedLength) {
      low = middle
    } else {
      high = middle - 1
    }
  }

  return `${prefix}${content.slice(0, low)}`
}

// AI 응답이 마크다운 코드 블록으로 감싸져도 내부 JSON만 찾아 안전하게 변환합니다.
const parseBoardRiskAnalysis = (content: string): BoardRiskAnalysis => {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')

  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    throw new Error('분석 결과 형식을 확인할 수 없습니다.')
  }

  const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1)) as {
    risk_score?: unknown
    reason?: unknown
  }
  const riskScore = Number(parsed.risk_score)
  const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : ''

  if (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 100 || !reason) {
    throw new Error('분석 결과에 필요한 값이 없습니다.')
  }

  return {
    riskScore: Math.round(riskScore),
    reason,
  }
}

// 관리자 화면에서 선택한 게시판 종류에 맞는 상세 조회 API를 호출합니다.
// 프로젝트 게시판은 일반 게시판과 상세 조회 주소가 달라 별도로 분기합니다.
const getAdminBoardDetail = ({
  boardType,
  boardId,
  deptCd,
}: AdminBoardDetailParams) => {
  if (boardType === 'project') {
    return projectBoardApi.getBoardDetail(boardId)
  }

  return boardDetailApi.getBoardDetail({
    boardType,
    boardId,
    deptCd,
  })
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

const formatCommentAuthor = (
  employeeId: number | undefined,
  type: AdminBoardKind,
  employeeName: string,
) => {
  if (type === 'anonymous') return '익명'

  if (employeeName) {
    return `${employeeName}(${employeeId ?? '-'})`
  }

  return `사원(${employeeId ?? '-'})`
}

const getCurrentEmployeeId = () => {
  const employeeId = Number(localStorage.getItem('empId'))

  return Number.isFinite(employeeId) && employeeId > 0 ? employeeId : null
}

// 좋아요 조회 API의 응답 필드가 달라져도 화면이 동작하도록
// 가능한 필드명을 확인하고, 값이 없으면 전달받은 fallback을 사용합니다.
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

const AdminBoardsPage = () => {
  const { showToast } = useToast()
  const [boardType, setBoardType] = useState<AdminBoardKind>('notice')
  const [departmentCode, setDepartmentCode] = useState('')
  const [projectId, setProjectId] = useState(0)
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailTarget, setDetailTarget] = useState<BoardResponse | null>(null)
  const [creatingBoard, setCreatingBoard] = useState(false)
  const [creatingBoardTitle, setCreatingBoardTitle] = useState('공지사항')
  const [editTarget, setEditTarget] = useState<BoardResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BoardResponse | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<BoardRiskAnalysis | null>(null)
  const [analyzingRisk, setAnalyzingRisk] = useState(false)
  const analysisAbortControllerRef = useRef<AbortController | null>(null)
  const analysisRequestIdRef = useRef('')
  // 현재 열려 있는 게시글의 좋아요 여부와 개수를 별도로 관리합니다.
  // 상세 응답과 좋아요 전용 API의 응답 시점이 다르기 때문입니다.
  const [likeState, setLikeState] = useState({
    boardId: 0,
    isLiked: false,
    likeCnt: 0,
  })

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
  const {
    loading: detailLoading,
    execute: loadBoardDetail,
  } = useApi<BoardResponse, [AdminBoardDetailParams]>(
    getAdminBoardDetail,
    { immediate: false },
  )
  const {
    data: currentProfile,
  } = useApi(profileApi.getMyProfile)
  const {
    loading: creatingComment,
    execute: createBoardComment,
  } = useApi<number, [BoardCommentMutationRequest]>(
    boardDetailApi.createBoardComment,
    { immediate: false },
  )
  const {
    loading: updatingComment,
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

  const currentEmployeeId = getCurrentEmployeeId()
  const currentEmployeeName = currentProfile?.empNm?.trim() ?? ''
  const { getEmployeeProfile } = useEmployeeProfileDirectory(
    boardType !== 'anonymous',
  )
  // 다른 게시글의 좋아요 상태가 잠깐 표시되지 않도록 boardId가 같은지 확인합니다.
  const currentLikeState = detailTarget && likeState.boardId === detailTarget.boardId
    ? likeState
    : {
        boardId: detailTarget?.boardId ?? 0,
        isLiked: detailTarget?.isLiked ?? false,
        likeCnt: detailTarget?.likeCnt ?? 0,
      }

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

  const openBoardDetail = async (board: BoardResponse) => {
    // 새 게시글을 열 때 이전 게시글의 댓글 편집 및 좋아요 상태를 초기화합니다.
    analysisAbortControllerRef.current?.abort()
    analysisAbortControllerRef.current = null
    analysisRequestIdRef.current = ''
    setAnalyzingRisk(false)
    setRiskAnalysis(null)
    setEditingCommentId(null)
    setEditingCommentContent('')
    setDeletingCommentId(null)
    setCommentContent('')
    setLikeState({
      boardId: board.boardId,
      isLiked: board.isLiked ?? false,
      likeCnt: board.likeCnt ?? 0,
    })
    setDetailTarget(board)

    try {
      // 상세 내용과 현재 사용자의 좋아요 상태는 서로 독립적인 API이므로
      // Promise.all로 동시에 요청해 모달 로딩 시간을 줄입니다.
      const [detailResponse, likeResponse] = await Promise.all([
        loadBoardDetail({
          boardType,
          boardId: board.boardId,
          deptCd: board.deptCd || selectedDepartmentCode,
        }),
        currentEmployeeId
          ? fetchBoardLike(board.boardId, currentEmployeeId).catch(() => null)
          : Promise.resolve(null),
      ])

      if (detailResponse.data) {
        setDetailTarget(detailResponse.data)
      }

      // 좋아요 전용 API가 실패하거나 일부 필드를 주지 않는 경우에는
      // 상세 응답 또는 목록 응답의 좋아요 값을 대신 사용합니다.
      const fallback = {
        isLiked: detailResponse.data?.isLiked ?? board.isLiked ?? false,
        likeCnt: detailResponse.data?.likeCnt ?? board.likeCnt ?? 0,
      }

      setLikeState({
        boardId: board.boardId,
        ...parseBoardLikeState(likeResponse?.data ?? {}, fallback),
      })
    } catch (detailError) {
      setDetailTarget(null)
      showToast({
        title: '게시글 상세 정보를 불러오지 못했습니다.',
        description: detailError instanceof ApiError
          ? detailError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    }
  }

  const stopRiskAnalysis = () => {
    const requestId = analysisRequestIdRef.current

    analysisAbortControllerRef.current?.abort()
    analysisAbortControllerRef.current = null
    analysisRequestIdRef.current = ''
    setAnalyzingRisk(false)

    if (requestId) {
      void boardApi.stopBoardRiskAnalysis(requestId).catch(() => undefined)
    }
  }

  const closeBoardDetail = () => {
    stopRiskAnalysis()
    setRiskAnalysis(null)
    setDetailTarget(null)
    setCommentContent('')
    setEditingCommentId(null)
    setEditingCommentContent('')
  }

  const analyzeBoardRisk = async () => {
    if (!detailTarget || analyzingRisk) return

    const requestId = `board-risk-${detailTarget.boardId}-${Date.now()}`
    const abortController = new AbortController()
    let accumulated = ''

    analysisAbortControllerRef.current = abortController
    analysisRequestIdRef.current = requestId
    setRiskAnalysis(null)
    setAnalyzingRisk(true)

    try {
      await boardApi.streamBoardRiskAnalysis({
        boardId: detailTarget.boardId,
        message: buildBoardAnalysisMessage(detailTarget),
        requestId,
        onMessage: (chunk) => {
          accumulated += chunk
        },
        signal: abortController.signal,
      })

      if (analysisRequestIdRef.current !== requestId) return

      setRiskAnalysis(parseBoardRiskAnalysis(accumulated))
    } catch (analysisError) {
      if (analysisError instanceof DOMException && analysisError.name === 'AbortError') {
        return
      }

      showToast({
        title: '게시글 위험도 분석에 실패했습니다.',
        description: analysisError instanceof Error
          ? analysisError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    } finally {
      if (analysisRequestIdRef.current === requestId) {
        analysisAbortControllerRef.current = null
        analysisRequestIdRef.current = ''
        setAnalyzingRisk(false)
      }
    }
  }

  useEffect(() => {
    return () => {
      analysisAbortControllerRef.current?.abort()
    }
  }, [])

  const handleLikeToggle = async () => {
    if (!detailTarget || !currentEmployeeId || togglingLike) return

    const boardId = detailTarget.boardId
    // 현재 모달과 likeState의 게시글이 다르면 상세 데이터의 값을 기준으로 시작합니다.
    const currentLikeState = likeState.boardId === boardId
      ? likeState
      : {
          boardId,
          isLiked: detailTarget.isLiked ?? false,
          likeCnt: detailTarget.likeCnt ?? 0,
        }

    try {
      // 같은 API가 좋아요 등록과 취소를 토글 방식으로 처리합니다.
      const toggleResponse = await toggleBoardLike(boardId, currentEmployeeId)
      const nextLiked = toggleResponse.data ?? !currentLikeState.isLiked
      // 토글 API가 좋아요 개수를 주지 않을 때 사용할 임시 화면 값입니다.
      const fallback = {
        isLiked: nextLiked,
        likeCnt: Math.max(
          0,
          currentLikeState.likeCnt + (nextLiked ? 1 : -1),
        ),
      }

      const likeResponse = await fetchBoardLike(
        boardId,
        currentEmployeeId,
      ).catch(() => null)
      // 토글 직후 서버의 최종 상태를 다시 조회해 화면과 DB 값을 맞춥니다.
      const nextLikeState = parseBoardLikeState(
        likeResponse?.data ?? {},
        fallback,
      )

      setLikeState({
        boardId,
        ...nextLikeState,
      })
      // 상세 객체도 함께 갱신해 모달 안의 다른 좋아요 표시와 값을 일치시킵니다.
      setDetailTarget((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            isLiked: nextLikeState.isLiked,
            likeCnt: nextLikeState.likeCnt,
          }
        : currentDetail)
    } catch (likeError) {
      showToast({
        title: '좋아요 처리에 실패했습니다.',
        description: likeError instanceof ApiError
          ? likeError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    }
  }

  const toggleCommentEdit = (
    commentId: number | undefined,
    commentContent: string | undefined,
  ) => {
    if (!commentId) return

    if (editingCommentId === commentId) {
      setEditingCommentId(null)
      setEditingCommentContent('')
      return
    }

    setEditingCommentId(commentId)
    setEditingCommentContent(commentContent ?? '')
  }

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedContent = commentContent.trim()
    if (
      !detailTarget ||
      !trimmedContent ||
      creatingComment ||
      detailTarget.cmntUseYn?.toUpperCase() === 'N'
    ) {
      return
    }

    const topLevelCommentCount = (detailTarget.commentList ?? []).filter(
      (comment) => !comment.commentPrtId,
    ).length

    try {
      const response = await createBoardComment({
        boardId: detailTarget.boardId,
        commentCn: trimmedContent,
        commentPrtId: null,
        commentDepth: 0,
        commentOrder: topLevelCommentCount + 1,
      })

      // 등록 직후 상세 API를 다시 호출하지 않고 응답받은 댓글 ID로 목록을 갱신합니다.
      setDetailTarget((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            commentList: [
              ...(currentDetail.commentList ?? []),
              {
                commentId: response.data,
                boardId: currentDetail.boardId,
                commentCn: trimmedContent,
                wrterEmpId: currentEmployeeId ?? undefined,
                wrteDt: new Date().toISOString(),
                commentDepth: 0,
                commentOrder: topLevelCommentCount + 1,
              },
            ],
          }
        : currentDetail)
      setCommentContent('')
      showToast({
        title: '댓글을 등록했습니다.',
        variant: 'success',
      })
    } catch (commentError) {
      showToast({
        title: '댓글을 등록하지 못했습니다.',
        description: commentError instanceof ApiError
          ? commentError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    }
  }

  const submitCommentEdit = async (
    event: React.FormEvent<HTMLFormElement>,
    commentId: number,
  ) => {
    event.preventDefault()

    const trimmedContent = editingCommentContent.trim()
    if (!trimmedContent || updatingComment) return

    try {
      await updateBoardComment({
        commentId,
        commentCn: trimmedContent,
      })

      // 수정 성공 후 상세 API를 다시 호출하지 않고 해당 댓글만 즉시 교체합니다.
      setDetailTarget((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            commentList: (currentDetail.commentList ?? []).map((comment) =>
              comment.commentId === commentId
                ? { ...comment, commentCn: trimmedContent }
                : comment,
            ),
          }
        : currentDetail)
      setEditingCommentId(null)
      setEditingCommentContent('')
      showToast({
        title: '댓글을 수정했습니다.',
        variant: 'success',
      })
    } catch (commentError) {
      showToast({
        title: '댓글을 수정하지 못했습니다.',
        description: commentError instanceof ApiError
          ? commentError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    }
  }

  const removeComment = async (commentId: number) => {
    if (deletingComment) return
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return

    setDeletingCommentId(commentId)

    try {
      await deleteBoardComment(commentId)
      // 부모 댓글을 삭제하면 화면에서도 연결된 답글을 함께 제거합니다.
      setDetailTarget((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            commentList: (currentDetail.commentList ?? []).filter((comment) =>
              comment.commentId !== commentId &&
              comment.commentPrtId !== commentId,
            ),
          }
        : currentDetail)
      showToast({
        title: '댓글을 삭제했습니다.',
        variant: 'success',
      })
    } catch (commentError) {
      showToast({
        title: '댓글을 삭제하지 못했습니다.',
        description: commentError instanceof ApiError
          ? commentError.message
          : '잠시 후 다시 시도해주세요.',
        variant: 'danger',
      })
    } finally {
      setDeletingCommentId(null)
    }
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

  if (creatingBoard) {
    return (
      <section className="flex min-h-[calc(100vh-7rem)] w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline">ADMIN BOARD CREATE</Badge>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              관리자 {creatingBoardTitle} 작성
            </h2>
          </div>
          <Button variant="outline" onClick={() => setCreatingBoard(false)}>
            목록으로
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <BoardWriteForm
            mode="create"
            initialBoardType={boardType === 'project' ? 'notice' : boardType}
            initialBoardTypeCd={boardType === 'project' ? 'PROJ' : ''}
            departmentCode={selectedDepartmentCode}
            projectId={boardType === 'project' ? selectedProjectId : undefined}
            onBoardSelectionChange={(selectedType, departmentName) => {
              if (boardType === 'project') {
                setCreatingBoardTitle(boardLabelByType.project)
                return
              }

              const selectedLabel = boardLabelByType[selectedType]
              setCreatingBoardTitle(
                departmentName
                  ? `${selectedLabel} ${departmentName}`
                  : selectedLabel,
              )
            }}
            onClose={() => setCreatingBoard(false)}
            onCreated={() => {
              showToast({
                title: `${creatingBoardTitle} 게시글이 등록되었습니다.`,
                variant: 'success',
              })
              refreshBoards()
            }}
          />
        </div>
      </section>
    )
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
            onClick={() => {
              setPage(1)
              setSearchText('')
              setKeyword('')
              setCreatingBoardTitle(boardLabelByType[boardType])
              setCreatingBoard(true)
            }}
            disabled={
              (boardType === 'department' && !selectedDepartmentCode) ||
              (boardType === 'project' && !selectedProjectId)
            }
          >
            {boardLabelByType[boardType]} 작성
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
                    className: 'w-20 text-center',
                    headerClassName: '!text-center',
                    render: (board) => board.boardId,
                  },
                  {
                    key: 'title',
                    header: '제목',
                    headerClassName: '!text-center',
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
                    className: 'w-52 text-center',
                    headerClassName: '!text-center',
                    render: (board) => formatAuthor(board, boardType),
                  },
                  {
                    key: 'date',
                    header: '작성일',
                    className: 'w-36 text-center',
                    headerClassName: '!text-center',
                    render: (board) => formatDate(board.frstRegDt),
                  },
                  {
                    key: 'view',
                    header: '조회',
                    className: 'w-24 text-center',
                    headerClassName: '!text-center',
                    render: (board) => board.viewCnt?.toLocaleString() ?? 0,
                  },
                  {
                    key: 'actions',
                    header: '관리',
                    className: 'w-56 text-center',
                    headerClassName: '!text-center',
                    render: (board) => (
                      <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          leftIcon={<Eye size={14} />}
                          onClick={() => void openBoardDetail(board)}
                        >
                          상세
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="shrink-0"
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
        onClose={closeBoardDetail}
        footer={
          <>
            <Button
              variant="primary"
              leftIcon={<Pencil size={15} />}
              onClick={() => {
                stopRiskAnalysis()
                setRiskAnalysis(null)
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
                stopRiskAnalysis()
                setRiskAnalysis(null)
                setDeleteTarget(detailTarget)
                setDetailTarget(null)
              }}
            >
              게시글 삭제
            </Button>
            <Button variant="outline" onClick={closeBoardDetail}>
              닫기
            </Button>
          </>
        }
      >
        {detailLoading && (
          <div className="flex min-h-72 items-center justify-center text-sm font-semibold text-slate-500">
            게시글 상세 정보와 댓글을 불러오는 중입니다.
          </div>
        )}

        {!detailLoading && detailTarget && (
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

            <section className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    AI 게시글 위험 분석
                  </h4>
                </div>

                {analyzingRisk ? (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Square size={13} fill="currentColor" />}
                    onClick={stopRiskAnalysis}
                  >
                    분석 중단
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ShieldAlert size={15} />}
                    onClick={() => void analyzeBoardRisk()}
                  >
                    {riskAnalysis ? '다시 분석' : '위험도 분석'}
                  </Button>
                )}
              </div>

              {analyzingRisk && (
                <div className="mt-4 flex min-h-24 items-center justify-center rounded-md border border-dashed border-blue-200 bg-blue-50/60 text-sm font-semibold text-blue-600">
                  게시글 내용을 분석하고 있습니다.
                </div>
              )}

              {!analyzingRisk && riskAnalysis && (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        위험도
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {riskAnalysis.riskScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        분석 사유
                      </p>
                      <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-700">
                        {riskAnalysis.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Badge variant="neutral">
                댓글 {detailTarget.commentList?.length ?? 0}
              </Badge>
              <button
                type="button"
                title={currentLikeState.isLiked ? '좋아요 취소' : '좋아요'}
                // 스크린 리더에도 현재 좋아요 선택 상태를 전달합니다.
                aria-pressed={currentLikeState.isLiked}
                disabled={!currentEmployeeId || togglingLike}
                onClick={() => void handleLikeToggle()}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentLikeState.isLiked
                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                <ThumbsUp
                  size={14}
                  fill={currentLikeState.isLiked ? 'currentColor' : 'none'}
                />
                좋아요 {currentLikeState.likeCnt}
              </button>
              <Badge variant={detailTarget.cmntUseYn === 'Y' ? 'success' : 'danger'}>
                댓글 {detailTarget.cmntUseYn === 'Y' ? '허용' : '중지'}
              </Badge>
              {detailTarget.boardAtchFileId ? (
                <Badge variant="outline">
                  첨부파일 ID {detailTarget.boardAtchFileId}
                </Badge>
              ) : null}
            </div>

            <section className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare size={17} className="text-slate-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  댓글 {detailTarget.commentList?.length ?? 0}
                </h4>
              </div>

              {detailTarget.cmntUseYn?.toUpperCase() !== 'N' ? (
                <form
                  className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3"
                  onSubmit={(event) => void submitComment(event)}
                >
                  <Textarea
                    value={commentContent}
                    onChange={(event) => setCommentContent(event.target.value)}
                    placeholder="댓글을 입력하세요."
                    maxLength={1000}
                    className="min-h-24 resize-none rounded-md bg-white"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-400">
                      {commentContent.length}/1000
                    </span>
                    <Button
                      type="submit"
                      size="sm"
                      leftIcon={<Send size={14} />}
                      loading={creatingComment}
                      disabled={!commentContent.trim()}
                    >
                      댓글 등록
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  댓글 등록이 중지된 게시글입니다.
                </div>
              )}

              {(detailTarget.commentList?.length ?? 0) > 0 ? (
                <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
                  {detailTarget.commentList?.map((comment, index) => {
                    const employeeProfile = getEmployeeProfile(
                      comment.wrterEmpId,
                    )
                    const commentAuthorName =
                      boardType === 'anonymous'
                        ? '익명'
                        : employeeProfile?.name ??
                          (comment.wrterEmpId === currentEmployeeId
                            ? currentEmployeeName
                            : '')

                    return (
                    <div
                      key={comment.commentId ?? index}
                      className={`flex gap-3 px-4 py-3 ${
                        comment.commentDepth ? 'bg-slate-50 pl-10' : 'bg-white'
                      }`}
                    >
                      <ProfileAvatar
                        fileId={
                          boardType === 'anonymous'
                            ? null
                            : employeeProfile?.profileFileId ??
                              (comment.wrterEmpId === currentEmployeeId
                                ? currentProfile?.prflImgFileId
                                : null)
                        }
                        name={commentAuthorName}
                        size={32}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-slate-800">
                            {formatCommentAuthor(
                              comment.wrterEmpId,
                              boardType,
                              commentAuthorName,
                            )}
                          </span>
                          {Boolean(comment.commentDepth) && (
                            <Badge variant="neutral">답글</Badge>
                          )}
                          <span className="text-slate-400">
                            {formatDate(comment.wrteDt)}
                          </span>
                        </div>
                      {editingCommentId === comment.commentId &&
                      comment.commentId ? (
                        <form
                          className="mt-3 rounded-md border border-slate-200 bg-white p-3"
                          onSubmit={(event) =>
                            void submitCommentEdit(event, comment.commentId as number)
                          }
                        >
                          <Textarea
                            value={editingCommentContent}
                            onChange={(event) =>
                              setEditingCommentContent(event.target.value)
                            }
                            maxLength={1000}
                            autoFocus
                            className="min-h-20 resize-none rounded-md"
                          />
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-slate-400">
                              {editingCommentContent.length}/1000
                            </span>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleCommentEdit(
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
                                disabled={!editingCommentContent.trim()}
                              >
                                수정 완료
                              </Button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {comment.commentCn}
                          </p>
                          {comment.wrterEmpId === currentEmployeeId &&
                            comment.commentId && (
                            <div className="mt-2 flex items-center gap-3">
                              <button
                                type="button"
                                className="text-xs font-semibold text-slate-500 hover:text-blue-600"
                                onClick={() =>
                                  toggleCommentEdit(
                                    comment.commentId,
                                    comment.commentCn,
                                  )
                                }
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                disabled={deletingComment}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() =>
                                  void removeComment(comment.commentId as number)
                                }
                              >
                                <Trash2 size={12} />
                                {deletingCommentId === comment.commentId
                                  ? '삭제 중'
                                  : '삭제'}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
                  등록된 댓글이 없습니다.
                </div>
              )}
            </section>
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
