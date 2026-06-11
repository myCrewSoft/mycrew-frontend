// src/pages/project/ProjectDetailPage.tsx
import { useParams } from 'react-router-dom'
import { projectApi } from '../../api/projectApi'
import { useApi } from '../../hooks/useApi'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import ProjectMemberCard from './ProjectMemberListCard'
import ProjectInfoCard from './ProjectInfoCard'
import ProjectSummaryCard from './ProjectSummaryCard'
import ProjectUrgentTaskCard from './ProjectUrgentTaskCard'
import ProjectEditDrawer from './ProjectEditDrawer'
import { employeeApi } from '../../api/employeeApi'

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
  const { id } = useParams()
  const [tab, setTab] = useState('overview')
  const [taskViewMode, setTaskViewMode] = useState<ProjectTaskViewMode>('list')
  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false)
  const [taskCreateStatus, setTaskCreateStatus] = useState<ProjectTaskStatusCode>('00')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  const { projId } = useParams<{ projId: string }>()

  const { data: project, loading, execute: refetchProject } = useApi(
    projectApi.getProject,
    { immediateArgs: [Number(projId)] }
  )

  const { data: employeeList } = useApi(
    employeeApi.lookupEmployees,
    { immediateArgs: [{}] }
  )

  // ✅ employees, departments 변환
  const employees = employeeList ?? []
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))]

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
              cmplTaskCnt={23}
              inProgTaskCnt={10}
              projPrgrsRt={project.projPrgrsRt}
              stopTaskCnt={2}
              totTaskCnt={30}
            />
            <ProjectUrgentTaskCard />
          </div>

          <div className="flex flex-col gap-5">
            <ProjectInfoCard
              projStatCd={project.projStatCd}
              projBgngYmd={project.projBgngYmd}
              projEndYmd={project.projEndYmd}
              projLdrNm={project.projLdrNm}
            />
            {/* ✅ props 올바르게 전달 */}
            <ProjectMemberCard
              projId={project.projId}
              projLdrEmpId={project.projLdrEmpId}
              memberList={project.projMemberList}
              employees={employees}
              departments={departments}
              onSuccess={() => refetchProject(Number(projId))}
            />
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

      {tab !== 'overview' && tab !== 'tasks' && (
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
        onSuccess={() => refetchProject(Number(projId))}
      />

    </PageComponent>
  )
}

export default ProjectDetailPage
