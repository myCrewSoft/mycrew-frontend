import { useEffect, useState } from 'react'
import { LogIn, LogOut, Clock } from 'lucide-react'
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

  // 주간 근무 진행률 (남은 근무 기반)
  const stdWk = stats?.stdWorkMinWk ?? 0
  const workedWk = stdWk - (stats?.remainingWorkMin ?? 0)
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
          <div className="rounded bg-emerald-50 px-4 py-2 text-right">
            <p className="text-xs font-semibold text-slate-600">잔여 연차</p>
            <p className="text-lg font-black text-emerald-600">
              {stats?.remainAnnualLeave ?? 0}일
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between">
            <strong className="text-3xl font-black text-slate-950">
              {formatMin(workedWk > 0 ? workedWk : 0)}
            </strong>
            <span className="text-xs font-bold text-slate-500">
              남은 {formatMin(stats?.remainingWorkMin)}
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCell label="실근무" value={formatMin(stats?.workMin)} accent="blue" />
          <StatCell label="연장근무" value={formatMin(stats?.otMin)} accent="blue" />
          <StatCell label="승인근무" value={formatMin(stats?.approvedOtMin)} accent="green" />
          <StatCell label="초과근무" value={formatMin(stats?.excessMin)} accent="red" />
          <StatCell label="지각" value={`${stats?.lateCnt ?? 0}회`} accent="red" />
          <StatCell label="조퇴" value={`${stats?.earlyLeaveCnt ?? 0}회`} accent="red" />
          <StatCell label="반차" value={`${stats?.halfDayCnt ?? 0}회`} accent="blue" />
          <StatCell label="사용 휴가" value={`${stats?.leaveUseDay ?? 0}일`} accent="green" />
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

const accentMap: Record<'green' | 'red' | 'blue', string> = {
  green: 'text-emerald-500',
  red: 'text-red-600',
  blue: 'text-blue-600',
}

const StatCell = ({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'green' | 'red' | 'blue'
}) => (
  <div className="rounded-lg border border-slate-200 px-4 py-4">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className={`mt-1 text-xl font-black ${accentMap[accent]}`}>{value}</p>
  </div>
)

export default AttendancePage
