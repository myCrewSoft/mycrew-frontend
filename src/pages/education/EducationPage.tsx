import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  FileText,
  PlayCircle,
  UserRound,
} from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import {
  educationStatusLabels,
  getEducationCourseById,
  type EducationCourse,
} from './education.mock'

const formatLabelMap: Record<EducationCourse['format'], string> = {
  video: '동영상',
  document: '문서',
}

const formatIconMap = {
  video: PlayCircle,
  document: FileText,
}

const statusBadgeVariantMap: Record<
  EducationCourse['status'],
  'primary' | 'success' | 'warning'
> = {
  inProgress: 'primary',
  learning: 'warning',
  completed: 'success',
}

const EducationPage = () => {
  const { educationId } = useParams()
  const selectedCourse = useMemo(
    () => getEducationCourseById(educationId),
    [educationId],
  )
  const FormatIcon = formatIconMap[selectedCourse.format]
  const progress = selectedCourse.progress ?? 0
  const isCompleted = selectedCourse.status === 'completed'

  return (
    <div className="flex w-full flex-col gap-5 text-slate-950">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={statusBadgeVariantMap[selectedCourse.status]}
                size="md"
              >
                {educationStatusLabels[selectedCourse.status].replace(' 목록', '')}
              </Badge>
              <Badge variant="outline" size="md">
                {formatLabelMap[selectedCourse.format]}
              </Badge>
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950">
              {selectedCourse.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              {selectedCourse.content}
            </p>
          </div>

          <Button
            size="lg"
            className="h-12 shrink-0 rounded-lg px-6"
            disabled={isCompleted}
            leftIcon={isCompleted ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
          >
            {isCompleted ? '교육 완료' : '교육 진행'}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ContentCard title="교육자" className="rounded-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserRound size={22} />
            </span>
            <div>
              <p className="text-base font-black text-slate-950">
                {selectedCourse.educatorName}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                교육 담당자
              </p>
            </div>
          </div>
        </ContentCard>

        <ContentCard title="교육 형태" className="rounded-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <FormatIcon size={22} />
            </span>
            <div>
              <p className="text-base font-black text-slate-950">
                {formatLabelMap[selectedCourse.format]}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {selectedCourse.documentType ?? selectedCourse.duration}
              </p>
            </div>
          </div>
        </ContentCard>

        <ContentCard title="학습 기한" className="rounded-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <CalendarClock size={22} />
            </span>
            <div>
              <p className="text-base font-black text-slate-950">
                {selectedCourse.dueDate ?? '기한 없음'}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                최근 업데이트 {selectedCourse.updatedAt}
              </p>
            </div>
          </div>
        </ContentCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ContentCard
          title="교육 내용"
          description="선택한 교육의 핵심 안내와 학습 상태를 확인합니다."
          className="rounded-lg"
        >
          <div className="rounded-lg bg-slate-50 p-5">
            <p className="text-sm font-semibold leading-7 text-slate-700">
              {selectedCourse.content}
            </p>
          </div>

          {selectedCourse.format === 'video' ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="text-slate-700">동영상 진행률</span>
                <span className="text-blue-600">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-950">
                  {selectedCourse.documentType}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  총 {selectedCourse.duration} 분량의 문서 교육입니다.
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg">
                문서 보기
              </Button>
            </div>
          )}
        </ContentCard>

        <ContentCard title="학습 요약" className="rounded-lg">
          <dl className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="font-bold text-slate-500">교육 제목</dt>
              <dd className="min-w-0 truncate font-black text-slate-950">
                {selectedCourse.title}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="font-bold text-slate-500">교육 형태</dt>
              <dd className="font-black text-slate-950">
                {formatLabelMap[selectedCourse.format]}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold text-slate-500">교육자</dt>
              <dd className="font-black text-slate-950">
                {selectedCourse.educatorName}
              </dd>
            </div>
          </dl>
        </ContentCard>
      </section>
    </div>
  )
}

export default EducationPage
