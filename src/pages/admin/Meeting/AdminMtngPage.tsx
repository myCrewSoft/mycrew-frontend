import { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  Play,
  CheckCircle2,
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AdminMtngDetailResponse, AdminMtngListRequest, AdminMtngListResponse } from '../../../types'
import { useApi } from '../../../hooks/useApi'
import { adminMtngApi } from '../../../api/adminMtngApi'

const MTNG_TYPE_LABEL: Record<string, string> = {
  '01': '온라인',
  '02': '오프라인',
  '03': '복합',
}

const VCONF_STTUS: Record<string, { label: string; className: string }> = {
  VC001: { label: '예정', className: 'bg-[#dae2fd] text-[#005cad]' },
  VC002: { label: '진행중', className: 'bg-[#d3f4e3] text-[#1a7a4a]' },
  VC003: { label: '완료', className: 'bg-[#f2f4f6] text-[#717785]' },
}

const MOM_STTUS_LABEL: Record<string, string> = {
  '01': 'AI초안',
  '02': '편집중',
  '03': '결재요청',
  '04': '확정',
}

const INITIAL_FILTER: AdminMtngListRequest = {
  keyword: '',
  mtngTypeCd: '',
  vconfSttus: '',
  momSttusCd: '',
  beginDt: '',
  endDt: '',
  includeDeleted: false,
  page: 1,
  size: 10
}

export default function AdminMtngPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<AdminMtngListRequest>(INITIAL_FILTER)
  const [selectedMtng, setSelectedMtng] = useState<AdminMtngDetailResponse | null>(null)
  const [showFilter, setShowFilter] = useState(false)

  const { data: pageData, execute: fetchList, loading: listLoading } = useApi(
    adminMtngApi.getAdminMtngList,
    { immediate: false },
  )

  const { data: stats, execute: fetchStats } = useApi(
    adminMtngApi.getAdminMtngStats,
    { immediate: true },
  )

  const { execute: fetchDetail } = useApi(
    adminMtngApi.getAdminMtngDetail,
    { immediate: false },
  )

  const { execute: execForceEnd } = useApi(
    adminMtngApi.forceEndMtng,
    { immediate: false },
  )

  useEffect(() => {
    void fetchList(filter)
  }, [filter, fetchList])

  const handleFilterChange = useCallback(
    (key: keyof AdminMtngListRequest, value: string) => {
      setFilter((prev: AdminMtngListRequest) => ({ ...prev, [key]: value, page: 1 }))
    },
    [],
  )

  const handleReset = useCallback(() => setFilter(INITIAL_FILTER), [])

  const handlePageChange = useCallback((page: number) => {
    setFilter((prev: AdminMtngListRequest) => ({ ...prev, page }))
  }, [])

  const handleOpenDetail = useCallback(
    async (mtngId: number) => {
      const res = await fetchDetail(mtngId)
      if (res.data) setSelectedMtng(res.data)
    },
    [fetchDetail],
  )

  const handleForceEnd = useCallback(
    async (mtngId: number) => {
      if (!window.confirm('진행중인 회의를 강제 종료하시겠습니까?')) return
      await execForceEnd(mtngId)
      void fetchList(filter)
      void fetchStats()
      setSelectedMtng(null)
    },
    [execForceEnd, fetchList, fetchStats, filter],
  )

  const totalPages = pageData?.totalPages ?? 0
  const currentPage = filter.page ?? 1
  const totalCount = pageData?.totalCount ?? 0
  const meetings = pageData?.meetings ?? []

  return (
    <section className="flex w-full flex-col gap-6 font-sans text-[#191c1e]">

          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">회의 운영관리</h1>
              <p className="mt-1 text-sm text-[#414753]">
                전체 회의의 운영 상태와 회의록/녹취록 현황을 관리합니다.
              </p>
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="오늘의 예정 회의"
              value={stats?.todayScheduledCnt ?? 0}
              icon={<Calendar size={24} />}
              iconBg="bg-[#e5efe8] text-[#6f8f76]"
              valueColor="text-[#005cad]"
            />
            <StatCard
              label="현재 진행 중"
              value={stats?.inProgressCnt ?? 0}
              icon={<Play size={24} />}
              iconBg="bg-[#dae2fd] text-[#565e74]"
              valueColor="text-[#004788]"
            />
            <StatCard
              label="완료된 회의"
              value={stats?.completedCnt ?? 0}
              icon={<CheckCircle2 size={24} />}
              iconBg="bg-[#d3e5f1] text-[#4e5e68]"
              valueColor="text-[#4e5e68]"
            />
            <StatCard
              label="AI 회의록 생성 대기"
              value={stats?.aiPendingCnt ?? 0}
              icon={<Sparkles size={24} />}
              iconBg="bg-[#dae2fd] text-[#565e74]"
              valueColor="text-[#565e74]"
            />
          </div>

          {/* 탭 */}
          <div className="flex gap-6 border-b border-[#c0c6d5]">
            <button className="border-b-2 border-[#005cad] pb-3 text-sm font-semibold text-[#005cad]">
              전체 회의
            </button>
            <button
              onClick={() => navigate('/admin/meeting/stats')}
              className="pb-3 text-sm font-medium text-[#717785] hover:text-[#414753]"
            >
              통계
            </button>
          </div>

          {/* 테이블 카드 */}
          <div className="overflow-hidden rounded-xl border border-[#c0c6d5] bg-white shadow-sm">

            {/* 검색 + 필터 바 */}
            <div className="flex items-center justify-between gap-3 border-b border-[#c0c6d5] bg-white px-5 py-4">
              <div className="relative w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#414753]" />
                <input
                  type="text"
                  placeholder="회의명, 생성자 검색..."
                  value={filter.keyword ?? ''}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                  className="w-full rounded-lg border border-[#c0c6d5] bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[#005cad] focus:ring-2 focus:ring-[#005cad]/20"
                />
              </div>
              <div className="flex items-center gap-2">
                {showFilter && (
                  <>
                    <FilterSelect
                      value={filter.mtngTypeCd ?? ''}
                      onChange={(v) => handleFilterChange('mtngTypeCd', v)}
                      options={[
                        { value: '', label: '회의 타입: 전체' },
                        { value: '01', label: '온라인' },
                        { value: '02', label: '오프라인' },
                        { value: '03', label: '복합' },
                      ]}
                    />
                    <FilterSelect
                      value={filter.vconfSttus ?? ''}
                      onChange={(v) => handleFilterChange('vconfSttus', v)}
                      options={[
                        { value: '', label: '상태: 전체' },
                        { value: 'VC001', label: '예정' },
                        { value: 'VC002', label: '진행중' },
                        { value: 'VC003', label: '완료' },
                      ]}
                    />
                    <FilterSelect
                      value={filter.momSttusCd ?? ''}
                      onChange={(v) => handleFilterChange('momSttusCd', v)}
                      options={[
                        { value: '', label: '회의록: 전체' },
                        { value: '01', label: 'AI초안' },
                        { value: '02', label: '편집중' },
                        { value: '03', label: '결재요청' },
                        { value: '04', label: '확정' },
                      ]}
                    />
                    {(filter.mtngTypeCd || filter.vconfSttus || filter.momSttusCd) && (
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1 text-xs text-[#717785] hover:text-[#414753]"
                      >
                        <X size={13} />
                        초기화
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setShowFilter((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                    showFilter
                      ? 'border-[#005cad] bg-[#005cad]/5 text-[#005cad]'
                      : 'border-[#c0c6d5] text-[#414753] hover:bg-[#f2f4f6]'
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  필터
                </button>
              </div>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              {listLoading ? (
                <div className="py-16 text-center text-sm text-[#414753]">데이터 로딩 중...</div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#c0c6d5] bg-[#f2f4f6]/50 text-xs font-semibold uppercase tracking-wider text-[#717785]">
                      <th className="px-6 py-4">회의명</th>
                      <th className="px-6 py-4">유형</th>
                      <th className="px-6 py-4">진행 상태</th>
                      <th className="px-6 py-4">일시</th>
                      <th className="px-6 py-4">생성자</th>
                      <th className="px-6 py-4">참석/장소</th>
                      <th className="px-6 py-4">회의록</th>
                      <th className="px-6 py-4 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c6d5]">
                    {meetings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-sm text-[#414753]">
                          조회된 회의가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      meetings.map((mtng) => (
                        <MtngTableRow
                          key={mtng.mtngId}
                          mtng={mtng}
                          onDetail={handleOpenDetail}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between border-t border-[#c0c6d5] bg-white px-5 py-4 text-xs text-[#414753]">
              <span>전체 {totalCount}개 중 {meetings.length}개 표시 중</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg p-1 transition-all hover:bg-[#f2f4f6] disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold transition-all ${
                        p === currentPage
                          ? 'bg-[#005cad] text-white'
                          : 'hover:bg-[#f2f4f6]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg p-1 transition-all hover:bg-[#f2f4f6] disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
      {/* 상세 모달 */}
      {selectedMtng && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#2d3133]/40 backdrop-blur-sm"
              onClick={() => setSelectedMtng(null)}
            />
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#c0c6d5] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#c0c6d5] bg-gray-50 p-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#191c1e]">{selectedMtng.mtngNm}</h3>
                  {selectedMtng.vconfSttus && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VCONF_STTUS[selectedMtng.vconfSttus]?.className}`}>
                      {VCONF_STTUS[selectedMtng.vconfSttus]?.label}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMtng(null)}
                  className="rounded-full p-1 hover:bg-[#f2f4f6]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <InfoBlock label="회의 시간" value={`${formatDt(selectedMtng.beginDt)} ~ ${formatDt(selectedMtng.endDt)}`} />
                  <InfoBlock label="개설자" value={selectedMtng.crtrNm} />
                  {selectedMtng.confRmNm && <InfoBlock label="회의실" value={selectedMtng.confRmNm} />}
                  {selectedMtng.roomNm && <InfoBlock label="온라인 링크" value={selectedMtng.roomNm} />}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold text-[#414753]">
                    참석자 현황 ({selectedMtng.ptcpts.length}명)
                  </p>
                  <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
                    {selectedMtng.ptcpts.map((p) => (
                      <div key={p.empId} className="flex items-center gap-3 rounded-lg bg-[#f2f4f6] px-3 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c0c6d5] text-xs font-bold text-[#414753]">
                          {p.empNm[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#191c1e]">{p.empNm}</p>
                          <p className="text-xs text-[#717785]">{p.deptNm} · {p.jbgdNm}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMtng.momSttusCd && (
                  <div className="rounded-lg bg-[#dae2fd] px-3 py-2 text-xs font-medium text-[#005cad]">
                    회의록 상태: {MOM_STTUS_LABEL[selectedMtng.momSttusCd] ?? selectedMtng.momSttusCd}
                  </div>
                )}
              </div>

              {selectedMtng.vconfSttus === 'VC002' && (
                <div className="border-t border-[#c0c6d5] p-5 pt-4">
                  <button
                    onClick={() => void handleForceEnd(selectedMtng.mtngId)}
                    className="w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    회의 강제 종료
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value, icon, iconBg, valueColor }: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  valueColor: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#c0c6d5] bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-medium text-[#414753]">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${iconBg}`}>{icon}</div>
    </div>
  )
}

function FilterSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[#c0c6d5] bg-white py-2 pl-3 pr-7 text-xs text-[#414753] outline-none focus:border-[#005cad] focus:ring-2 focus:ring-[#005cad]/20"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function MtngTableRow({ mtng, onDetail }: {
  mtng: AdminMtngListResponse
  onDetail: (id: number) => void
}) {
  const sttus = mtng.vconfSttus ? VCONF_STTUS[mtng.vconfSttus] : null

  return (
    <tr className="transition-colors hover:bg-[#f2f4f6]">
      <td className="px-6 py-4 font-semibold text-[#191c1e]">{mtng.mtngNm}</td>
      <td className="px-6 py-4">
        <span className="rounded-full border border-[#c0c6d5] px-2.5 py-0.5 text-xs text-[#414753]">
          {MTNG_TYPE_LABEL[mtng.mtngTypeCd] ?? mtng.mtngTypeCd}
        </span>
      </td>
      <td className="px-6 py-4">
        {sttus ? (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sttus.className}`}>
            {sttus.label}
          </span>
        ) : (
          <span className="text-[#c0c6d5]">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-xs text-[#414753]">{formatDt(mtng.beginDt)}</td>
      <td className="px-6 py-4 text-sm text-[#414753]">{mtng.crtrNm}</td>
      <td className="px-6 py-4">
        <p className="text-xs text-[#414753]">{mtng.ptcptCnt}명</p>
        {mtng.confRmNm && <p className="text-xs text-[#717785]">{mtng.confRmNm}</p>}
      </td>
      <td className="px-6 py-4 text-xs text-[#414753]">
        {mtng.momSttusCd ? MOM_STTUS_LABEL[mtng.momSttusCd] ?? mtng.momSttusCd : '-'}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => onDetail(mtng.mtngId)}
          className="rounded-lg p-2 text-[#6f8f76] transition-all hover:bg-[#e5efe8]"
          title="상세 보기"
        >
          <Edit3 size={18} />
        </button>
      </td>
    </tr>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#c0c6d5] px-3 py-2.5">
      <p className="text-xs font-bold text-[#717785]">{label}</p>
      <p className="mt-0.5 text-sm text-[#191c1e]">{value}</p>
    </div>
  )
}

function formatDt(dt: string) {
  const d = new Date(dt)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
