// src/pages/admin/Project/AdminProjectsPage.tsx

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, FolderOpen, Users } from 'lucide-react'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../../components/common/dataDisplay/card/ContentCard'
import EmptyState from '../../../components/common/dataDisplay/emptyState/EmptyState'
import SearchInput from '../../../components/common/form/searchInput/SearchInput'
import Select from '../../../components/common/form/select/Select'
import { projectApi } from '../../../api/projectApi'
import { useApi } from '../../../hooks/useApi'
import type { AdminProjectListResponseDto } from '../../../types/project'
import AdminProjectDetailDrawer from './AdminProjectDetailDrawer'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import { adminApi } from '../../../api/adminApi'

const TODAY = Date.now()

// ──────────────────────────────────────────
// 상수
// ──────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  '01': '예정',
  '02': '진행 중',
  '03': '완료',
  '04': '중단',
}

const STATUS_VARIANT: Record<string, 'primary' | 'neutral' | 'success' | 'warning' | 'danger'> = {
  '01': 'warning',
  '02': 'primary',
  '03': 'success',
  '04': 'neutral',
}

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: '01', label: '예정' },
  { value: '02', label: '진행 중' },
  { value: '03', label: '완료' },
  { value: '04', label: '중단' },
]

// ──────────────────────────────────────────
// 진척률 바
// ──────────────────────────────────────────
const ProgressBar = ({ value }: { value: number }) => {
  const clamped = Math.min(Math.max(value, 0), 100)
  const color =
    clamped === 100
      ? 'bg-emerald-500'
      : clamped >= 60
      ? 'bg-blue-500'
      : clamped >= 30
      ? 'bg-amber-400'
      : 'bg-slate-300'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-slate-500">{clamped}%</span>
    </div>
  )
}

// ──────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────
export default function AdminProjectsPage() {

  const { data, loading } = useApi(projectApi.getAdminProjectList, { immediateArgs: [] })
  const { data: employees, execute: fetchEmployees } = useApi(
    adminApi.getEmployees,
    { immediate: false },
  )
  const projects = useMemo(() => data ?? [], [data])
  const employeesById = useMemo(
    () => new Map((employees ?? []).map((employee) => [employee.empId, employee])),
    [employees],
  )

  useEffect(() => {
    void fetchEmployees({ page: 0, size: 1000 }).catch(() => undefined)
  }, [fetchEmployees])

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [leaderFilter, setLeaderFilter] = useState('')
  const [selectedProject, setSelectedProject] = useState<AdminProjectListResponseDto | null>(null)

  // 리더 목록 (중복 제거)
  const leaderOptions = useMemo(() => {
    const unique = [...new Map(projects.map((p) => [p.projLdrEmpId, p.projLdrNm])).entries()]
    return [
      { value: '', label: '전체 리더' },
      ...unique.map(([id, nm]) => ({ value: String(id), label: nm })),
    ]
  }, [projects])

  // 필터 적용
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return projects.filter((p) => {
      if (kw && !p.projNm.toLowerCase().includes(kw) && !p.projLdrNm.toLowerCase().includes(kw)) return false
      if (statusFilter && p.projStatCd !== statusFilter) return false
      if (leaderFilter && String(p.projLdrEmpId) !== leaderFilter) return false
      return true
    })
  }, [projects, keyword, statusFilter, leaderFilter])

  // 통계
  const stats = useMemo(() => ({
    total: projects.length,
    inProgress: projects.filter((p) => p.projStatCd === '02').length,
    completed: projects.filter((p) => p.projStatCd === '03').length,
    riskCount: projects.filter((p) => p.deadlineRisk === 'Y').length,
  }), [projects])

  const riskProjects = useMemo(
    () => projects.filter((p) => p.deadlineRisk === 'Y'),
    [projects],
  )

  // 상태별 분포
  const statDist = useMemo(() => [
    { label: '진행 중', count: projects.filter((p) => p.projStatCd === '02').length, color: 'bg-blue-500' },
    { label: '완료',   count: projects.filter((p) => p.projStatCd === '03').length, color: 'bg-emerald-500' },
    { label: '예정',   count: projects.filter((p) => p.projStatCd === '01').length, color: 'bg-amber-400' },
    { label: '중단',   count: projects.filter((p) => p.projStatCd === '04').length, color: 'bg-slate-300' },
  ], [projects])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        데이터를 불러오는 중입니다...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── 상단 통계 카드 4개 ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <ContentCard title="전체 프로젝트">
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-950">{stats.total}</span>
            <FolderOpen size={24} className="text-slate-400" />
          </div>
        </ContentCard>

        <ContentCard title="진행 중">
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-blue-600">{stats.inProgress}</span>
            <BarChart3 size={24} className="text-blue-400" />
          </div>
        </ContentCard>

        <ContentCard title="완료">
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600">{stats.completed}</span>
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
        </ContentCard>

        <ContentCard title="기간 초과 위험">
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-red-500">{stats.riskCount}</span>
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          {stats.riskCount > 0 && (
            <p className="mt-1 text-xs text-red-400">종료일 7일 이내 진행 중</p>
          )}
        </ContentCard>
      </div>

      {/* ── 전체 목록 ── */}
      <ContentCard title="전체 프로젝트 목록">
        {/* 필터 영역 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            wrapperClassName="w-56"
            placeholder="프로젝트명 또는 리더 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            options={leaderOptions}
            value={leaderFilter}
            onChange={(e) => setLeaderFilter(e.target.value)}
          />
          <span className="ml-auto text-xs text-slate-400">
            총 {projects.length}건 중 {filtered.length}건 표시
          </span>
        </div>

        {/* 테이블 */}
        {filtered.length === 0 ? (
          <EmptyState
            title="조건에 맞는 프로젝트가 없습니다."
            description="검색어나 필터를 변경해보세요."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['프로젝트명', '상태', '리더', '기간', '진척률', '참여자', ''].map((h) => (
                    <th
                      key={h}
                      className="pb-2.5 text-left text-xs font-semibold text-slate-400 first:pl-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((proj) => (
                  <tr
                    key={proj.projId}
                    className={`hover:bg-slate-50 ${proj.deadlineRisk === 'Y' ? 'bg-red-50/60' : ''}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        {proj.deadlineRisk === 'Y' && (
                          <AlertTriangle size={13} className="shrink-0 text-red-400" />
                        )}
                        <span className="font-semibold text-slate-800">{proj.projNm}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={STATUS_VARIANT[proj.projStatCd]}>
                        {STATUS_LABEL[proj.projStatCd]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <ProfileAvatar
                          fileId={employeesById.get(proj.projLdrEmpId)?.prflImgFileId}
                          name={proj.projLdrNm}
                          size={30}
                        />
                        <span>{proj.projLdrNm}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">
                      {proj.projBgngYmd} ~ {proj.projEndYmd}
                    </td>
                    <td className="py-3 pr-4">
                      <ProgressBar value={proj.projPrgrsRt} />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Users size={13} />
                        <span className="text-xs">{proj.memberCnt}명</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedProject(proj)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {/* ── 하단: 상태별 분포 + 기간 초과 위험 ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 상태별 분포 */}
        <ContentCard title="상태별 분포">
          <div className="flex flex-col gap-3">
            {statDist.map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-14 text-xs text-slate-500">{label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 8 }}>
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold text-slate-600">{count}</span>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* 기간 초과 위험 목록 */}
        <ContentCard title="기간 초과 위험">
          {riskProjects.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-slate-400">
              위험 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {riskProjects.map((proj) => {
                const daysLeft = Math.ceil(
                  (new Date(proj.projEndYmd).getTime() - TODAY) / 86400000,
                )
                return (
                  <div
                    key={proj.projId}
                    className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{proj.projNm}</p>
                      <p className="text-xs text-red-500">
                        {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : `D+${Math.abs(daysLeft)}`}
                        {' · '}종료일 {proj.projEndYmd}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">진척률 {proj.projPrgrsRt}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </ContentCard>
      </div>

      {/* ── 상세 Drawer ── */}
      <AdminProjectDetailDrawer
        project={selectedProject}
        employeesById={employeesById}
        onClose={() => setSelectedProject(null)}
      />

    </div>
  )
}
