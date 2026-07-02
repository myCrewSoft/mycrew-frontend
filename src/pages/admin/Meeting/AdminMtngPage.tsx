import { useCallback, useEffect, useMemo, useState } from 'react'
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
  MapPin,
  Users,
  CalendarClock,
  FileText,
  Video,
} from 'lucide-react'
import type {
  AdminMtngDetailResponse,
  AdminMtngListRequest,
  AdminMtngListResponse,
  AdminMtngPtcptResponse,
} from '../../../types'
import type { AdminEmployeeListItem } from '../../../types/adminEmployee'
import { useApi } from '../../../hooks/useApi'
import { adminMtngApi } from '../../../api/adminMtngApi'
import { adminApi } from '../../../api/adminApi'
import Badge, { type BadgeVariant } from '../../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'

const MTNG_TYPE_LABEL: Record<string, string> = {
  '01': '온라인',
  '02': '오프라인',
  '03': '혼합',
}

const MTNG_TYPE_BADGE: Record<string, BadgeVariant> = {
  '01': 'violet',
  '02': 'warning',
  '03': 'info',
}

const MOM_STTUS_LABEL: Record<string, string> = {
  '01': 'AI초안',
  '02': '편집중',
  '03': '결재요청',
  '04': '확정',
  MM001: 'AI초안',
  MM002: '편집중',
  MM003: '결재요청',
  MM004: '확정',
}

const getMinutesStatusLabel = (code?: string | null) =>
  code ? (MOM_STTUS_LABEL[code] ?? '처리 중') : '미생성'

type MeetingStatus = 'scheduled' | 'live' | 'ended'

const MEETING_STATUS: Record<MeetingStatus, { label: string; variant: BadgeVariant }> = {
  scheduled: { label: '예약됨', variant: 'primary' },
  live: { label: '진행 중', variant: 'success' },
  ended: { label: '종료', variant: 'neutral' },
}

const VCONF_STATUS_KEY: Record<string, MeetingStatus> = {
  VC001: 'scheduled',
  VC002: 'live',
  VC003: 'ended',
}

const PARTICIPANT_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PT001: { label: '참여 중', variant: 'success' },
  PT002: { label: '미입장', variant: 'neutral' },
  PT003: { label: '퇴장', variant: 'outline' },
}

const getMeetingTypeLabel = (code?: string | null) =>
  (code ? MTNG_TYPE_LABEL[code] : null) ?? '오프라인'

const getMeetingTypeBadge = (code?: string | null): BadgeVariant =>
  (code ? MTNG_TYPE_BADGE[code] : null) ?? 'warning'

const getMeetingStatus = (
  meeting: Pick<AdminMtngListResponse, 'vconfSttus' | 'beginDt' | 'endDt'>,
): MeetingStatus => {
  if (meeting.vconfSttus && VCONF_STATUS_KEY[meeting.vconfSttus]) {
    return VCONF_STATUS_KEY[meeting.vconfSttus]
  }

  const now = Date.now()
  const begin = new Date(meeting.beginDt).getTime()
  const end = new Date(meeting.endDt).getTime()

  if (!Number.isNaN(begin) && now < begin) return 'scheduled'
  if (!Number.isNaN(end) && now <= end) return 'live'
  return 'ended'
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

  const { data: employees, execute: fetchEmployees } = useApi(
    adminApi.getEmployees,
    { immediate: false },
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

  useEffect(() => {
    void fetchEmployees({ page: 0, size: 1000 }).catch(() => undefined)
  }, [fetchEmployees])

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
  const employeesById = useMemo(
    () => new Map((employees ?? []).map((employee) => [employee.empId, employee])),
    [employees],
  )
  const selectedCreator = selectedMtng
    ? employeesById.get(selectedMtng.crtrId)
    : undefined

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
                <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500">
                      <th className="w-[26%] px-6 py-3.5">회의명</th>
                      <th className="px-5 py-3.5">유형</th>
                      <th className="px-5 py-3.5">진행 상태</th>
                      <th className="px-5 py-3.5">일시</th>
                      <th className="min-w-52 px-5 py-3.5">생성자</th>
                      <th className="min-w-40 px-5 py-3.5">참석/장소</th>
                      <th className="px-5 py-3.5">회의록</th>
                      <th className="px-5 py-3.5 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
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
                          creator={employeesById.get(mtng.crtrId)}
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
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-200 px-6 pb-5 pt-6">
                <button
                  onClick={() => setSelectedMtng(null)}
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  aria-label="회의 상세 닫기"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-wrap items-center gap-2 pr-12">
                  <Badge variant={MEETING_STATUS[getMeetingStatus(selectedMtng)].variant}>
                    {MEETING_STATUS[getMeetingStatus(selectedMtng)].label}
                  </Badge>
                  <Badge variant={getMeetingTypeBadge(selectedMtng.mtngTypeCd)}>
                    {getMeetingTypeLabel(selectedMtng.mtngTypeCd)}
                  </Badge>
                </div>
                <h2 className="mt-3 pr-12 text-xl font-black leading-snug text-slate-950">
                  {selectedMtng.mtngNm}
                </h2>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MeetingInfoCard
                    icon={<CalendarClock size={18} />}
                    label="회의 일시"
                    className="sm:col-span-2"
                  >
                    <p className="text-sm font-bold leading-6 text-slate-900">
                      {formatDt(selectedMtng.beginDt)}
                      <span className="mx-2 text-slate-300">→</span>
                      {formatDt(selectedMtng.endDt)}
                    </p>
                  </MeetingInfoCard>

                  <MeetingInfoCard icon={<Users size={18} />} label="개설자">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        fileId={selectedCreator?.prflImgFileId}
                        name={selectedCreator?.empNm ?? selectedMtng.crtrNm}
                        size={38}
                        rounded="xl"
                        className="ring-1 ring-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {selectedCreator?.empNm ?? selectedMtng.crtrNm}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                          {formatEmployeeMeta(selectedCreator)}
                        </p>
                      </div>
                    </div>
                  </MeetingInfoCard>

                  <MeetingInfoCard
                    icon={selectedMtng.confRmNm ? <MapPin size={18} /> : <Video size={18} />}
                    label={selectedMtng.confRmNm ? '회의 장소' : '온라인 회의'}
                  >
                    <p className="truncate text-sm font-bold text-slate-900">
                      {selectedMtng.confRmNm ?? selectedMtng.roomNm ?? '장소 정보 없음'}
                    </p>
                  </MeetingInfoCard>
                </div>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-950">참석자 현황</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        총 {selectedMtng.ptcpts.length}명의 참석자가 등록되어 있습니다.
                      </p>
                    </div>
                    <Badge variant="outline">{selectedMtng.ptcpts.length}명</Badge>
                  </div>

                  {selectedMtng.ptcpts.length > 0 ? (
                    <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl bg-slate-50 p-2 sm:grid-cols-2">
                      {selectedMtng.ptcpts.map((participant) => {
                        const employee = employeesById.get(participant.empId)
                        const participantStatus = PARTICIPANT_STATUS[participant.ptcptSttusCd]
                        return (
                          <div
                            key={participant.empId}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <ProfileAvatar
                              fileId={employee?.prflImgFileId}
                              name={participant.empNm}
                              size={36}
                              rounded="xl"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {participant.empNm}
                              </p>
                              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                {formatParticipantMeta(participant, employee)}
                              </p>
                            </div>
                            {participantStatus ? (
                              <Badge variant={participantStatus.variant} className="shrink-0">
                                {participantStatus.label}
                              </Badge>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                      등록된 참석자가 없습니다.
                    </div>
                  )}
                </section>

                <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                      <FileText size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-500">회의록 상태</p>
                      <p className="mt-0.5 text-sm font-black text-blue-800">
                        {getMinutesStatusLabel(selectedMtng.momSttusCd)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={() => setSelectedMtng(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  닫기
                </button>
                {selectedMtng.vconfSttus === 'VC002' && (
                  <button
                    onClick={() => void handleForceEnd(selectedMtng.mtngId)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                  >
                    회의 강제 종료
                  </button>
                )}
              </div>
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

function MtngTableRow({ mtng, creator, onDetail }: {
  mtng: AdminMtngListResponse
  creator?: AdminEmployeeListItem
  onDetail: (id: number) => void
}) {
  const status = MEETING_STATUS[getMeetingStatus(mtng)]
  const creatorPosition = creator?.jobGrade?.jobGrdNm ?? creator?.jobPosition?.jobPstnNm
  const creatorDepartment = creator?.department?.deptNm
  const location = mtng.confRmNm?.trim() || '회의실 없음'

  return (
    <tr className="group bg-[#f2f4f6] transition-colors hover:bg-[#e5efe8]">
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={() => onDetail(mtng.mtngId)}
          className="max-w-md text-left font-bold text-slate-900 transition-colors hover:text-blue-700"
        >
          {mtng.mtngNm}
        </button>
      </td>
      <td className="px-5 py-4">
        <Badge variant={getMeetingTypeBadge(mtng.mtngTypeCd)}>
          {getMeetingTypeLabel(mtng.mtngTypeCd)}
        </Badge>
      </td>
      <td className="px-5 py-4">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="px-5 py-4">
        <p className="whitespace-nowrap text-xs font-bold text-slate-700">
          {formatDate(mtng.beginDt)}
        </p>
        <p className="mt-1 whitespace-nowrap text-xs font-semibold text-slate-500">
          {formatTimeRange(mtng.beginDt, mtng.endDt)}
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            fileId={creator?.prflImgFileId}
            name={creator?.empNm ?? mtng.crtrNm}
            size={36}
            rounded="xl"
            className="ring-1 ring-slate-200"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {creator?.empNm ?? mtng.crtrNm}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {creatorPosition && creatorDepartment
                ? `${creatorPosition} · ${creatorDepartment}`
                : creatorPosition ?? creatorDepartment ?? '직급/부서 정보 없음'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Users size={14} className="text-slate-400" />
          {mtng.ptcptCnt}명
        </p>
        <p
          className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${
            mtng.confRmNm ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          <MapPin size={14} className="shrink-0" />
          {location}
        </p>
      </td>
      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        {getMinutesStatusLabel(mtng.momSttusCd)}
      </td>
      <td className="px-5 py-4 text-right">
        <button
          onClick={() => onDetail(mtng.mtngId)}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-100 hover:text-blue-700"
          aria-label={`${mtng.mtngNm} 상세 보기`}
          title="상세 보기"
        >
          <Edit3 size={18} />
        </button>
      </td>
    </tr>
  )
}

function MeetingInfoCard({
  icon,
  label,
  className = '',
  children,
}: {
  icon: React.ReactNode
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500">
        <span className="text-blue-700">{icon}</span>
        {label}
      </p>
      {children}
    </div>
  )
}

function formatEmployeeMeta(employee?: AdminEmployeeListItem) {
  const position = employee?.jobGrade?.jobGrdNm ?? employee?.jobPosition?.jobPstnNm
  const department = employee?.department?.deptNm

  if (position && department) return `${position} · ${department}`
  return position ?? department ?? '직급/부서 정보 없음'
}

function formatParticipantMeta(participant: AdminMtngPtcptResponse, employee?: AdminEmployeeListItem) {
  const position = employee?.jobGrade?.jobGrdNm ?? employee?.jobPosition?.jobPstnNm ?? participant.jbgdNm
  const department = employee?.department?.deptNm ?? participant.deptNm

  if (position && department) return `${position} · ${department}`
  return position || department || '직급/부서 정보 없음'
}

function formatDt(dt: string) {
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

function formatDate(dt: string) {
  const date = new Date(dt)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

function formatTimeRange(beginDt: string, endDt: string) {
  const formatTime = (dt: string) => {
    const date = new Date(dt)
    if (Number.isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  return `${formatTime(beginDt)} - ${formatTime(endDt)}`
}
