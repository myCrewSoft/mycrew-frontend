// src/pages/project/ProjectListPage.tsx

import { Calendar, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { projectApi } from '../../api/projectApi'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'
import DatePickerField from '../../components/common/form/datePicker/DatePickerField'
import FormField from '../../components/common/form/formField/FormField'
import Textarea from '../../components/common/form/textarea/Textarea'
import { useApi, useApiList } from '../../hooks/useApi'
import { useToast } from '../../components/common/toast/useToast'
import type { ProjectCreateRequestDto, ProjectListResponseDto } from '../../types/project'
import { ApiError } from '../../api/axiosInstance'
import { useAuth } from '../../store/AuthContext'

// ── 상태코드 설정 ─────────────────────────────────────────────────
type ProjectStatCd = '01' | '02' | '03' | '04'

const statusConfig: {
  [key in ProjectStatCd]: { label: string; badge: 'warning' | 'primary' | 'success' | 'neutral' }
} = {
  '01': { label: '예정', badge: 'warning' },
  '02': { label: '진행 중', badge: 'primary' },
  '03': { label: '완료', badge: 'success' },
  '04': { label: '중단', badge: 'neutral' },
}

const statGroups: { statCd: ProjectStatCd; label: string }[] = [
  { statCd: '01', label: '예정' },
  { statCd: '02', label: '진행 중' },
  { statCd: '03', label: '완료' },
  { statCd: '04', label: '중단' },
]

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

// ── 프로젝트 카드 ─────────────────────────────────────────────────
const ProjectCard = ({
  project,
  onClick,
}: {
  project: ProjectListResponseDto
  onClick: () => void
}) => {
  const cfg = statusConfig[project.projStatCd as ProjectStatCd] ?? {
    label: project.projStatCd,
    badge: 'neutral' as const,
  }

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <Badge variant={cfg.badge}>{cfg.label}</Badge>
      </div>
      <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-blue-600">
        {project.projNm}
      </h3>
      <div className="flex flex-col gap-1.5 text-xs text-slate-400">
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

// ── 등록 Drawer ──────────────────────────────────────────────────
const RegisterDrawer = ({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) => {
  const { auth } = useAuth()

  const [projNm, setProjNm] = useState('')
  const [projCn, setProjCn] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Array<string | number>>([])
  const currentEmpId = auth.payload?.sub ? Number(auth.payload.sub) : undefined

  const { execute: createProject, loading: creating } = useApi(
    projectApi.createProject,
    { immediate: false },
  )

  const { showToast } = useToast()

  const handleSubmit = async () => {
    if (!projNm.trim()) {
      showToast({ title: '프로젝트명을 입력해주세요.', variant: 'danger' })
      return
    }
    if (!startDate) {
      showToast({ title: '시작일을 선택해주세요.', variant: 'danger' })
      return
    }
    if (!endDate) {
      showToast({ title: '마감 예정일을 선택해주세요.', variant: 'danger' })
      return
    }
    if (selectedMemberIds.length === 0) {
      showToast({ title: '팀원을 1명 이상 선택해주세요.', variant: 'danger' })
      return
    }

    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    const reqDto: ProjectCreateRequestDto = {
      projNm,
      projCn,
      projBgngYmd: formatDate(startDate),
      projEndYmd: formatDate(endDate),
      projMemberList: [
        ...selectedMemberIds.map((id) => ({ empId: Number(id) })),
      ],
    }

    try {
      await createProject(reqDto)
      showToast({ title: '프로젝트가 등록되었습니다.', variant: 'success' })
      setProjNm('')
      setProjCn('')
      setStartDate(null)
      setEndDate(null)
      setSelectedMemberIds([])
      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.httpStatus === 403) {
        showToast({ title: '프로젝트 등록 권한이 없습니다.', variant: 'danger' })
      } else {
        showToast({ title: '프로젝트 등록에 실패했습니다.', variant: 'danger' })
      }
      if (endDate <= startDate!) {
        showToast({ title: '마감 예정일은 시작일 이후여야 합니다.', variant: 'danger' })
        return
      }
      console.error(err)
    }
  }

  return (
    <>
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <aside
        className={`absolute right-0 top-0 z-50 flex h-full w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <h2 className="text-lg font-bold text-slate-900">프로젝트 등록</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <FormField
              label="프로젝트명"
              placeholder="프로젝트 이름을 입력하세요"
              required
              value={projNm}
              onChange={(e) => setProjNm(e.target.value)}
            />
            <Textarea
              label="프로젝트 설명"
              placeholder="프로젝트 목표와 범위를 간략히 설명해주세요"
              rows={3}
              value={projCn}
              onChange={(e) => setProjCn(e.target.value)}
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
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                팀원 <span className="text-red-500">*</span>
              </label>
              <EmployeeSearchPicker
                variant="detailed"
                remoteSearch
                showAllOnEmpty
                showDepartmentFilter
                fixedParams={{ excludeEmpId: currentEmpId }}  
                selectedEmployeeIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={creating}>
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') as ProjectStatCd | null

  const {
    data: projectListData,
    loading,
    execute: fetchProjectList,
  } = useApiList(projectApi.getProjectList)

  const projectList: ProjectListResponseDto[] = projectListData ?? []

  const filteredList = statusFilter
    ? projectList.filter((p) => p.projStatCd === statusFilter)
    : projectList

  const listTitle = statusFilter
    ? (statusConfig[statusFilter]?.label ?? '전체 목록')
    : '전체 목록'

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
      <div className="flex h-14 shrink-0 items-center justify-between bg-white px-6 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">프로젝트 목록</h1>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setDrawerOpen(true)}
        >
          프로젝트 등록
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-4 p-6">

        <div className="grid shrink-0 grid-cols-4 gap-4">
          {statGroups.map(({ statCd, label }) => {
            const count = projectList.filter((p) => p.projStatCd === statCd).length
            const cfg = statusConfig[statCd]
            return (
              <div
                key={statCd}
                className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <Badge variant={cfg.badge}>{label}</Badge>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-slate-900">{count}</span>
                  <span className="ml-1 text-xs text-slate-400">개</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="flex h-12 shrink-0 items-center border-b border-slate-100 px-5">
            <span className="text-sm font-bold text-slate-700">{listTitle}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                불러오는 중...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title= {statusFilter ? `${listTitle}된 프로젝트가 없습니다.` : '참여 중인 프로젝트가 없습니다.'}
                  description={statusFilter ? undefined : '새 프로젝트를 등록해보세요.'}
                />
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {filteredList.map((project) => (
                  <ProjectCard
                    key={project.projId}
                    project={project}
                    onClick={() => navigate(`/project/${project.projId}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RegisterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => void fetchProjectList()}
      />
    </div>
  )
}

export default ProjectListPage