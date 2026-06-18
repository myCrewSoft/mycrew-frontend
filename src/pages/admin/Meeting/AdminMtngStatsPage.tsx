import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { useApi } from '../../../hooks/useApi'
import { adminMtngApi } from '../../../api/adminMtngApi'

const MTNG_TYPE_LABEL: Record<string, string> = {
  '01': '온라인',
  '02': '오프라인',
  '03': '복합',
}

const PIE_COLORS = ['#005cad', '#4e5e68', '#565e74']

function getLast6Months(): string[] {
  const result: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    result.push(`${yyyy}-${mm}`)
  }
  return result
}

export default function AdminMtngStatsPage() {
  const navigate = useNavigate()

  const { data: analytics } = useApi(
    adminMtngApi.getAdminMtngAnalytics,
    { immediate: true },
  )

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-6 font-sans text-[#191c1e]">
      <div className="mx-auto max-w-7xl">

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">회의 운영관리</h1>
          <p className="mt-1 text-sm text-[#414753]">
            전체 회의의 운영 상태와 회의록/녹취록 현황을 관리합니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex gap-6 border-b border-[#c0c6d5]">
          <button
            onClick={() => navigate('/admin/meeting')}
            className="pb-3 text-sm font-medium text-[#717785] hover:text-[#414753]"
          >
            전체 회의
          </button>
          <button className="border-b-2 border-[#005cad] pb-3 text-sm font-semibold text-[#005cad]">
            통계
          </button>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-2 gap-6">

          {/* 회의 유형별 비율 */}
            <div className="rounded-xl border border-[#c0c6d5] bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-bold text-[#191c1e]">회의 유형별 비율</p>
            <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                    <Pie
                    data={analytics?.typeStats ?? []}
                    dataKey="cnt"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    labelLine={false}
                    >
                    {(analytics?.typeStats ?? []).map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip
                    formatter={(value, name) => [value, MTNG_TYPE_LABEL[String(name)] ?? name]}
                    />
                </PieChart>
                </ResponsiveContainer>

                {/* 범례 */}
                <div className="flex flex-col gap-2">
                {(analytics?.typeStats ?? []).map((item, index) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm text-[#414753]">
                    <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span>{MTNG_TYPE_LABEL[item.label] ?? item.label}</span>
                    <span className="font-semibold text-[#191c1e]">{item.cnt}건</span>
                    </div>
                ))}
                {(analytics?.typeStats ?? []).length === 0 && (
                    <p className="text-xs text-[#717785]">데이터가 없습니다.</p>
                )}
                </div>
            </div>
            </div>

            {/* 월별 회의 건수 추이 */}
            <div className="rounded-xl border border-[#c0c6d5] bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-bold text-[#191c1e]">월별 회의 건수 추이</p>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart
                data={getLast6Months().map((month) => {
                    const found = (analytics?.monthlyStats ?? []).find((s) => s.label === month)
                    return { label: month, cnt: found?.cnt ?? 0 }
                })}
                >
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#717785' }}
                    tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#717785' }} allowDecimals={false} />
                <Tooltip
                    contentStyle={{ border: '1px solid #c0c6d5', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => `${v}`}
                />
                <Bar dataKey="cnt" name="회의 수" fill="#005cad" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>

          {/* 시간대별 회의 집중도 */}
          <div className="rounded-xl border border-[#c0c6d5] bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-bold text-[#191c1e]">시간대별 회의 집중도</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics?.hourlyStats ?? []}>
                <XAxis
                  dataKey="label"
                  tickFormatter={(v) => `${v}시`}
                  tick={{ fontSize: 12, fill: '#717785' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#717785' }} />
                <Tooltip
                  contentStyle={{ border: '1px solid #c0c6d5', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [value, '회의 수']}
                  labelFormatter={(v) => `${v}시`}
                />
                <Bar dataKey="cnt" name="회의 수" fill="#4e5e68" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 회의록 생성률 */}
          <div className="rounded-xl border border-[#c0c6d5] bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-bold text-[#191c1e]">회의록 생성률</p>
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="#f2f4f6"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="#005cad"
                    strokeWidth="10"
                    strokeDasharray={`${(analytics?.momGenerationRate ?? 0) * 2.639} 263.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-[#191c1e]">
                  {analytics?.momGenerationRate ?? 0}%
                </span>
              </div>
              <p className="text-xs text-[#717785]">완료된 회의 중 회의록 생성 비율</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}