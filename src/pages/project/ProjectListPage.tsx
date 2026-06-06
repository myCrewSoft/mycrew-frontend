// src/pages/project/ProjectListPage.tsx

import { useState } from 'react'
import {
  Plus,
  X,
  Search,
  Calendar,
  CheckCircle2,
  Circle,
  Ban,
} from 'lucide-react'
import PageComponent from '../../components/layouts/PageComponent'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import Button from '../../components/common/button/Button'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import Tabs from '../../components/common/tabs/Tabs'
import FormField from '../../components/common/form/formField/FormField'
import Textarea from '../../components/common/form/textarea/Textarea'
import Select from '../../components/common/form/select/Select'
import DatePickerField from '../../components/common/form/datePicker/DatePickerField'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import { useNavigate } from 'react-router-dom'

// ── 타입 ─────────────────────────────────────────────────────────
type ProjectStatus = 'in_progress' | 'completed' | 'stopped'

interface TeamMember {
  name: string
  color: string
}

interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  progress: number
  totalTasks: number
  completedTasks: number
  dueDate: string
  startDate: string
  tags: string[]
  team: TeamMember[]
  category: string
}

// ── 더미 데이터 ──────────────────────────────────────────────────
const DUMMY_PROJECTS: Project[] = [
  {
    id: 1,
    name: '글로벌 통합 정산 플랫폼 고도화',
    description: '차세대 글로벌 결제 게이트웨이 및 정산 자동화 시스템 구축 프로젝트',
    status: 'in_progress',
    progress: 66,
    totalTasks: 124,
    completedTasks: 82,
    dueDate: '2024.06.30',
    startDate: '2024.01.02',
    tags: ['Fintech', 'Enterprise', 'Global'],
    team: [
      { name: '김철수', color: '#3b82f6' },
      { name: '이지혜', color: '#8b5cf6' },
      { name: '박민지', color: '#10b981' },
      { name: '정진호', color: '#f59e0b' },
    ],
    category: '엔터프라이즈 솔루션',
  },
  {
    id: 2,
    name: '사내 HR 시스템 리뉴얼',
    description: '인사관리 시스템 전면 개편 및 사용자 경험 개선 프로젝트',
    status: 'in_progress',
    progress: 42,
    totalTasks: 88,
    completedTasks: 37,
    dueDate: '2024.08.15',
    startDate: '2024.02.01',
    tags: ['HR', 'Internal', 'UX'],
    team: [
      { name: '최유진', color: '#ef4444' },
      { name: '한동훈', color: '#06b6d4' },
      { name: '임수연', color: '#f97316' },
    ],
    category: '내부 시스템',
  },
  {
    id: 3,
    name: '모바일 앱 v3.0 출시',
    description: '크로스플랫폼 모바일 앱 3.0 버전 개발 및 앱스토어 배포',
    status: 'in_progress',
    progress: 78,
    totalTasks: 156,
    completedTasks: 122,
    dueDate: '2024.05.20',
    startDate: '2023.11.01',
    tags: ['Mobile', 'iOS', 'Android'],
    team: [
      { name: '박준서', color: '#14b8a6' },
      { name: '김다은', color: '#a855f7' },
      { name: '오성민', color: '#3b82f6' },
      { name: '유하은', color: '#ec4899' },
    ],
    category: '모바일',
  },
  {
    id: 4,
    name: '데이터 분석 플랫폼 구축',
    description: '실시간 비즈니스 인텔리전스 대시보드 및 데이터 파이프라인 구현',
    status: 'completed',
    progress: 100,
    totalTasks: 92,
    completedTasks: 92,
    dueDate: '2024.03.31',
    startDate: '2023.09.01',
    tags: ['Data', 'Analytics', 'BI'],
    team: [
      { name: '이재원', color: '#22c55e' },
      { name: '정소희', color: '#f59e0b' },
    ],
    category: '데이터',
  },
  {
    id: 5,
    name: '고객 포털 2.0',
    description: '고객 자가서비스 포털 완전 리디자인 및 기능 확장',
    status: 'completed',
    progress: 100,
    totalTasks: 74,
    completedTasks: 74,
    dueDate: '2024.02.28',
    startDate: '2023.10.15',
    tags: ['Portal', 'B2C', 'Redesign'],
    team: [
      { name: '홍길동', color: '#6366f1' },
      { name: '김영희', color: '#f43f5e' },
      { name: '나한일', color: '#0ea5e9' },
    ],
    category: '고객서비스',
  },
  {
    id: 6,
    name: 'ERP 통합 마이그레이션',
    description: '레거시 ERP 시스템의 클라우드 전환 및 모듈 통합',
    status: 'stopped',
    progress: 31,
    totalTasks: 210,
    completedTasks: 65,
    dueDate: '2024.12.31',
    startDate: '2024.01.15',
    tags: ['ERP', 'Migration', 'Cloud'],
    team: [
      { name: '송민준', color: '#94a3b8' },
      { name: '권지수', color: '#64748b' },
    ],
    category: '인프라',
  },
]

// ── 헬퍼 ─────────────────────────────────────────────────────────
const statusConfig: Record<
  ProjectStatus,
  { label: string; badge: 'primary' | 'success' | 'neutral'; icon: React.ReactNode }
> = {
  in_progress: {
    label: '진행 중',
    badge: 'primary',
    icon: <Circle size={12} className="text-blue-500" />,
  },
  completed: {
    label: '완료',
    badge: 'success',
    icon: <CheckCircle2 size={12} className="text-green-500" />,
  },
  stopped: {
    label: '중단',
    badge: 'neutral',
    icon: <Ban size={12} className="text-slate-400" />,
  },
}

const tabItems = [
  { value: 'all', label: '전체', count: DUMMY_PROJECTS.length },
  {
    value: 'in_progress',
    label: '진행 중',
    count: DUMMY_PROJECTS.filter((p) => p.status === 'in_progress').length,
  },
  {
    value: 'completed',
    label: '완료',
    count: DUMMY_PROJECTS.filter((p) => p.status === 'completed').length,
  },
  {
    value: 'stopped',
    label: '중단',
    count: DUMMY_PROJECTS.filter((p) => p.status === 'stopped').length,
  },
]

// ── 프로젝트 카드 ─────────────────────────────────────────────────
const ProjectCard = ({
  project,
  onClick,
}: {
  project: Project
  onClick: () => void
}) => {
  const cfg = statusConfig[project.status]

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {project.category}
        </span>
        <Badge variant={cfg.badge}>{cfg.label}</Badge>
      </div>

      {/* 제목 + 설명 */}
      <div>
        <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-blue-600">
          {project.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {project.description}
        </p>
      </div>

      {/* 태그 */}
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* 진행률 */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">
            {project.completedTasks}/{project.totalTasks} 업무
          </span>
          <span className="font-bold text-slate-700">{project.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              project.status === 'completed'
                ? 'bg-green-400'
                : project.status === 'stopped'
                  ? 'bg-slate-300'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* 하단: 팀 + 마감일 */}
      <div className="flex items-center justify-between">
        {/* 팀 아바타 */}
        <div className="flex -space-x-2">
          {project.team.slice(0, 4).map((member, idx) => (
            <div
              key={idx}
              title={member.name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
              style={{ backgroundColor: member.color }}
            >
              {member.name[0]}
            </div>
          ))}
          {project.team.length > 4 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-500">
              +{project.team.length - 4}
            </div>
          )}
        </div>

        {/* 마감일 */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={12} />
          <span>{project.dueDate}</span>
        </div>
      </div>
    </div>
  )
}

// ── 등록 Drawer ──────────────────────────────────────────────────
const RegisterDrawer = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  return (
    <>
      {/* 딤 배경 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer 패널 */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <h2 className="text-lg font-bold text-slate-900">프로젝트 등록</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* 폼 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <FormField
              label="프로젝트명"
              placeholder="프로젝트 이름을 입력하세요"
              required
            />

            <Textarea
              label="프로젝트 설명"
              placeholder="프로젝트 목표와 범위를 간략히 설명해주세요"
              rows={3}
            />

            <Select
              label="카테고리"
              defaultValue=""
              options={[
                { value: '', label: '카테고리 선택' },
                { value: 'enterprise', label: '엔터프라이즈 솔루션' },
                { value: 'mobile', label: '모바일' },
                { value: 'internal', label: '내부 시스템' },
                { value: 'data', label: '데이터' },
                { value: 'infra', label: '인프라' },
                { value: 'customer', label: '고객서비스' },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                label="시작일"
                mode="date"
                value={startDate}
                onChange={setStartDate}
              />
              <DatePickerField
                label="마감 예정일"
                mode="date"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            <Select
              label="상태"
              defaultValue="in_progress"
              options={[
                { value: 'in_progress', label: '진행 중' },
                { value: 'completed', label: '완료' },
                { value: 'stopped', label: '중단' },
              ]}
            />

            <FormField
              label="태그"
              placeholder="태그를 입력하세요 (쉼표로 구분)"
              helperText="예: Fintech, Enterprise, Global"
            />

            {/* 팀원 선택 (간단 버전 — 실제는 EmployeeSearchPicker 교체) */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                팀원
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search size={15} className="text-slate-400" />
                <input
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
                  placeholder="이름 또는 부서로 검색"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                EmployeeSearchPicker 컴포넌트로 교체하세요
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex flex-shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={onClose}>
            등록하기
          </Button>
        </div>
      </aside>
    </>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────
const ProjectListPage = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = DUMMY_PROJECTS.filter((p) => {
    const matchTab = tab === 'all' || p.status === tab
    const matchKeyword =
      keyword === '' ||
      p.name.includes(keyword) ||
      p.description.includes(keyword) ||
      p.tags.some((t) => t.toLowerCase().includes(keyword.toLowerCase()))
    return matchTab && matchKeyword
  })

  return (
    <>
      <PageComponent
        title="프로젝트 목록"
        description={`총 ${DUMMY_PROJECTS.filter((p) => p.status === 'in_progress').length}개의 활성 프로젝트가 있습니다.`}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setDrawerOpen(true)}
          >
            프로젝트 등록
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          {/* 탭 + 검색 */}
          <div className="flex items-center justify-between gap-4">
            <Tabs
              value={tab}
              onChange={(v) => {
                setTab(v)
              }}
              items={tabItems}
            />
            <SearchInput
              wrapperClassName="w-60"
              placeholder="프로젝트 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {/* 카드 그리드 — 최소 300px, 최대 3열, 깨지지 않게 auto-fill */}
          {filtered.length === 0 ? (
            <EmptyState
              title="해당하는 프로젝트가 없습니다."
              description="검색어나 필터를 변경해보세요."
              actions={
                <Button variant="primary" onClick={() => setDrawerOpen(true)}>
                  + 프로젝트 등록
                </Button>
              }
            />
          ) : (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              }}
            >
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/project/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </PageComponent>

      <RegisterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  )
}

export default ProjectListPage