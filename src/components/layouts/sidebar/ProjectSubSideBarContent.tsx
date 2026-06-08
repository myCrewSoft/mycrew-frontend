// src/components/layouts/sidebar/ProjectSubSidebarContent.tsx
// sidebar.config.ts의 customSidebarContentMap에 아래처럼 등록하세요:
// project: ProjectSubSidebarContent

import { useState } from 'react'
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

// 더미 프로젝트 목록 (실제 연동 시 API로 교체)
const recentProjects = [
  { id: 1, name: '글로벌 통합 정산 플랫폼 고도화', color: '#3b82f6' },
  { id: 2, name: '사내 HR 시스템 리뉴얼', color: '#8b5cf6' },
  { id: 3, name: '모바일 앱 v3.0 출시', color: '#10b981' },
]

const ProjectSubSidebarContent = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [projectsOpen, setProjectsOpen] = useState(true)

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
          active={location.pathname === '/project' || location.pathname === '/project'}
        />
        <SubSidebarMenuItem
          icon={Circle}
          label="진행 중"
          path="/project/list?status=in_progress"
          active={false}
        />
        <SubSidebarMenuItem
          icon={CheckCircle2}
          label="완료"
          path="/project/list?status=completed"
          active={false}
        />
        <SubSidebarMenuItem
          icon={Ban}
          label="중단"
          path="/project/list?status=stopped"
          active={false}
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
                key={project.id}
                type="button"
                onClick={() => navigate(`/project/${project.id}`)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectSubSidebarContent
