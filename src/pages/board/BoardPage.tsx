/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import {
  Building2,
  Megaphone,
  MessageSquare,
  Paperclip,
  ShieldQuestion,
  FileText,
} from 'lucide-react'

import { useLocation, useSearchParams, useParams } from 'react-router-dom'

import BoardWriteForm from './BoardWriteForm'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../../components/common/form/searchInput/SearchInput'

import type { BoardKind, BoardMeta } from '../../types/board'

import axiosInstance, { ApiError } from '../../api/axiosInstance'

export interface BoardVo {
  boardId: number
  boardTypeCd: string
  boardSj: string
  boardCn: string
  frstRgtrId: number
  frstRegDt: string
  lastMdfrDt: string
  boardAtchFileId: number | null
  deptCd: string
  projId: number | null
  imprtntYn: string
  cmntUseYn: string
  viewCnt: number
}

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

const boardIcon = {
  notice: Megaphone,
  department: Building2,
  free: MessageSquare,
  anonymous: ShieldQuestion,
}

const departmentNameMap: Record<string, string> = {
  dev: '개발팀',
  design: '디자인팀',
  hr: '인사팀',
  marketing: '마케팅팀',
}

const getBoardTypeFromPath = (pathname: string): BoardKind => {
  if (pathname.includes('/departments')) return 'department'
  if (pathname.includes('/free')) return 'free'
  if (pathname.includes('/anonymous')) return 'anonymous'
  return 'notice'
}

const BoardPage = () => {
  const location = useLocation()
  const { dept } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  // 페이징 및 상태 관리
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1) // 💡 서버가 주는 totalPages를 저장할 상태 추가
  const [keyword, setKeyword] = useState('')

  const boardType = getBoardTypeFromPath(location.pathname)
  const isCreateMode = searchParams.get('mode') === 'create'
  const meta = boardMeta[boardType]
  const Icon = boardIcon[boardType]

  const [boardList, setBoardList] = useState<BoardVo[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const departmentName = dept ? departmentNameMap[dept] : ''

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)

        // 💡 중요: 백엔드의 ApiResponse 공통 규격을 연동합니다.
        const response = await axiosInstance.get('/api/boards', {
          params: {
            keyword: keyword.trim() || undefined,
            boardTypeCd: boardType.toUpperCase(), // 백엔드 DTO(boardTypeCd)에 매핑 및 대문자화
            deptCd: boardType === 'department' ? dept?.toUpperCase() : undefined,
            page: page, // 💡 현재 페이지 번호를 백엔드로 전달합니다 (1-based 기준)
            size: 10,
          },
        })

        if (response.data?.success) {
          // 💡 data에서 목록을 꺼내고, pagination에서 전체 페이지 수를 세팅합니다.
          setBoardList(response.data.data ?? [])
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
          }
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

    fetchBoardData()
    // 💡 page가 변경될 때마다 서버에 새 데이터를 요청하도록 의존성 배열에 page 추가
  }, [boardType, keyword, dept, page])

  useEffect(() => {
    setPage(1)
  }, [boardType, dept])

  if (isCreateMode) {
    return (
      <BoardWriteForm
        initialBoardType={boardType}
        onClose={() => setSearchParams({})}
      />
    )
  }

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-white px-10 py-8">
      {/* 상단 Breadcrumb & 검색바 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Icon size={28} className="text-blue-600" />
            <span className="text-[22px] font-bold text-slate-900">{meta.title}</span>
          </div>

          {boardType === 'department' && (
            <>
              <span className="text-2xl text-slate-300">›</span>
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
              setPage(1) // 검색어 변경 시 첫 페이지로 리셋
            }}
          />
        </div>
      </div>

      {/* 테이블 데이터 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {/* 헤더 */}
        {!loading && !errorMsg && boardList.length > 0 && (
          <div className="flex h-14 items-center border-b border-slate-100 bg-slate-50 px-6 text-sm font-semibold text-slate-500">
            <div className="w-24">번호</div>
            <div className="flex-1">제목</div>
            <div className="w-40">작성자</div>
            <div className="w-40">작성일</div>
          </div>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <div className="flex flex-1 items-center justify-center text-slate-400">로딩중...</div>
        )}

        {/* 에러 발생시 */}
        {!loading && errorMsg && (
          <div className="flex flex-1 items-center justify-center text-red-500">{errorMsg}</div>
        )}

        {/* 게시글 데이터가 완전히 없을 때 (업로드 이미지 디자인 대응) */}
        {!loading && !errorMsg && boardList.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-blue-50">
              <FileText size={74} className="text-blue-300" />
            </div>
            <p className="text-[34px] font-semibold text-slate-600">게시글이 없습니다.</p>
          </div>
        )}

        {/* 실제 게시글 리스트 출력 */}
        {!loading && !errorMsg && boardList.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            {boardList.map((board) => (
              <div
                key={board.boardId}
                className="flex h-14 items-center border-b border-slate-100 px-6 text-sm hover:bg-slate-50 cursor-pointer"
              >
                <div className="w-24 text-slate-600">{board.boardId}</div>
                <div className="flex flex-1 items-center gap-1 font-medium text-slate-800">
                  <span>{board.boardSj}</span>
                  {board.boardAtchFileId !== null && (
                    <Paperclip size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="w-40 text-slate-700">사원({board.frstRgtrId})</div>
                <div className="w-40 text-slate-500">
                  {board.frstRegDt?.split('T')[0].replace(/-/g, '.')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 페이지네이션 컴포넌트 */}
      {!loading && !errorMsg && boardList.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </section>
  )
}

export default BoardPage