/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import {
  Building2,
  FileText,
  Megaphone,
  MessageSquare,
  Paperclip,
  ShieldQuestion,
} from 'lucide-react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import BoardWriteForm from './BoardWriteForm'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import { boardApi } from '../../api/boardApi'
import { ApiError } from '../../api/axiosInstance'
import type { BoardKind, BoardMeta } from '../../types/board'
import type { BoardResponse } from '../../types'

export type BoardVo = BoardResponse

const boardMeta: Record<BoardKind, BoardMeta> = {
  notice: {
    type: 'notice',
    title: '공지사항',
    description: '',
    accentClassName: 'text-red-500',
  },
  department: {
    type: 'department',
    title: '부서게시판',
    description: '',
    accentClassName: 'text-blue-600',
  },
  free: {
    type: 'free',
    title: '자유게시판',
    description: '',
    accentClassName: 'text-emerald-600',
  },
  anonymous: {
    type: 'anonymous',
    title: '익명게시판',
    description: '',
    accentClassName: 'text-violet-600',
  },
}

const boardIcon: Record<BoardKind, typeof Megaphone> = {
  notice: Megaphone,
  department: Building2,
  free: MessageSquare,
  anonymous: ShieldQuestion,
}

const departmentNameMap: Record<string, string> = {
  dev: '개발팀',
  ops: '운영팀',
  design: '디자인팀',
  hr: '인사팀',
  marketing: '마케팅팀',
}

const getBoardTypeFromPath = (pathname: string): BoardKind => {
  if (pathname.includes('/departments') || pathname.includes('/dept/')) return 'department'
  if (pathname.includes('/free')) return 'free'
  if (pathname.includes('/anonymous') || pathname.includes('/anon')) return 'anonymous'
  return 'notice'
}

const getBoardDetailPath = (boardType: BoardKind, boardId: number, deptCd?: string) => {
  if (boardType === 'department' && deptCd) {
    return `/boards/dept/${encodeURIComponent(deptCd)}/${boardId}`
  }

  if (boardType === 'department') {
    return `/boards/departments/${boardId}`
  }

  if (boardType === 'free') {
    return `/boards/free/${boardId}`
  }

  if (boardType === 'anonymous') {
    return `/boards/anonymous/${boardId}`
  }

  return `/boards/notices/${boardId}`
}

const formatBoardAuthor = (board: BoardResponse, boardType: BoardKind) => {
  if (boardType === 'anonymous') return '익명'

  const employeeName = board.empNm?.trim()

  if (employeeName) {
    return `${employeeName}(${board.frstRgtrId})`
  }

  return `사원(${board.frstRgtrId})`
}

const isImportantBoard = (board: BoardResponse) =>
  board.imprtntYn?.trim().toUpperCase() === 'Y'

interface BoardPageMetadata {
  totalPages?: number
  totalElements?: number
  size?: number
}

const getFinitePositiveNumber = (...values: Array<number | undefined>) =>
  values.find((value): value is number => (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  ))

const getBoardTotalPages = (
  pageData?: BoardPageMetadata | null,
  pagination?: BoardPageMetadata | null,
) => {
  const totalElements = getFinitePositiveNumber(
    pageData?.totalElements,
    pagination?.totalElements,
  )
  const pageSize = getFinitePositiveNumber(
    pageData?.size,
    pagination?.size,
    10,
  )

  if (totalElements && pageSize) {
    return Math.max(1, Math.ceil(totalElements / pageSize))
  }

  return getFinitePositiveNumber(
    pageData?.totalPages,
    pagination?.totalPages,
    1,
  ) ?? 1
}

const getVerifiedNoticeTotalPages = async (
  candidateTotalPages: number,
  keyword: string,
) => {
  if (candidateTotalPages <= 1) return candidateTotalPages

  const response = await boardApi.getBoards({
    type: 'notice',
    page: candidateTotalPages,
    keyword,
  })
  const content = response.data.data?.content ?? []

  return content.length > 0 ? candidateTotalPages : candidateTotalPages - 1
}

const BoardPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { deptCd } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [boardList, setBoardList] = useState<BoardVo[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [lastPageOverride, setLastPageOverride] = useState<number | null>(null)

  const boardType = getBoardTypeFromPath(location.pathname)
  const isCreateMode = searchParams.get('mode') === 'create'
  const meta = boardMeta[boardType]
  const Icon = boardIcon[boardType]
  const departmentName = deptCd
    ? departmentNameMap[deptCd.toLowerCase()] ?? deptCd
    : ''

  useEffect(() => {
    const fetchBoardData = async () => {
      if (boardType === 'department' && !deptCd) {
        setBoardList([])
        setTotalPages(1)
        setErrorMsg(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMsg(null)

        const response = await boardApi.getBoards({
          type: boardType,
          page,
          keyword,
          departmentCode: deptCd,
        })

        if (response.data?.success) {
          const pageData = response.data.data
          const content = pageData?.content ?? []
          const calculatedTotalPages = getBoardTotalPages(pageData, response.data.pagination)
          const verifiedNoticeTotalPages = boardType === 'notice' && !lastPageOverride
            ? await getVerifiedNoticeTotalPages(calculatedTotalPages, keyword)
            : calculatedTotalPages
          const nextTotalPages = lastPageOverride
            ? Math.min(calculatedTotalPages, lastPageOverride)
            : verifiedNoticeTotalPages

          if (verifiedNoticeTotalPages < calculatedTotalPages) {
            setLastPageOverride(verifiedNoticeTotalPages)
          }

          setTotalPages(nextTotalPages)

          if (page > nextTotalPages) {
            setPage(nextTotalPages)
            return
          }

          if (content.length === 0 && page > 1) {
            const correctedPage = page - 1

            setLastPageOverride((currentOverride) => (
              currentOverride
                ? Math.min(currentOverride, correctedPage)
                : correctedPage
            ))
            setTotalPages(correctedPage)
            setPage(correctedPage)
            return
          }

          setBoardList(content)
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMsg(err.message)
        } else {
          setErrorMsg('데이터를 가져오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchBoardData()
  }, [boardType, keyword, deptCd, page, reloadKey, lastPageOverride])

  useEffect(() => {
    setPage(1)
    setLastPageOverride(null)
  }, [boardType, deptCd, keyword])

  if (isCreateMode) {
    return (
      <BoardWriteForm
        initialBoardType={boardType}
        departmentCode={deptCd}
        onClose={() => setSearchParams({})}
        onCreated={() => {
          setPage(1)
          setReloadKey((current) => current + 1)
        }}
      />
    )
  }

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-white px-10 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Icon size={28} className="text-blue-600" />
            <span className="text-[22px] font-bold text-slate-900">{meta.title}</span>
          </div>

          {boardType === 'department' && deptCd && (
            <>
              <span className="text-2xl text-slate-300">/</span>
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-[18px] font-semibold text-slate-700">
                {departmentName}
              </div>
            </>
          )}
        </div>

        <div className="w-[320px]">
          <SearchInput
            placeholder="제목 검색"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {!loading && !errorMsg && boardList.length > 0 && (
          <div className="flex h-14 items-center border-b border-slate-100 bg-slate-50 px-6 text-sm font-semibold text-slate-500">
            <div className="w-24">번호</div>
            <div className="flex-1">제목</div>
            <div className="w-40">작성자</div>
            <div className="w-40">작성일</div>
          </div>
        )}

        {loading && (
          <div className="flex flex-1 items-center justify-center text-slate-400">로딩중...</div>
        )}

        {!loading && errorMsg && (
          <div className="flex flex-1 items-center justify-center text-red-500">{errorMsg}</div>
        )}

        {!loading && !errorMsg && boardType === 'department' && !deptCd && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-blue-50">
              <Building2 size={74} className="text-blue-300" />
            </div>
            <p className="text-[28px] font-semibold text-slate-600">부서를 선택해주세요.</p>
          </div>
        )}

        {!loading && !errorMsg && deptCd && boardList.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-blue-50">
              <FileText size={74} className="text-blue-300" />
            </div>
            <p className="text-[34px] font-semibold text-slate-600">게시글이 없습니다.</p>
          </div>
        )}

        {!loading && !errorMsg && boardType !== 'department' && boardList.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-blue-50">
              <FileText size={74} className="text-blue-300" />
            </div>
            <p className="text-[34px] font-semibold text-slate-600">게시글이 없습니다.</p>
          </div>
        )}

        {!loading && !errorMsg && boardList.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            {boardList.map((board) => (
              <div
                key={board.boardId}
                role="button"
                tabIndex={0}
                onClick={() => navigate(getBoardDetailPath(boardType, board.boardId, deptCd))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(getBoardDetailPath(boardType, board.boardId, deptCd))
                  }
                }}
                className="flex h-14 cursor-pointer items-center border-b border-slate-100 px-6 text-sm hover:bg-slate-50"
              >
                <div className="w-24 text-slate-600">{board.boardId}</div>
                <div className="flex flex-1 items-center gap-1 font-medium text-slate-800">
                  {isImportantBoard(board) && (
                    <Badge variant="warning" size="sm" className="shrink-0 rounded-md">
                      중요
                    </Badge>
                  )}
                  <span>{board.boardSj}</span>
                  {board.boardAtchFileId !== null && (
                    <Paperclip size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="w-40 text-slate-700">
                  {formatBoardAuthor(board, boardType)}
                </div>
                <div className="w-40 text-slate-500">
                  {board.frstRegDt?.split('T')[0].replace(/-/g, '.')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && !errorMsg && boardList.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </section>
  )
}

export default BoardPage
