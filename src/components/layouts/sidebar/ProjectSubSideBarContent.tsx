import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Circle,
  CheckCircle2,
  Ban,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import SubSidebarSection from './SubSidebarSection'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import { projectApi } from '../../../api/projectApi'
import { useApiList } from '../../../hooks/useApi'

const projectStatusColor: Record<string, string> = {
  '01': '#94A3B8',
  '02': '#3B82F6',
  '03': '#10B981',
  '04': '#F59E0B',
}

const ProjectSubSidebarContent = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [projectsOpen, setProjectsOpen] = useState(true)
  const { data: projects, loading, error } = useApiList(projectApi.getProjectList)
  const recentProjects = useMemo(
    () =>
      [...(projects ?? [])]
        .sort((a, b) => b.projBgngYmd.localeCompare(a.projBgngYmd))
        .slice(0, 3),
    [projects],
  )

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-950">프로젝트</h2>
      </div>

      {/* 프로젝트 관리 메뉴 */}
      <SubSidebarSection title="프로젝트 관리">
        <SubSidebarMenuItem
          icon={LayoutGrid}
          label="전체 프로젝트"
          path="/project"
          active={location.pathname === '/project' && !location.search}
        />
        <SubSidebarMenuItem
          icon={Circle}
          label="진행 중"
          path="/project?status=02"
          active={location.pathname === '/project' && location.search === '?status=02'}
        />
        <SubSidebarMenuItem
          icon={CheckCircle2}
          label="완료"
          path="/project?status=03"
          active={location.pathname === '/project' && location.search === '?status=03'}
        />
        <SubSidebarMenuItem
          icon={Ban}
          label="중단"
          path="/project?status=04"
          active={location.pathname === '/project' && location.search === '?status=04'}
        />
      </SubSidebarSection>

      {/* 최근 프로젝트 */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setProjectsOpen((prev) => !prev)}
          className="flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
        >
          <span>최근 프로젝트</span>
          {projectsOpen ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronRight size={13} />
          )}
        </button>

        {projectsOpen && (
          <div className="flex flex-col gap-0.5">
            {recentProjects.map((project) => (
              <button
                key={project.projId}
                type="button"
                onClick={() => navigate(`/project/${project.projId}`)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: projectStatusColor[project.projStatCd] ?? '#94A3B8',
                  }}
                />
                <span className="truncate">{project.projNm}</span>
              </button>
            ))}
            {loading && (
              <p className="px-2 py-2 text-xs font-medium text-slate-400">
                프로젝트를 불러오는 중입니다.
              </p>
            )}
            {!loading && !error && recentProjects.length === 0 && (
              <p className="px-2 py-2 text-xs font-medium text-slate-400">
                표시할 프로젝트가 없습니다.
              </p>
            )}
            {!loading && error && (
              <p className="px-2 py-2 text-xs font-medium text-rose-500">
                프로젝트를 불러오지 못했습니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectSubSidebarContent
