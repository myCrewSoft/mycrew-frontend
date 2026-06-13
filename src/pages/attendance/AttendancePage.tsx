import { type ComponentType, useEffect, useState } from 'react'
import {
  LogIn,
  LogOut,
  Clock,
  Briefcase,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  AlarmClock,
  DoorOpen,
  Coffee,
  Plane,
  CalendarCheck,
} from 'lucide-react'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import { useApi } from '../../hooks/useApi'
import { ApiError } from '../../api/axiosInstance'
import { attendanceApi, type AtndPeriod } from '../../api/attendanceApi'
import LeaveApply from './LeaveApply'
import OtApply from './OtApply'

// ── 표시 헬퍼 ────────────────────────────────────────────────────

const formatMin = (min?: number | null) => {
  const m = min ?? 0
  if (m <= 0) return '0분'
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r}분`
  if (r === 0) return `${h}시간`
  return `${h}시간 ${r}분`
}

const formatTime = (dtm?: string | null) => {
  if (!dtm) return '-'
  const d = new Date(dtm)
  if (Number.isNaN(d.getTime())) return '-'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDate = (ymd?: string | null) => {
  if (!ymd) return '-'
  const d = new Date(ymd)
  if (Number.isNaN(d.getTime())) return ymd
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getMonth() + 1}.${d.getDate()} (${week})`
}

const statusVariant = (
  nm?: string,
): 'success' | 'danger' | 'primary' | 'warning' | 'neutral' => {
  switch (nm) {
    case '정상':
      return 'success'
    case '지각':
      return 'danger'
    case '조퇴':
      return 'warning'
    case '근무중':
      return 'primary'
    default:
      return 'neutral'
  }
}

const leaveStatusLabel = (cd?: string) =>
  cd === '02' ? '승인' : cd === '03' ? '반려' : '대기중'

const leaveStatusVariant = (
  cd?: string,
): 'success' | 'danger' | 'warning' =>
  cd === '02' ? 'success' : cd === '03' ? 'danger' : 'warning'

const PERIOD_TABS: { value: AtndPeriod; label: string }[] = [
  { value: 'DAY', label: '일' },
  { value: 'WEEK', label: '주' },
  { value: 'MONTH', label: '월' },
  { value: 'YEAR', label: '년' },
]

const AttendancePage = () => {
  const [period, setPeriod] = useState<AtndPeriod>('WEEK')
  const [acting, setActing] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // 근무 중 경과 시간을 라이브로 갱신 (30초 간격)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const { data: today, execute: refetchToday } = useApi(attendanceApi.getToday)
  const { data: stats, execute: fetchStats } = useApi(attendanceApi.getStats, {
    immediate: false,
  })
  const { data: history, execute: refetchHistory } = useApi(attendanceApi.getHistory, {
    immediateArgs: [30],
  })
  const { data: leaves, execute: refetchLeaves } = useApi(attendanceApi.getMyLeaves)
  const { data: ots, execute: refetchOts } = useApi(attendanceApi.getMyOts)

  useEffect(() => {
    void fetchStats(period)
  }, [period, fetchStats])

  const handleCheck = async (kind: 'in' | 'out') => {
    setActing(true)
    try {
      const res =
        kind === 'in'
          ? await attendanceApi.checkIn()
          : await attendanceApi.checkOut()
      alert(res.data.message ?? '처리되었습니다.')
      await Promise.all([refetchToday(), fetchStats(period), refetchHistory(30)])
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
      else alert('처리 중 오류가 발생했습니다.')
    } finally {
      setActing(false)
    }
  }

  const checkedIn = today?.checkedIn ?? false
  const checkedOut = today?.checkedOut ?? false

  // 오늘 근무 중 경과 시간(분) — 출근했고 아직 퇴근 전이면 라이브로 계산
  const working = checkedIn && !checkedOut
  const todayElapsedMin =
    working && today?.wrkStartDtm
      ? Math.max(0, Math.floor((now - new Date(today.wrkStartDtm).getTime()) / 60000))
      : 0

  // 주간 근무 진행률 (완료분 + 진행중 오늘분)
  const stdWk = stats?.stdWorkMinWk ?? 0
  const stdDay = 8 * 60
  const completedWk = stdWk - (stats?.remainingWorkMin ?? 0)
  const workedWk = completedWk + Math.min(todayElapsedMin, stdDay)
  const progress = stdWk > 0 ? Math.min(100, Math.round((workedWk / stdWk) * 100)) : 0

  return (
    <div className="flex w-full flex-col gap-4 text-slate-950">
      {/* 출퇴근 카드 */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">
                오늘 ({formatDate(today?.atndDt)})
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-black text-slate-950">
                  {checkedOut
                    ? '퇴근 완료'
                    : checkedIn
                      ? '근무 중'
                      : '출근 전'}
                </span>
                {today?.atndStatNm && (
                  <Badge variant={statusVariant(today.atndStatNm)} size="sm">
                    {today.atndStatNm}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                출근 {formatTime(today?.wrkStartDtm)} · 퇴근{' '}
                {formatTime(today?.wrkEndDtm)}
              </p>
              {working && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                  <Clock size={13} className="animate-pulse" />
                  오늘 근무 {formatMin(todayElapsedMin)} 경과
                </div>
              )}
              {checkedOut && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  오늘 실근무 {formatMin(today?.workMin)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              leftIcon={<LogIn size={16} />}
              loading={acting}
              disabled={checkedIn}
              onClick={() => handleCheck('in')}
            >
              출근
            </Button>
            <Button
              variant="outline"
              leftIcon={<LogOut size={16} />}
              loading={acting}
              disabled={!checkedIn || checkedOut}
              onClick={() => handleCheck('out')}
            >
              퇴근
            </Button>
            <LeaveApply onApplied={() => { void refetchLeaves(); }} />
            <OtApply onApplied={() => { void refetchOts(); }} />
          </div>
        </div>
      </section>

      {/* 주간 근무 + 잔여 연차 */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">이번 주 근무 현황</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              주 소정근로 {formatMin(stdWk)} 기준
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-2.5">
            <CalendarCheck size={22} className="text-emerald-500" />
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-600">잔여 연차</p>
              <p className="text-xl font-black text-emerald-600">
                {stats?.remainAnnualLeave ?? 0}일
              </p>
              <p className="text-[11px] font-semibold text-slate-400">
                기본 {stats?.annualLeaveDef ?? 0} · 사용 {stats?.usedAnnualLeave ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-2">
              <strong className="text-3xl font-black text-slate-950">
                {formatMin(workedWk > 0 ? workedWk : 0)}
              </strong>
              {working && (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  근무 중
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
              남은 {formatMin(Math.max(0, stdWk - workedWk))}
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded bg-blue-50 px-4 py-4">
            <p className="text-xs font-semibold text-slate-600">남은 근무시간</p>
            <p className="mt-1 text-base font-black">
              {formatMin(stats?.remainingWorkMin)}
            </p>
          </div>
          <div className="rounded bg-blue-50 px-4 py-4">
            <p className="text-xs font-semibold text-slate-600">남은 연장 근무</p>
            <p className="mt-1 text-base font-black">
              {formatMin(stats?.remainingOtMin)}
            </p>
          </div>
        </div>
      </section>

      {/* 기간별 통계 */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">근태 통계</h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${
                  period === tab.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {stats?.periodLabel}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Briefcase} tone="blue" label="실근무" value={formatMin(stats?.workMin)} />
          <MetricCard icon={Hourglass} tone="indigo" label="연장근무" value={formatMin(stats?.otMin)} />
          <MetricCard icon={CheckCircle2} tone="emerald" label="승인근무" value={formatMin(stats?.approvedOtMin)} />
          <MetricCard icon={AlertTriangle} tone="red" label="초과근무" value={formatMin(stats?.excessMin)} />
          <MetricCard icon={AlarmClock} tone="amber" label="지각" value={`${stats?.lateCnt ?? 0}회`} />
          <MetricCard icon={DoorOpen} tone="orange" label="조퇴" value={`${stats?.earlyLeaveCnt ?? 0}회`} />
          <MetricCard icon={Coffee} tone="violet" label="반차" value={`${stats?.halfDayCnt ?? 0}회`} />
          <MetricCard icon={Plane} tone="emerald" label="사용 휴가" value={`${stats?.leaveUseDay ?? 0}일`} />
        </div>
      </section>

      {/* 내 휴가 신청 내역 */}
      <ContentCard title="내 휴가 신청 내역" className="overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-blue-50 text-xs font-bold text-slate-600">
                <th className="px-5 py-3">종류</th>
                <th className="px-5 py-3">기간</th>
                <th className="px-5 py-3">일수</th>
                <th className="px-5 py-3">사유</th>
                <th className="px-5 py-3">결재</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(leaves ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    휴가 신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                (leaves ?? []).map((lv) => (
                  <tr key={lv.leaveReqId} className="font-semibold text-slate-900">
                    <td className="px-5 py-4">{lv.leaveTypeNm}</td>
                    <td className="px-5 py-4">
                      {formatDate(lv.leaveBgnDtm)} ~ {formatDate(lv.leaveEndDtm)}
                    </td>
                    <td className="px-5 py-4 font-black">{lv.leaveDayCnt}일</td>
                    <td className="px-5 py-4 max-w-[200px] truncate text-slate-600">
                      {lv.reqRsn ?? '-'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={leaveStatusVariant(lv.aprvlSttusCd)} size="sm">
                        {leaveStatusLabel(lv.aprvlSttusCd)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* 내 초과근무 신청 내역 */}
      <ContentCard title="내 초과근무 신청 내역" className="overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-blue-50 text-xs font-bold text-slate-600">
                <th className="px-5 py-3">일자</th>
                <th className="px-5 py-3">시간</th>
                <th className="px-5 py-3">승인 시간</th>
                <th className="px-5 py-3">결재</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(ots ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    초과근무 신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                (ots ?? []).map((ot) => (
                  <tr key={ot.otReqId} className="font-semibold text-slate-900">
                    <td className="px-5 py-4">{formatDate(ot.otDt)}</td>
                    <td className="px-5 py-4">
                      {formatTime(ot.otBgnDtm)} ~ {formatTime(ot.otEndDtm)}
                    </td>
                    <td className="px-5 py-4 font-black text-blue-600">
                      {ot.rflctYn === 'Y' ? formatMin(ot.approvedMin) : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={leaveStatusVariant(ot.aprvlSttusCd)} size="sm">
                        {leaveStatusLabel(ot.aprvlSttusCd)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* 최근 근태 내역 */}
      <ContentCard title="최근 근태 내역" className="overflow-hidden rounded-lg">
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
              {(history ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    근태 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                (history ?? []).map((item) => (
                  <tr key={item.atndDt} className="font-semibold text-slate-900">
                    <td className="px-5 py-4">{formatDate(item.atndDt)}</td>
                    <td className="px-5 py-4">{formatTime(item.wrkStartDtm)}</td>
                    <td className="px-5 py-4">{formatTime(item.wrkEndDtm)}</td>
                    <td className="px-5 py-4 font-black">{formatMin(item.workMin)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant(item.atndStatNm)} size="sm">
                        {item.atndStatNm}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  )
}

type MetricTone = 'blue' | 'indigo' | 'emerald' | 'red' | 'amber' | 'orange' | 'violet'

const toneMap: Record<MetricTone, { icon: string; ring: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600', ring: 'hover:border-blue-200' },
  indigo: { icon: 'bg-indigo-50 text-indigo-600', ring: 'hover:border-indigo-200' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', ring: 'hover:border-emerald-200' },
  red: { icon: 'bg-red-50 text-red-600', ring: 'hover:border-red-200' },
  amber: { icon: 'bg-amber-50 text-amber-600', ring: 'hover:border-amber-200' },
  orange: { icon: 'bg-orange-50 text-orange-600', ring: 'hover:border-orange-200' },
  violet: { icon: 'bg-violet-50 text-violet-600', ring: 'hover:border-violet-200' },
}

type IconType = ComponentType<{ size?: number; className?: string }>

const MetricCard = ({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: IconType
  tone: MetricTone
  label: string
  value: string
}) => {
  const t = toneMap[tone]
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors ${t.ring}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export default AttendancePage
