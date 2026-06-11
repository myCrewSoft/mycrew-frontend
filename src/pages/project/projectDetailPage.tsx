// src/pages/project/ProjectDetailPage.tsx
// 라우터에서 /project/:id 경로로 연결하세요

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Share2,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  ChevronRight,
  FileText,
  ExternalLink,
} from 'lucide-react'
import PageComponent from '../../components/layouts/PageComponent'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import Button from '../../components/common/button/Button'
import Tabs from '../../components/common/tabs/Tabs'
import {
  ProjectTasksTab,
  type ProjectTaskStatusCode,
  type ProjectTaskViewMode,
} from './task'
import ProjectBoardTab from './ProjectBoardTab'

// ── 더미 데이터 ──────────────────────────────────────────────────
const PROJECT_DETAIL = {
  id: 1,
  name: '글로벌 통합 정산 플랫폼 고도화',
  description: '차세대 글로벌 결제 게이트웨이 및 정산 자동화 시스템 구축 프로젝트',
  status: 'in_progress' as const,
  progress: 66,
  totalTasks: 124,
  completedTasks: 82,
  delayedTasks: 5,
  startDate: '2024년 01월 02일',
  endDate: '2024년 06월 30일',
  remainingDays: 110,
  currentPhase: '개발 고도화 (Phase 3)',
  category: '엔터프라이즈 솔루션',
  tags: ['Fintech', 'Enterprise', 'Global'],
  resources: [
    { label: '디자인 가이드 (Figma)', url: '#', icon: 'figma' },
    { label: '개발 API 문서 (Swagger)', url: '#', icon: 'swagger' },
  ],
  team: [
    { id: 1, name: '김철수', role: 'Project Manager', color: '#3b82f6', online: true },
    { id: 2, name: '이지혜', role: 'Senior Backend', color: '#8b5cf6', online: true },
    { id: 3, name: '박민지', role: 'UX/UI Designer', color: '#10b981', online: false },
    { id: 4, name: '정진호', role: 'DevOps Engineer', color: '#f59e0b', online: true },
  ],
  milestones: [
    {
      id: 1,
      title: '요구사항 분석 완료',
      description: '기존 레거시 분석 및 신규 아키텍처 설계 확정',
      date: '2024.01.15',
      status: 'done' as const,
    },
    {
      id: 2,
      title: 'UI/UX 프로토타이핑',
      description: '글로벌 디자인 시스템 적용 및 사용자 피드백 반영',
      date: '2024.02.20',
      status: 'done' as const,
    },
    {
      id: 3,
      title: '코어 정산 엔진 개발',
      description: '대용량 트랜잭션 처리를 위한 정산 로직 구현 중',
      date: '2024.04.15 (예정)',
      status: 'in_progress' as const,
    },
    {
      id: 4,
      title: 'QA 및 부하 테스트',
      description: '글로벌 리전별 응단 속도 및 안정성 검증',
      date: '2024.05.30',
      status: 'pending' as const,
    },
    {
      id: 5,
      title: '프로덕션 배포',
      description: '단계적 롤아웃 및 모니터링 체계 구축',
      date: '2024.06.30',
      status: 'pending' as const,
    },
  ],
  recentTasks: [
    { id: 1, title: '결제 API 인증 모듈 구현', assignee: '이지혜', status: 'done', priority: 'high' },
    { id: 2, title: '정산 배치 스케줄러 설계', assignee: '이지혜', status: 'in_progress', priority: 'high' },
    { id: 3, title: 'Figma 디자인 핸드오프', assignee: '박민지', status: 'done', priority: 'medium' },
    { id: 4, title: 'CI/CD 파이프라인 구성', assignee: '정진호', status: 'in_progress', priority: 'medium' },
    { id: 5, title: '환율 계산 엔진 단위 테스트', assignee: '김철수', status: 'pending', priority: 'low' },
  ],
}

// ── 마일스톤 아이콘 ───────────────────────────────────────────────
const MilestoneIcon = ({ status }: { status: 'done' | 'in_progress' | 'pending' }) => {
  if (status === 'done')
    return (
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
        <CheckCircle2 size={16} className="text-blue-600" />
      </div>
    )
  if (status === 'in_progress')
    return (
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-md shadow-blue-200">
        <Circle size={10} className="fill-white text-white" />
      </div>
    )
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
      <Circle size={10} className="text-slate-300" />
    </div>
  )
}

// ── 업무 우선순위 배지 ────────────────────────────────────────────
const PriorityBadge = ({ priority }: { priority: string }) => {
  if (priority === 'high')
    return <Badge variant="danger">높음</Badge>
  if (priority === 'medium')
    return <Badge variant="warning">중간</Badge>
  return <Badge variant="neutral">낮음</Badge>
}

// ── 업무 상태 뱃지 ────────────────────────────────────────────────
const TaskStatusBadge = ({ status }: { status: string }) => {
  if (status === 'done')
    return <Badge variant="success">완료</Badge>
  if (status === 'in_progress')
    return <Badge variant="primary">진행 중</Badge>
  return <Badge variant="neutral">대기</Badge>
}

// ── 메인 페이지 ──────────────────────────────────────────────────
const ProjectDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState('overview')
  const [taskViewMode, setTaskViewMode] = useState<ProjectTaskViewMode>('list')
  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false)
  const [taskCreateStatus, setTaskCreateStatus] = useState<ProjectTaskStatusCode>('00')

  const project = PROJECT_DETAIL // 실제에서는 id 기반으로 API 조회
  const projectId = id ?? String(project.id)

  const tabItems = [
    { value: 'overview', label: '개요' },
    { value: 'tasks', label: '업무' },
    { value: 'gantt', label: '간트차트' },
    { value: 'board', label: '보드' },
    { value: 'drive', label: '프로젝트 드라이브' },
  ]

  const handleOpenTaskCreateModal = (status: ProjectTaskStatusCode = '00') => {
    setTab('tasks')
    setTaskCreateStatus(status)
    setTaskCreateModalOpen(true)
  }

  return (
    <PageComponent
      title={project.name}
      description={project.description}
      actions={
        <>
          <Button variant="outline" leftIcon={<Share2 size={15} />}>
            회의 생성
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => handleOpenTaskCreateModal()}
          >
            업무 추가
          </Button>
        </>
      }
    >
      {/* 브레드크럼 */}
      <div className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
        <button
          onClick={() => navigate('/project')}
          className="hover:text-blue-600"
        >
          프로젝트
        </button>
        <ChevronRight size={14} />
        <span className="text-slate-500">{project.category}</span>
        <ChevronRight size={14} />
        <span className="font-semibold text-slate-700">{project.name}</span>
        <Badge variant="primary" className="ml-1">
          진행 중
        </Badge>
      </div>

      {/* 탭 */}
      <Tabs value={tab} onChange={setTab} items={tabItems} />

      {tab === 'overview' && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          {/* 좌측 컬럼 */}
          <div className="flex flex-col gap-5">
            {/* 프로젝트 진행 요약 */}
            <ContentCard
              title="프로젝트 진행 요약"
              description={`마지막 업데이트: 2시간 전`}
            >
              {/* 요약 수치 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: '전체 업무', value: project.totalTasks, color: 'text-slate-800', bg: 'bg-slate-50' },
                  { label: '완료된 업무', value: project.completedTasks, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: '진행률', value: `${project.progress}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: '지연된 업무', value: project.delayedTasks, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col items-center justify-center rounded-xl ${stat.bg} px-4 py-4`}
                  >
                    <span className="mb-0.5 text-xs font-medium text-slate-500">
                      {stat.label}
                    </span>
                    <span className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* 진행률 바 */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">
                    현재 단계: {project.currentPhase}
                  </span>
                  <span className="font-bold text-slate-700">{project.progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </ContentCard>

            {/* 주요 마일스톤 */}
            <ContentCard title="주요 마일스톤">
              <div className="flex flex-col divide-y divide-slate-50">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <MilestoneIcon status={milestone.status} />
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            milestone.status === 'pending'
                              ? 'text-slate-400'
                              : 'text-slate-800'
                          }`}
                        >
                          {milestone.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {milestone.description}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-xs font-medium ${
                          milestone.status === 'in_progress'
                            ? 'text-blue-600'
                            : milestone.status === 'pending'
                              ? 'text-slate-300'
                              : 'text-slate-400'
                        }`}
                      >
                        {milestone.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>

            {/* 최근 업무 */}
            <ContentCard
              title="최근 업무"
              description="최근 활성 업무 목록입니다."
            >
              <div className="flex flex-col gap-2">
                {project.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {task.status === 'done' ? (
                        <CheckCircle2 size={16} className="flex-shrink-0 text-green-400" />
                      ) : task.status === 'in_progress' ? (
                        <Clock size={16} className="flex-shrink-0 text-blue-400" />
                      ) : (
                        <Circle size={16} className="flex-shrink-0 text-slate-300" />
                      )}
                      <span className="truncate text-sm font-medium text-slate-700">
                        {task.title}
                      </span>
                    </div>
                    <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">{task.assignee}</span>
                      <PriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>
          </div>

          {/* 우측 컬럼 */}
          <div className="flex flex-col gap-5">
            {/* 팀 멤버 */}
            <ContentCard title="팀 멤버">
              <div className="flex flex-col gap-3">
                {project.team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* 아바타 */}
                      <div className="relative">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name[0]}
                        </div>
                        {member.online && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-400">{member.role}</p>
                      </div>
                    </div>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                ))}

                {/* 팀원 초대 */}
                <button
                  type="button"
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-500"
                >
                  <Plus size={15} />
                  팀 멤버 초대
                </button>
              </div>
            </ContentCard>

            {/* 프로젝트 정보 */}
            <ContentCard title="프로젝트 정보">
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">시작일</span>
                  <span className="font-semibold text-slate-800">{project.startDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">마감 예정일</span>
                  <span className="font-semibold text-slate-800">
                    {project.endDate}
                    <span className="ml-1 text-xs text-slate-400">
                      (남은 기간: {project.remainingDays}일)
                    </span>
                  </span>
                </div>

                {/* 구분선 */}
                <div className="my-1 border-t border-slate-100" />

                {/* 태그 */}
                <div>
                  <p className="mb-2 font-medium text-slate-500">태그</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="my-1 border-t border-slate-100" />

                {/* 연결된 리소스 */}
                <div>
                  <p className="mb-2 font-medium text-slate-500">연결된 리소스</p>
                  <div className="flex flex-col gap-2">
                    {project.resources.map((res) => (
                      <a
                        key={res.label}
                        href={res.url}
                        className="flex items-center gap-2 text-blue-500 hover:underline"
                      >
                        <ExternalLink size={13} />
                        <span>{res.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </ContentCard>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <ProjectTasksTab
          projectId={projectId}
          viewMode={taskViewMode}
          createModalOpen={taskCreateModalOpen}
          createStatus={taskCreateStatus}
          onViewModeChange={setTaskViewMode}
          onOpenCreateModal={handleOpenTaskCreateModal}
          onCloseCreateModal={() => setTaskCreateModalOpen(false)}
        />
      )}

      {tab === 'board' && (
        <ProjectBoardTab projectId={Number(projectId)} />
      )}

      {/* 다른 탭: 빈 상태 (실제 구현 시 채움) */}
      {tab !== 'overview' && tab !== 'tasks' && tab !== 'board' && (
        <div className="mt-5 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
          <FileText size={36} className="mb-3 text-slate-300" />
          <p className="text-sm font-semibold">
            {tabItems.find((t) => t.value === tab)?.label} 탭은 준비 중입니다.
          </p>
        </div>
      )}
    </PageComponent>
  )
}

export default ProjectDetailPage
