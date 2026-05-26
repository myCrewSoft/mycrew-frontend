import { useMemo, useState } from 'react'
import { Building2, Megaphone, MessageSquare, Paperclip, ShieldQuestion } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import Select from '../../components/common/form/select/Select'
import type { BoardKind, BoardListItem, BoardMeta } from '../../types/board'

const boardMeta: Record<BoardKind, BoardMeta> = {
  notice: {
    type: 'notice',
    title: '공지사항',
    description: '회사 주요 공지사항을 안내하는 게시판입니다.',
    accentClassName: 'text-red-500',
  },
  department: {
    type: 'department',
    title: '부서게시판',
    description: '부서 구성원 간의 업무 공유 및 협업을 위한 게시판입니다.',
    accentClassName: 'text-blue-600',
  },
  free: {
    type: 'free',
    title: '자유게시판',
    description: '자유롭게 의견을 나누고 소통하는 공간입니다.',
    accentClassName: 'text-emerald-600',
  },
  anonymous: {
    type: 'anonymous',
    title: '익명게시판',
    description: '익명으로 자유롭게 의견을 나눌 수 있는 공간입니다.',
    accentClassName: 'text-violet-600',
  },
}

const boardIcon = {
  notice: Megaphone,
  department: Building2,
  free: MessageSquare,
  anonymous: ShieldQuestion,
}

const departments = [
  { value: 'DEV', label: '개발팀' },
  { value: 'PLAN', label: '기획팀' },
  { value: 'DESIGN', label: '디자인팀' },
  { value: 'HR', label: '인사팀' },
  { value: 'GENERAL', label: '총무팀' },
]

const sampleRows: Record<BoardKind, BoardListItem[]> = {
  notice: [
    { id: 1025, type: 'notice', title: '2024년 하반기 정기 점검 안내 (05/25, 22:00 ~ 05/26, 06:00)', authorName: '관리자', createdAt: '2024.05.20', isPinned: true },
    { id: 1024, type: 'notice', title: '사무실 냉난방 시스템 점검 안내', authorName: '총무팀', createdAt: '2024.05.17' },
    { id: 1023, type: 'notice', title: '2024년 1분기 우수사원 포상 안내', authorName: '경영지원팀', createdAt: '2024.05.16' },
    { id: 1022, type: 'notice', title: '사내 동호회 활동 지원 안내', authorName: '동호회 담당자', createdAt: '2024.05.15' },
    { id: 1021, type: 'notice', title: '업무용 소프트웨어 업데이트 안내', authorName: 'IT지원팀', createdAt: '2024.05.14' },
    { id: 1020, type: 'notice', title: '법정의무교육 실시 안내', authorName: '인사팀', createdAt: '2024.05.13' },
    { id: 1019, type: 'notice', title: '근로기준법 개정에 따른 임금 관련 안내', authorName: '인사팀', createdAt: '2024.05.10' },
    { id: 1018, type: 'notice', title: '사내 보안 강화 지침 및 보안 점검 안내', authorName: '보안팀', createdAt: '2024.05.08' },
    { id: 1017, type: 'notice', title: '사내 식당 메뉴 개편 및 가격 변동 안내', authorName: '총무팀', createdAt: '2024.05.04' },
    { id: 1016, type: 'notice', title: '사옥 주변 도로 통제 및 우회 안내', authorName: '총무팀', createdAt: '2024.05.02' },
  ],
  department: [
    { id: 105, type: 'department', title: '주간 개발 회의 내용 공유', authorName: '김개발', createdAt: '2024.05.21' },
    { id: 104, type: 'department', title: '프로젝트 일정 변경 안내', authorName: '박과장', createdAt: '2024.05.20' },
    { id: 103, type: 'department', title: 'API 문서 최신 버전 업로드', authorName: '최주임', createdAt: '2024.05.18' },
    { id: 102, type: 'department', title: 'UI 컴포넌트 공통화 진행 상황', authorName: '김개발', createdAt: '2024.05.17', hasAttachment: true },
    { id: 101, type: 'department', title: '1004 코드 리뷰 결과 공유', authorName: '이주임', createdAt: '2024.05.16' },
  ],
  free: [
    { id: 205, type: 'free', title: '오늘 점심 추천해주세요!', authorName: '홍길동', createdAt: '2024.05.21', viewCount: 128, commentCount: 12 },
    { id: 204, type: 'free', title: '주말에 가볼 만한 곳 추천!', authorName: '김민수', createdAt: '2024.05.20', viewCount: 205, commentCount: 18 },
    { id: 203, type: 'free', title: '업무 힘드시나요? 화이팅!', authorName: '이지원', createdAt: '2024.05.20', viewCount: 187, commentCount: 22 },
    { id: 202, type: 'free', title: '회사 근처 숨은 맛집 공유합니다', authorName: '박선민', createdAt: '2024.05.19', viewCount: 234, commentCount: 25 },
    { id: 201, type: 'free', title: '요즘 같이 읽을 책 구해요!', authorName: '이하늘', createdAt: '2024.05.19', viewCount: 95, commentCount: 9 },
  ],
  anonymous: [
    { id: 305, type: 'anonymous', title: '연차 사용 눈치 보일 때...', authorName: '익명1', createdAt: '2024.05.21', viewCount: 156, commentCount: 23 },
    { id: 304, type: 'anonymous', title: '회사 복지 제안', authorName: '익명2', createdAt: '2024.05.20', viewCount: 289, commentCount: 31 },
    { id: 303, type: 'anonymous', title: '야근 수당 관련 의견', authorName: '익명3', createdAt: '2024.05.20', viewCount: 198, commentCount: 27 },
    { id: 302, type: 'anonymous', title: '회사 분위기 개선 제안', authorName: '익명4', createdAt: '2024.05.19', viewCount: 234, commentCount: 19 },
    { id: 301, type: 'anonymous', title: '업무 프로세스 개선 제안', authorName: '익명5', createdAt: '2024.05.19', viewCount: 167, commentCount: 15 },
  ],
}

const getBoardTypeFromPath = (pathname: string): BoardKind => {
  if (pathname.includes('/departments')) return 'department'
  if (pathname.includes('/free')) return 'free'
  if (pathname.includes('/anonymous')) return 'anonymous'
  return 'notice'
}

const BoardPage = () => {
  const location = useLocation()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [departmentCode, setDepartmentCode] = useState(departments[0].value)
  const boardType = getBoardTypeFromPath(location.pathname)
  const meta = boardMeta[boardType]
  const Icon = boardIcon[boardType]
  
  // 1. 실제 검색/필터링된 데이터 계산
  const filteredRows = useMemo(() => {
    const source = sampleRows[boardType]
    if (!keyword.trim()) return source

    return source.filter((row) => row.title.includes(keyword.trim()))
  }, [boardType, keyword])

  // 2. 변경 포인트 1: 한 페이지에 보여줄 타깃 행 개수 지정 (10개)
  const ITEMS_PER_PAGE = 10

  // 3. 변경 포인트 2: 하단 총 쪽수(totalPages)를 실제 데이터 개수에 맞춰 유동적으로 연산
  //    데이터가 5개면 5/10 올림 = 1페이지, 검색결과가 아예 없어도 최소 1페이지 보장
  const totalPages = useMemo(() => {
    const count = Math.ceil(filteredRows.length / ITEMS_PER_PAGE)
    return count < 1 ? 1 : count
  }, [filteredRows])

  // 4. 화면 비율을 유지하기 위한 빈 껍데기 가상 행(Row) 생성 로직
  const rows = useMemo(() => {
    const result = [...filteredRows]
    
    // 데이터가 10개 미만일 때만 부족한 만큼 정확하게 채워넣음
    while (result.length < ITEMS_PER_PAGE) {
      result.push({
        id: -1 - result.length, // 고유 Key 에러 방지용 가상 음수 ID
        type: boardType,
        title: '',
        authorName: '',
        createdAt: '',
      })
    }
    return result
  }, [filteredRows, boardType])
  
  const showCommunityColumns = boardType === 'free' || boardType === 'anonymous'

  return (
    <section className="flex h-full max-h-full w-full flex-col rounded-lg border border-slate-200 bg-white px-8 py-7 shadow-sm overflow-hidden select-none">
      
      {/* 상단 타이틀 & 검색 영역 */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={21} className={meta.accentClassName} />
            <h1 className="text-xl font-bold text-slate-900">{meta.title}</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">{meta.description}</p>

          {boardType === 'department' && (
            <div className="mt-4 w-48">
              <Select
                aria-label="부서 선택"
                options={departments}
                value={departmentCode}
                onChange={(event) => setDepartmentCode(event.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <SearchInput
            wrapperClassName="sm:w-64"
            placeholder="제목 검색"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* 게시판 테이블 본체 컨테이너 */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-lg border border-slate-100 text-sm min-h-0">
        
        {/* 헤더 Row */}
        <div className="bg-slate-50 text-xs font-semibold text-slate-500 flex items-center h-12 border-b border-slate-100 flex-shrink-0 px-5">
          <div className="w-24 flex-shrink-0">번호</div>
          <div className="flex-1 min-w-0">제목</div>
          <div className="w-36 flex-shrink-0">작성자</div>
          <div className="w-36 flex-shrink-0">작성일</div>
          {showCommunityColumns && <div className="w-24 flex-shrink-0">조회수</div>}
          {showCommunityColumns && <div className="w-24 flex-shrink-0">댓글수</div>}
        </div>

        {/* 본문 행(Row) 리스트 */}
        <div className="flex-1 flex flex-col divide-y divide-slate-100 overflow-hidden bg-white min-h-0">
          {rows.map((row) => {
            const isEmptyRow = row.id < 0 // 가상으로 채워진 빈 행인지 판별

            return (
              <div key={row.id} className="flex flex-1 items-center px-5 min-h-0 overflow-hidden hover:bg-slate-50/40">
                {/* 번호 */}
                <div className="w-24 flex-shrink-0 text-slate-600 truncate">
                  {!isEmptyRow && (
                    row.isPinned ? <span className="font-bold text-red-500">공지</span> : row.id
                  )}
                </div>
                
                {/* 제목 */}
                <div className="flex-1 font-medium text-slate-800 pr-4 min-w-0 truncate">
                  {!isEmptyRow && (
                    <span className="inline-flex items-center gap-1.5 max-w-full truncate">
                      <span className="truncate">{row.title}</span>
                      {row.hasAttachment && <Paperclip size={14} className="text-slate-400 flex-shrink-0" />}
                    </span>
                  )}
                </div>
                
                {/* 작성자 */}
                <div className="w-36 flex-shrink-0 text-slate-700 truncate">
                  {!isEmptyRow && row.authorName}
                </div>
                
                {/* 작성일 */}
                <div className="w-36 flex-shrink-0 text-slate-600 truncate">
                  {!isEmptyRow && row.createdAt}
                </div>
                
                {/* 조회수 */}
                {showCommunityColumns && (
                  <div className="w-24 flex-shrink-0 text-slate-600 truncate">
                    {!isEmptyRow && (row.viewCount ?? 0)}
                  </div>
                )}
                
                {/* 댓글수 */}
                {showCommunityColumns && (
                  <div className="w-24 flex-shrink-0 text-slate-600 truncate">
                    {!isEmptyRow && (row.commentCount ?? 0)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 하단 페이지네이션 영역 (변경 포인트 3: 가짜 하드코딩 30을 지우고 유동적인 totalPages 바인딩) */}
      <div className="mt-5 flex justify-center flex-shrink-0">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  )
}

export default BoardPage