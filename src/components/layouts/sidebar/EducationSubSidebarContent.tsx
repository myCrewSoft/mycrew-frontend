import { BookOpen, CheckCircle2, FileText, PlayCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  educationStatusLabels,
  getEducationCoursesByStatus,
  type EducationCourse,
  type EducationStatus,
} from '../../../pages/education/education.mock'
import SubSidebarSection from './SubSidebarSection'

const statusOrder: EducationStatus[] = ['inProgress', 'learning', 'completed']

const statusIconMap = {
  inProgress: PlayCircle,
  learning: BookOpen,
  completed: CheckCircle2,
}

const formatLabelMap: Record<EducationCourse['format'], string> = {
  video: '동영상',
  document: '문서',
}

const EducationSubSidebarContent = () => {
  const location = useLocation()

  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">교육</h2>
        <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
          선택한 교육의 진행 정보와 학습 자료를 확인합니다.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
        {statusOrder.map((status) => {
          const courses = getEducationCoursesByStatus(status)
          const StatusIcon = statusIconMap[status]

          return (
            <SubSidebarSection key={status} title={educationStatusLabels[status]}>
              {courses.map((course) => {
                const active =
                  location.pathname === `/education/${course.id}` ||
                  (location.pathname === '/education' &&
                    course.id === 'onboarding-security')

                return (
                  <Link
                    key={course.id}
                    to={`/education/${course.id}`}
                    className={`group flex flex-col gap-2 rounded-2xl px-4 py-3 text-left no-underline transition-colors ${
                      active
                        ? 'bg-blue-200 text-blue-800'
                        : 'text-slate-600 hover:bg-blue-100 hover:text-slate-950'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <StatusIcon size={16} className="shrink-0" />
                      <span className="truncate text-sm font-black">
                        {course.title}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold opacity-80">
                      <FileText size={13} />
                      {formatLabelMap[course.format]}
                      <span className="text-slate-400">·</span>
                      {course.duration}
                    </span>
                  </Link>
                )
              })}
            </SubSidebarSection>
          )
        })}
      </div>
    </div>
  )
}

export default EducationSubSidebarContent
