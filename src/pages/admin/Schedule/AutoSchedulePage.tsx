import { useEffect, useState } from 'react'
import { useApi } from '../../../hooks/useApi'
import { adminScheduleApi } from '../../../api/adminScheduleApi'
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const AUTO_CLSF_CODES = ['C005', 'C006', 'C007', 'C008']

const CLSF_COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  C005: { bg: '#E0F7FA', border: '#26C6DA', text: '#00838F' },
  C006: { bg: '#F1F3F4', border: '#9AA0A6', text: '#3C4043' },
  C007: { bg: '#FCE8E6', border: '#EA4335', text: '#C5221F' },
  C008: { bg: '#E2F2F1', border: '#00BFA5', text: '#00695C' },
}

const CLSF_LABEL_MAP: Record<string, string> = {
  C005: '프로젝트',
  C006: '업무',
  C007: '화상회의',
  C008: '회의실',
}

const CLSF_ORIGIN_PATH: Record<string, string> = {
  C005: '/projects',
  C006: '/project/tasks',
  C007: '/meeting',
  C008: '/reservation',
}

const PAGE_SIZE = 15

export default function AutoSchedulePage() {
  const [keyword, setKeyword] = useState('')
  const [selectedClsfCds, setSelectedClsfCds] = useState<string[]>(AUTO_CLSF_CODES)
  const [page, setPage] = useState(0)

  const {
    data: pageData,
    loading,
    execute: fetchList,
  } = useApi(adminScheduleApi.getSchdList, { immediate: false })

  useEffect(() => {
    void fetchList({
      schdClsfCdList: selectedClsfCds,
      keyword: keyword || undefined,
      page,
      size: PAGE_SIZE,
    })
  }, [selectedClsfCds, keyword, page, fetchList])

  const scheduleList = pageData?.content ?? []
  const pagination = pageData?.pagination

  const totalPages = pagination ? Math.ceil(pagination.totalElements / PAGE_SIZE) : 0

  const toggleClsf = (cd: string) => {
    setPage(0)
    setSelectedClsfCds((prev) =>
      prev.includes(cd) ? prev.filter((c) => c !== cd) : [...prev, cd]
    )
  }

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    setPage(0)
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen p-6 font-sans text-[#191c1e]">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        <div>
          <p className="text-xs text-[#717785] mb-1">관리자 &gt; 일정 관리</p>
          <h1 className="text-2xl font-bold tracking-tight">자동 생성 일정 조회</h1>
          <p className="mt-1 text-sm text-[#414753]">
            프로젝트/업무/회의/화상회의에서 자동 생성된 일정입니다. 수정은 원본에서 진행하세요.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {AUTO_CLSF_CODES.map((cd) => {
            const color = CLSF_COLOR_MAP[cd]
            const count = scheduleList.filter((s) => s.schdClsfCd === cd).length
            return (
              <div
                key={cd}
                className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {CLSF_LABEL_MAP[cd]}
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: color.border }}>
                  {count}
                </p>
                <p className="text-xs text-[#717785] mt-1">현재 페이지 기준</p>
              </div>
            )
          })}
        </div>

        <div className="bg-white border border-[#c0c6d5] rounded-xl shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-[#c0c6d5] flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {AUTO_CLSF_CODES.map((cd) => {
                const color = CLSF_COLOR_MAP[cd]
                const active = selectedClsfCds.includes(cd)
                return (
                  <button
                    key={cd}
                    onClick={() => toggleClsf(cd)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? 'border-transparent text-white'
                        : 'border-[#c0c6d5] text-[#717785] bg-white'
                    }`}
                    style={active ? { backgroundColor: color.border } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: active ? 'white' : color.border }}
                    />
                    {CLSF_LABEL_MAP[cd]}
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717785]" />
              <input
                type="text"
                placeholder="일정명 / 등록자 검색"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm border border-[#c0c6d5] rounded-lg focus:ring-2 focus:ring-[#005cad] focus:border-[#005cad] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-sm text-[#414753]">로딩 중...</div>
            ) : scheduleList.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#414753]">
                자동 생성된 일정이 없습니다.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f2f4f6] text-xs font-semibold text-[#717785] uppercase tracking-wider border-b border-[#c0c6d5]">
                    <th className="px-4 py-3">일정 제목</th>
                    <th className="px-4 py-3">출처</th>
                    <th className="px-4 py-3">시작일</th>
                    <th className="px-4 py-3">종료일</th>
                    <th className="px-4 py-3">등록자</th>
                    <th className="px-4 py-3 text-center">원본 이동</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c6d5]">
                  {scheduleList.map((s) => {
                    const color = CLSF_COLOR_MAP[s.schdClsfCd ?? '']
                    return (
                      <tr key={s.schdId} className="hover:bg-[#f7f9fb] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#191c1e]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color?.border ?? '#9aa0a6' }}
                            />
                            {s.schdNm}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: color?.bg ?? '#f1f3f4',
                              color: color?.text ?? '#3c4043',
                            }}
                          >
                            {CLSF_LABEL_MAP[s.schdClsfCd ?? ''] ?? s.schdClsfCd}
                            &nbsp;Auto
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#414753]">
                          {s.beginDt?.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3 text-[#414753]">
                          {s.endDt?.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#191c1e]">{s.wrtrNm}</span>
                            <span className="text-xs text-[#717785]">{s.wrtrDeptNm}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          
                            <a href={CLSF_ORIGIN_PATH[s.schdClsfCd ?? '']}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#005cad] hover:underline"
                          >
                            원본 상세로 이동
                            <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-4 border-t border-[#c0c6d5] flex justify-between items-center text-xs text-[#414753]">
            <span>
              전체 {pagination?.totalElements ?? 0}개 중{' '}
              {page * PAGE_SIZE + 1}~{Math.min((page + 1) * PAGE_SIZE, pagination?.totalElements ?? 0)}개 표시
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 hover:bg-[#f2f4f6] rounded-lg disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                const pageNum = Math.max(0, page - 2) + idx
                if (pageNum >= totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-all ${
                      page === pageNum
                        ? 'bg-[#005cad] text-white'
                        : 'hover:bg-[#f2f4f6]'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 hover:bg-[#f2f4f6] rounded-lg disabled:opacity-30 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </div>

        <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-xl p-4 text-sm text-[#7B5800]">
          <p className="font-semibold mb-1">자동 생성 일정 안내</p>
          <p>자동 생성 일정은 프로젝트, 업무, 회의 등 원본 데이터에서 생성된 일정입니다. 일정 정보의 불일치를 방지하기 위해 수정은 원본 화면에서 진행합니다.</p>
        </div>

      </div>
    </div>
  )
}