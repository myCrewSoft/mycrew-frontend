// src/pages/admin/Project/AdminProjectDetailDrawer.tsx

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
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
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import Button from '../../../components/common/button/Button'
import { projectApi } from '../../../api/projectApi'
import { ApiError } from '../../../api/axiosInstance'
import chatbotApi from '../../../api/chatBotApi'

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

// ── AI 보고서 내부 컴포넌트 ──────────────────
function AiReportPanel({ projId }: { projId: number }) {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(async (signal: AbortSignal) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    requestIdRef.current = requestId

    setContent('')
    setIsStreaming(true)

    let accumulated = ''

    try {
      await chatbotApi.streamChat(
        {
          message: '이 프로젝트의 현황 보고서를 작성해주세요.',
          requestId,
          aiType: 'REPT',
          projId,
        },
        {
          onMessage: (chunk) => {
            accumulated += chunk
            setContent(accumulated)
          },
        },
        signal,
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error(error)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [projId])

  // 마운트 시 자동 생성
  useEffect(() => {
    const controller = new AbortController()
    abortControllerRef.current = controller
    startTransition(() => {
      void generate(controller.signal)
    })
    return () => { controller.abort() }
  }, [generate])

  // 다시 생성 버튼용
  const handleGenerate = () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    void generate(controller.signal)
  }

  const stop = async () => {
    abortControllerRef.current?.abort()
    await chatbotApi.stopStream(requestIdRef.current).catch(() => undefined)
    setIsStreaming(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [content])

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] px-4 py-3">
        {content && (
          <div className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && <span className="animate-pulse">▌</span>}
          </div>
        )}

        {isStreaming && !content && (
          <div className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-400">
            보고서를 생성하고 있습니다...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-3 py-2 justify-end">
        {isStreaming ? (
          <button
            onClick={() => void stop()}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
          >
            중지
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            다시 생성
          </button>
        )}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────
export default function AdminProjectDetailDrawer({
  project,
  onClose,
}: AdminProjectDetailDrawerProps) {
  const navigate = useNavigate()
  const isOpen = project !== null

  const [memberList, setMemberList] = useState<
    {
      empId: number
      empNm: string
      deptNm?: string
      profileImageFileId?: number | null
      projLdrYn?: string
    }[]
  >([])
  const [memberLoading, setMemberLoading] = useState(false)

  const [summary, setSummary] = useState<{
    totalCount: number
    completedCount: number
    inProgressCount: number
    stopCount: number
  } | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [showAiReport, setShowAiReport] = useState(false)

  const handleClose = () => {
    setShowAiReport(false)
    onClose()
  }

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
        const taskSummary = dashboardRes.data.data?.summary
        setMemberList(projectRes.data.data?.projMemberList ?? [])
        setSummary(
          taskSummary
            ? {
                totalCount: taskSummary.totalCount,
                completedCount: taskSummary.completedCount,
                inProgressCount: taskSummary.inProgressCount,
                stopCount: taskSummary.stopCount ?? 0,
              }
            : null,
        )
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
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={handleClose} />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[560px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
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
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarRange size={15} className="shrink-0 text-slate-400" />
                <span>{project.projBgngYmd} ~ {project.projEndYmd}</span>
              </div>

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

              {/* AI 보고서 */}
              {showAiReport && (
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Sparkles size={15} className="text-indigo-400" />
                    AI 프로젝트 보고서
                  </p>
                  <AiReportPanel projId={project.projId} />
                </div>
              )}

            </div>

            {/* 푸터 */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <Button variant="outline" onClick={handleClose}>
                닫기
              </Button>
              <Button
                variant="outline"
                leftIcon={<Sparkles size={14} />}
                onClick={() => setShowAiReport((prev) => !prev)}
              >
                {showAiReport ? 'AI 보고서 닫기' : 'AI 보고서'}
              </Button>
              <Button
                variant="primary"
                leftIcon={<ExternalLink size={14} />}
                onClick={() => {
                  handleClose()
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
