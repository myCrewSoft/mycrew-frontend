import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CalendarDays,
  Clock3,
  FileCheck2,
  TrendingUp,
} from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { adminMtngApi } from '../../../api/adminMtngApi'

const MEETING_TYPE_META: Record<string, { label: string; color: string }> = {
  '01': { label: '온라인', color: '#8b5cf6' },
  '02': { label: '오프라인', color: '#f59e0b' },
  '03': { label: '혼합', color: '#06b6d4' },
  MT01: { label: '온라인', color: '#8b5cf6' },
  MT02: { label: '오프라인', color: '#f59e0b' },
  MT03: { label: '혼합', color: '#06b6d4' },
  MT001: { label: '온라인', color: '#8b5cf6' },
  MT002: { label: '오프라인', color: '#f59e0b' },
  MT003: { label: '혼합', color: '#06b6d4' },
}

const TOOLTIP_STYLE = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 12px 30px rgb(15 23 42 / 0.12)',
  fontSize: 12,
}

function getLast6Months(): string[] {
  const result: string[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    )
  }

  return result
}

export default function AdminMtngStatsPage() {
  const navigate = useNavigate()

  const { data: analytics, loading } = useApi(
    adminMtngApi.getAdminMtngAnalytics,
    { immediate: true },
  )
  const { data: stats } = useApi(adminMtngApi.getAdminMtngStats, {
    immediate: true,
  })

  const dashboard = useMemo(() => {
    const typeData = (analytics?.typeStats ?? []).map((item) => {
      const meta = MEETING_TYPE_META[item.label] ?? {
        label: '기타',
        color: '#94a3b8',
      }
      return { ...item, name: meta.label, color: meta.color }
    })
    const totalCount = typeData.reduce((sum, item) => sum + item.cnt, 0)
    const monthlyData = getLast6Months().map((month) => {
      const found = (analytics?.monthlyStats ?? []).find(
        (item) => item.label === month,
      )
      return {
        month,
        label: `${Number(month.slice(5))}월`,
        cnt: found?.cnt ?? 0,
      }
    })
    const hourlyData = [...(analytics?.hourlyStats ?? [])]
      .sort((a, b) => Number(a.label) - Number(b.label))
      .map((item) => ({ ...item, label: `${Number(item.label)}시` }))
    const peakHour = hourlyData.reduce<(typeof hourlyData)[number] | null>(
      (peak, item) => (!peak || item.cnt > peak.cnt ? item : peak),
      null,
    )
    const currentMonth = monthlyData.at(-1)?.cnt ?? 0
    const minutesRate = analytics?.momGenerationRate ?? 0
    const generatedMinutesCount = Math.round(
      ((stats?.completedCnt ?? 0) * minutesRate) / 100,
    )

    return {
      typeData,
      totalCount,
      monthlyData,
      hourlyData,
      peakHour,
      currentMonth,
      minutesRate,
      generatedMinutesCount,
    }
  }, [analytics, stats?.completedCnt])

  return (
    <section className="flex w-full flex-col gap-6 font-sans text-slate-950">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">회의 운영관리</h1>
        <p className="mt-1 text-sm text-slate-600">
          회의 사용 패턴과 회의록 생성 현황을 한눈에 확인합니다.
        </p>
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        <button
          onClick={() => navigate('/admin/meeting')}
          className="pb-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          전체 회의
        </button>
        <button className="border-b-2 border-blue-600 pb-3 text-sm font-bold text-blue-700">
          통계
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="전체 회의"
          value={`${dashboard.totalCount}건`}
          description="전체 유형 합계"
          icon={<CalendarDays size={20} />}
          iconClassName="bg-blue-50 text-blue-700"
        />
        <OverviewCard
          label="이번 달 회의"
          value={`${dashboard.currentMonth}건`}
          description="최근 집계 월 기준"
          icon={<TrendingUp size={20} />}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <OverviewCard
          label="집중 시간대"
          value={dashboard.peakHour?.label ?? '-'}
          description={
            dashboard.peakHour ? `${dashboard.peakHour.cnt}건으로 가장 많음` : '집계 데이터 없음'
          }
          icon={<Clock3 size={20} />}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <OverviewCard
          label="회의록 생성률"
          value={`${dashboard.minutesRate}%`}
          description="완료 회의 중 생성 비율"
          icon={<FileCheck2 size={20} />}
          iconClassName="bg-violet-50 text-violet-700"
        />
      </div>

      <div className={`grid grid-cols-1 gap-5 xl:grid-cols-12 ${loading ? 'animate-pulse' : ''}`}>
        <ChartCard
          title="월별 회의 흐름"
          description="최근 6개월 동안 회의 건수가 어떻게 변했는지 보여줍니다."
          className="xl:col-span-8"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dashboard.monthlyData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="meetingCountFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [`${value}건`, '회의 수']}
                labelFormatter={(_, payload) => payload[0]?.payload.month ?? ''}
              />
              <Area
                type="monotone"
                dataKey="cnt"
                name="회의 수"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#meetingCountFill)"
                activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="회의 유형 구성"
          description="온라인·오프라인·혼합 회의의 비중입니다."
          className="xl:col-span-4"
        >
          {dashboard.typeData.length > 0 ? (
            <div className="grid min-h-[280px] grid-cols-[minmax(0,1fr)_140px] items-center gap-2">
              <div className="relative h-56 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.typeData}
                      dataKey="cnt"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {dashboard.typeData.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [`${value}건`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-3xl font-black text-slate-950">
                    {dashboard.totalCount}
                  </strong>
                  <span className="mt-1 text-xs font-bold text-slate-400">전체 회의</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {dashboard.typeData.map((item) => {
                  const percentage = dashboard.totalCount
                    ? Math.round((item.cnt / dashboard.totalCount) * 100)
                    : 0
                  return (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-bold text-slate-700">{item.name}</span>
                      </div>
                      <p className="mt-1 pl-[18px] text-sm font-black text-slate-950">
                        {item.cnt}건 <span className="text-xs text-slate-400">{percentage}%</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="시간대별 회의 분포"
          description="회의가 집중되는 시간을 비교해 운영 부담을 확인합니다."
          className="xl:col-span-7"
        >
          {dashboard.hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={dashboard.hourlyData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [`${value}건`, '회의 수']}
                />
                <Bar dataKey="cnt" name="회의 수" fill="#0f766e" radius={[8, 8, 2, 2]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="회의록 생성 현황"
          description="종료된 회의가 실제 회의록으로 이어진 비율입니다."
          className="xl:col-span-5"
        >
          <div className="flex min-h-[270px] flex-col justify-center">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-black tracking-tight text-slate-950">
                  {dashboard.minutesRate}<span className="ml-1 text-2xl text-blue-600">%</span>
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  완료 회의 {stats?.completedCnt ?? 0}건 중 약 {dashboard.generatedMinutesCount}건 생성
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FileCheck2 size={28} />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, dashboard.minutesRate))}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                <span>0%</span>
                <span>목표 100%</span>
              </div>
            </div>

            <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
              <p className="text-xs font-bold text-blue-800">
                {dashboard.minutesRate >= 80
                  ? '회의록 관리가 안정적으로 이루어지고 있습니다.'
                  : '회의 종료 후 회의록 생성을 확인해 주세요.'}
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  )
}

function OverviewCard({
  label,
  value,
  description,
  icon,
  iconClassName,
}: {
  label: string
  value: string
  description: string
  icon: React.ReactNode
  iconClassName: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">{description}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}>
          {icon}
        </span>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string
  description: string
  className: string
  children: React.ReactNode
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-5">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function EmptyChart() {
  return (
    <div className="flex min-h-[270px] items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
      집계할 회의 데이터가 없습니다.
    </div>
  )
}
