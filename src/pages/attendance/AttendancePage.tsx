import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import {
  attendanceHistory,
  attendanceMetrics,
  weeklyWorkStats,
  type AttendanceHistoryItem,
  type AttendanceSummaryMetric,
} from './attendance.mock'

const metricAccentClassMap: Record<AttendanceSummaryMetric['accent'], string> = {
  green: 'text-emerald-500 after:bg-emerald-500',
  red: 'text-red-600 after:bg-red-600',
  blue: 'text-blue-600 after:bg-blue-600',
}

const statusBadgeVariantMap: Record<
  AttendanceHistoryItem['status'],
  'success' | 'danger' | 'primary'
> = {
  정상: 'success',
  지각: 'danger',
  연장근무: 'primary',
}

const AttendancePage = () => {
  return (
    <div className="flex w-full flex-col gap-4 text-slate-950">
      
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {weeklyWorkStats.title}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {weeklyWorkStats.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm font-black text-slate-700">
            <IconButton aria-label="이전 달" size="xs">
              <ChevronLeft size={18} />
            </IconButton>
            <span>{weeklyWorkStats.month}</span>
            <IconButton aria-label="다음 달" size="xs">
              <ChevronRight size={18} />
            </IconButton>
          </div>
        </div>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex items-end justify-between gap-3">
              <strong className="text-3xl font-black text-slate-950">
                {weeklyWorkStats.total}
              </strong>
              <span className="text-xs font-bold text-slate-500">
                최대 68h
              </span>
            </div>

            <div className="mt-7">
              <div className="relative h-3 overflow-visible rounded-full bg-slate-200">
                <div className="h-full w-[61%] rounded-full bg-blue-500" />
                <span className="absolute left-[54%] top-1/2 h-4 w-0.5 -translate-y-1/2 bg-red-300" />
                <span className="absolute left-[72%] top-1/2 h-8 w-0.5 -translate-y-1/2 bg-red-300" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-medium text-slate-500">
                <span>{weeklyWorkStats.minimum}</span>
                <span>{weeklyWorkStats.standard}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded bg-blue-50 px-4 py-4">
                <p className="text-xs font-semibold text-slate-600">
                  남은 근무시간
                </p>
                <p className="mt-1 text-base font-black">
                  {weeklyWorkStats.remainingWork}
                </p>
              </div>
              <div className="rounded bg-blue-50 px-4 py-4">
                <p className="text-xs font-semibold text-slate-600">
                  남은 연장 근무
                </p>
                <p className="mt-1 text-base font-black">
                  {weeklyWorkStats.remainingOvertime}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {weeklyWorkStats.categories.map((category) => (
              <div
                key={category.label}
                className="flex h-11 items-center justify-between gap-3 rounded border bg-white px-4 text-sm font-black"
                style={{
                  borderColor: category.border,
                  borderLeftWidth: 4,
                  backgroundColor: category.background,
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="truncate">{category.label}</span>
                </span>
                <span className="shrink-0">{category.value}</span>
                <Info size={14} className="shrink-0 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {attendanceMetrics.map((metric) => (
          <ContentCard
            key={metric.id}
            title={metric.title}
            actions={
              <span className="text-xs font-semibold text-slate-400">
                {metric.period}
              </span>
            }
            className="rounded-lg"
          >
            <p
              className={`relative inline-block pb-4 text-3xl font-black after:absolute after:bottom-0 after:left-0 after:h-1 after:w-9 after:rounded-full ${
                metricAccentClassMap[metric.accent]
              }`}
            >
              {metric.value}
            </p>
            <p className="mt-2 text-xs font-black text-slate-700">
              {metric.helper}
            </p>
          </ContentCard>
        ))}
      </section>

      <ContentCard
        title="최근 근태 내역"
        className="overflow-hidden rounded-lg"
        actions={
          <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3">
            상세보기
          </Button>
        }
      >

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-blue-50 text-xs font-bold text-slate-600">
                <th className="px-5 py-3">일자</th>
                <th className="px-5 py-3">출근시간</th>
                <th className="px-5 py-3">퇴근시간</th>
                <th className="px-5 py-3">근무시간</th>
                <th className="px-5 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendanceHistory.map((item) => (
                <tr key={item.date} className="font-semibold text-slate-900">
                  <td className="px-5 py-4">
                    {item.date} ({item.day})
                  </td>
                  <td className="px-5 py-4">{item.checkIn}</td>
                  <td className="px-5 py-4">{item.checkOut}</td>
                  <td className="px-5 py-4 font-black">{item.workTime}</td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={statusBadgeVariantMap[item.status]}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  )
}

export default AttendancePage
