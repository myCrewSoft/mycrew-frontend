// src/pages/project/ProjectDetailPage.tsx
import { projectApi } from '../../api/projectApi'
import { useApi } from '../../hooks/useApi'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Share2,
  Plus,
  ChevronRight,
  FileText,
  Pencil,
} from 'lucide-react'
import PageComponent from '../../components/layouts/PageComponent'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import Button from '../../components/common/button/Button'
import Tabs from '../../components/common/tabs/Tabs'
import {
  ProjectTasksTab,
  type ProjectTaskStatusCode,
  type ProjectTaskViewMode,
} from './task'
import ProjectBoardTab from './ProjectBoardTab'
import ProjectMemberCard from './ProjectMemberListCard'
import ProjectInfoCard from './ProjectInfoCard'
import ProjectSummaryCard from './ProjectSummaryCard'
import ProjectUrgentTaskCard from './ProjectUrgentTaskCard'
import ProjectEditDrawer from './ProjectEditDrawer'
import { employeeApi } from '../../api/employeeApi'
import ProjectDriveTab from './ProjectDriveTab'
import ProjectGanttTab from './ProjectGanttTab'

const STATUS_LABEL: Record<string, string> = {
  '01': '예정',
  '02': '진행 중',
  '03': '완료',
  '04': '중단',
}
const STATUS_VARIANT: Record<string, 'primary' | 'neutral' | 'warning' | 'success'> = {
  '01': 'warning',
  '02': 'primary',
  '03': 'success',
  '04': 'neutral',
}

const ProjectDetailPage = () => {
  const navigate = useNavigate()
  const { projId } = useParams<{ projId: string }>()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'tasks' ? 'tasks' : 'overview'
  const focusTaskId = searchParams.get('taskId')
  const [tab, setTab] = useState(initialTab)
  const [taskViewMode, setTaskViewMode] = useState<ProjectTaskViewMode>('list')
  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false)
  const [taskCreateStatus, setTaskCreateStatus] = useState<ProjectTaskStatusCode>('00')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const projectId = Number(projId)

  const { data: project, loading, execute: refetchProject } = useApi(
    projectApi.getProject,
    { immediateArgs: [projectId] }
  )

  const { data: employeeList } = useApi(
    employeeApi.lookupEmployees,
    { immediateArgs: [{}] }
  )

  const {data: taskDashboard} = useApi(
    projectApi.getTaskDashboard,
    {immediateArgs: [projectId]}
  )
  const summary = taskDashboard?.summary
  const upcomingTasks = taskDashboard?.upcomingTasks ?? []

  // ✅ employees, departments 변환
  const employees = employeeList ?? []
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))]

  const tabItems = [
    { value: 'overview', label: '개요' },
    { value: 'tasks', label: '업무' },
    { value: 'gantt', label: '간트차트' },
    { value: 'board', label: '프로젝트 커뮤니티' },
    { value: 'drive', label: '프로젝트 드라이브' },
  ]

  const handleOpenTaskCreateModal = (status: ProjectTaskStatusCode = '00') => {
    setTab('tasks')
    setTaskCreateStatus(status)
    setTaskCreateModalOpen(true)
  }

  useEffect(() => {
    if (searchParams.get('tab') === 'tasks') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab('tasks')
    }
  }, [searchParams])

  if (loading) {
    return (
      <PageComponent title="" description="">
        <div className="flex h-64 items-center justify-center text-slate-400">
          데이터를 불러오는 중입니다...
        </div>
      </PageComponent>
    )
  }

  if (!project) {
    return (
      <PageComponent title="" description="">
        <div className="flex h-64 items-center justify-center text-slate-400">
          프로젝트를 찾을 수 없습니다.
        </div>
      </PageComponent>
    )
  }

  return (
    <PageComponent
      title={project.projNm}
      description={project.projCn}
      actions={
        <>
          <Button variant="outline" leftIcon={<Share2 size={15} />}>
            회의 생성
          </Button>
          {tab === 'tasks' ? (
            <Button
              variant="primary"
              leftIcon={<Plus size={15} />}
              onClick={() => handleOpenTaskCreateModal()}
            >
              업무 추가
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Pencil size={15} />}
              onClick={() => setEditDrawerOpen(true)}
            >
              프로젝트 수정
            </Button>
          )}
        </>
      }
    >
      {/* 브레드크럼 */}
      <div className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
        <button onClick={() => navigate('/project')} className="hover:text-blue-600">
          프로젝트
        </button>
        <ChevronRight size={14} />
        <span className="font-semibold text-slate-700">{project.projNm}</span>
        <Badge variant={STATUS_VARIANT[project.projStatCd]} className="ml-1">
          {STATUS_LABEL[project.projStatCd]}
        </Badge>
      </div>

      {/* 탭 */}
      <Tabs value={tab} onChange={setTab} items={tabItems} />

      {tab === 'overview' && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <ProjectSummaryCard
              cmplTaskCnt={summary?.completedCount ?? 0}
              inProgTaskCnt={summary?.inProgressCount ?? 0}
              projPrgrsRt={project.projPrgrsRt}
              stopTaskCnt={summary?.stopCount ?? 0}
              totTaskCnt={summary?.totalCount ?? 0}
            />
            <ProjectUrgentTaskCard taskList={upcomingTasks}/>
          </div>

          <div className="flex flex-col gap-5">
            <ProjectInfoCard
              projStatCd={project.projStatCd}
              projBgngYmd={project.projBgngYmd}
              projEndYmd={project.projEndYmd}
              projLdrNm={project.projLdrNm}
            />

            <ProjectMemberCard
              projId={project.projId}
              projLdrEmpId={project.projLdrEmpId}
              memberList={project.projMemberList}
              employees={employees}
              departments={departments}
              onSuccess={() => refetchProject(projectId)}
            />
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <ProjectTasksTab
          projectId={project.projId}
          focusTaskId={focusTaskId}
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

      {tab === 'drive' && <ProjectDriveTab projId={project.projId} />}

      {tab === 'gantt' && <ProjectGanttTab projectId={project.projId}/>}

      {/* 다른 탭: 빈 상태 (실제 구현 시 채움) */}
      {tab !== 'overview' && tab !== 'tasks' && tab !== 'board' && tab !== 'drive' && tab !== 'gantt' &&(
        <div className="mt-5 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
          <FileText size={36} className="mb-3 text-slate-300" />
          <p className="text-sm font-semibold">
            {tabItems.find((t) => t.value === tab)?.label} 탭은 준비 중입니다.
          </p>
        </div>
      )}

      
      {/* 수정 Drawer */}
      <ProjectEditDrawer
        key={project.projId}
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        project={project}
        onSuccess={() => refetchProject(projectId)}
      />

    </PageComponent>
  )
}

export default ProjectDetailPage
