// src/pages/admin/AdminProjectDetailDrawer.tsx

import { useEffect, useState } from 'react'
import {
  X,
  Users,
  CalendarRange,
  BarChart3,
  CheckCircle2,
  Clock,
  PauseCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import Button from '../../../components/common/button/Button'
import { projectApi } from '../../../api/projectApi'
import { ApiError } from '../../../api/axiosInstance'

// ── 타입 ──────────────────────────────────
interface AdminProjectListResponseDto {
  projId: number
  projNm: string
  projBgngYmd: string
  projEndYmd: string
  projStatCd: string
  projLdrNm: string
  projLdrEmpId: number
  projPrgrsRt: number
  memberCnt: number
  deadlineRisk: 'Y' | 'N'
}

interface AdminProjectDetailDrawerProps {
  project: AdminProjectListResponseDto | null
  onClose: () => void
}

// ── 상수 ──────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  '01': '예정',
  '02': '진행 중',
  '03': '중단',
  '04': '완료',
}
const STATUS_VARIANT: Record<string, 'primary' | 'neutral' | 'success' | 'warning'> = {
  '01': 'warning',
  '02': 'primary',
  '03': 'neutral',
  '04': 'success',
}

// ── 컴포넌트 ──────────────────────────────
export default function AdminProjectDetailDrawer({
  project,
  onClose,
}: AdminProjectDetailDrawerProps) {
  const navigate = useNavigate()
  const isOpen = project !== null

  // 참여자 목록
  const [memberList, setMemberList] = useState<{ empId: number; empNm: string; deptNm?: string; profileImageFileId?: number | null; projLdrYn?: string }[]>([])
  const [memberLoading, setMemberLoading] = useState(false)

  // 업무 요약
  const [summary, setSummary] = useState<{ totalCount: number; completedCount: number; inProgressCount: number; stopCount: number } | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
  if (!project) return

  let cancelled = false

  const fetchData = async () => {
    setMemberLoading(true)
    setSummaryLoading(true)

    try {
      const [projectRes, dashboardRes] = await Promise.all([
        projectApi.getProject(project.projId),
        projectApi.getTaskDashboard(project.projId),
      ])
      if (cancelled) return
      setMemberList(projectRes.data.data?.projMemberList ?? [])
      setSummary(dashboardRes.data.data?.summary ?? null)
    } catch (err) {
      if (cancelled) return
      console.error(err instanceof ApiError ? err.message : err)
    } finally {
      if (!cancelled) {
        setMemberLoading(false)
        setSummaryLoading(false)
      }
    }
  }

  void fetchData()

  return () => {
    cancelled = true
  }
}, [project])

  const prgrsRt = project?.projPrgrsRt ?? 0
  const barColor =
    prgrsRt >= 100
      ? 'bg-emerald-500'
      : prgrsRt >= 60
      ? 'bg-blue-500'
      : prgrsRt >= 30
      ? 'bg-amber-400'
      : 'bg-slate-300'

  return (
    <>
      {/* 딤 배경 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Drawer 패널 */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {project && (
          <>
            {/* 헤더 */}
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="min-w-0 flex-1 pr-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[project.projStatCd]}>
                    {STATUS_LABEL[project.projStatCd]}
                  </Badge>
                  {project.deadlineRisk === 'Y' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                      <AlertTriangle size={12} />
                      기간 위험
                    </span>
                  )}
                </div>
                <h2 className="truncate text-lg font-bold text-slate-950">
                  {project.projNm}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">리더: {project.projLdrNm}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* 기간 */}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarRange size={15} className="shrink-0 text-slate-400" />
                <span>{project.projBgngYmd} ~ {project.projEndYmd}</span>
              </div>

              {/* 진척률 */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">프로젝트 진척률</span>
                  <span className="font-bold text-slate-900">{prgrsRt}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${prgrsRt}%` }}
                  />
                </div>
              </div>

              {/* 업무 요약 */}
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <BarChart3 size={15} className="text-slate-400" />
                  업무 현황
                </p>
                {summaryLoading ? (
                  <p className="text-xs text-slate-400">불러오는 중...</p>
                ) : summary ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '전체', value: summary.totalCount, icon: <BarChart3 size={13} />, color: 'text-slate-600', bg: 'bg-slate-50' },
                      { label: '완료', value: summary.completedCount, icon: <CheckCircle2 size={13} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: '진행 중', value: summary.inProgressCount, icon: <Clock size={13} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: '중지', value: summary.stopCount, icon: <PauseCircle size={13} />, color: 'text-red-500', bg: 'bg-red-50' },
                    ].map(({ label, value, icon, color, bg }) => (
                      <div key={label} className={`flex items-center gap-2 rounded-xl ${bg} px-3 py-2.5`}>
                        <span className={color}>{icon}</span>
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className={`ml-auto text-sm font-bold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">업무 데이터가 없습니다.</p>
                )}
              </div>

              {/* 참여자 목록 */}
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Users size={15} className="text-slate-400" />
                  참여자 ({project.memberCnt}명)
                </p>
                {memberLoading ? (
                  <p className="text-xs text-slate-400">불러오는 중...</p>
                ) : memberList.length === 0 ? (
                  <p className="text-xs text-slate-400">참여자가 없습니다.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {memberList.map((member) => (
                      <div key={member.empId} className="flex items-center gap-3">
                        <ProfileAvatar
                          name={member.empNm}
                          fileId={member.profileImageFileId}
                          size={32}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-800">
                              {member.empNm}
                            </span>
                            {member.projLdrYn === 'Y' && (
                              <Badge variant="primary" className="text-[10px]">리더</Badge>
                            )}
                          </div>
                          {member.deptNm && (
                            <p className="text-xs text-slate-400">{member.deptNm}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
              <Button
                variant="primary"
                leftIcon={<ExternalLink size={14} />}
                onClick={() => {
                  onClose()
                  navigate(`/project/${project.projId}`)
                }}
              >
                프로젝트 상세
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}