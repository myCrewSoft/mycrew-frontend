// src/pages/drive/ProjectDriveSharedPage.tsx
import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import { useApiList } from '../../hooks/useApi'
import { projectApi } from '../../api/projectApi'
import type { ProjectListResponseDto } from '../../types/project'
import ProjectDriveTab from '../project/ProjectDriveTab'

// ── 상태코드 설정 (ProjectListPage와 동일) ──────────────────────────
type ProjectStatCd = '01' | '02' | '03' | '04'

const statusConfig: {
  [key in ProjectStatCd]: { label: string; badge: 'warning' | 'primary' | 'success' | 'neutral' }
} = {
  '01': { label: '예정', badge: 'warning' },
  '02': { label: '진행 중', badge: 'primary' },
  '03': { label: '완료', badge: 'success' },
  '04': { label: '중단', badge: 'neutral' },
}

// ── 진척률 바 ─────────────────────────────────────────────────────
const ProgressBar = ({ value }: { value: number }) => {
  const clamped = Math.min(Math.max(value ?? 0, 0), 100)

  const barColor =
    clamped >= 100
      ? 'bg-emerald-500'
      : clamped >= 60
      ? 'bg-blue-500'
      : clamped >= 30
      ? 'bg-amber-400'
      : 'bg-slate-300'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">진척률</span>
        <span className="text-xs font-semibold text-slate-600">{clamped}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

// ── 좌측 프로젝트 카드 ────────────────────────────────────────────
interface ProjectDriveCardProps {
  project: ProjectListResponseDto
  active: boolean
  onClick: () => void
}

const ProjectDriveCard = ({ project, active, onClick }: ProjectDriveCardProps) => {
  const cfg = statusConfig[project.projStatCd as ProjectStatCd] ?? {
    label: project.projStatCd,
    badge: 'neutral' as const,
  }

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-5 shadow-sm transition-all duration-150 ${
        active
          ? 'border-blue-300 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <Badge variant={cfg.badge}>{cfg.label}</Badge>
      </div>
      <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{project.projNm}</h3>
      <div className="flex flex-col gap-1 text-xs text-slate-400">
        <span className="font-medium text-slate-500">Leader: {project.projLdrNm}</span>
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{project.projBgngYmd} ~ {project.projEndYmd}</span>
        </div>
      </div>
      <ProgressBar value={project.projPrgrsRt ?? 0} />
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function ProjectDriveSharedPage() {
  const [selectedProjId, setSelectedProjId] = useState<number | null>(null)

  const { data: projectList, loading } = useApiList(
    () => projectApi.getProjectList(),
    { immediate: true },
  )

  // 목록 로딩 후 첫 번째 프로젝트를 기본 선택
  useEffect(() => {
    if (!selectedProjId && (projectList ?? []).length > 0) {
    //   setSelectedProjId(projectList![0].projId)
    }
  }, [projectList, selectedProjId])

  return (
    <div className="flex h-full gap-4 overflow-hidden">

      {/* 좌측: 프로젝트 목록 */}
      <aside className="flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="px-1 text-sm font-bold text-slate-700">프로젝트 목록</h2>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            불러오는 중...
          </div>
        ) : (projectList ?? []).length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <EmptyState title="참여 중인 프로젝트가 없습니다." />
          </div>
        ) : (
          (projectList ?? []).map((project) => (
            <ProjectDriveCard
              key={project.projId}
              project={project}
              active={project.projId === selectedProjId}
              onClick={() => setSelectedProjId(project.projId)}
            />
          ))
        )}
      </aside>

      {/* 우측: 선택한 프로젝트의 드라이브 */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {selectedProjId ? (
          <ProjectDriveTab projId={selectedProjId} 
          className='flex h-full gap-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm' />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-white shadow-sm">
            <EmptyState
              title="프로젝트를 선택해주세요."
              description="좌측 목록에서 프로젝트를 선택하면 드라이브가 표시됩니다."
            />
          </div>
        )}
      </div>
    </div>
  )
}