import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Save, Search, Plus, ChevronRight } from 'lucide-react'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import Modal from '../../components/common/overlay/modal/Modal'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import { useApi } from '../../hooks/useApi'
import { ApiError } from '../../api/axiosInstance'
import {
  attendanceApi,
  type AdminAtndRow,
  type AdminAtndStat,
  type AtndPolicySaveRequest,
  type LeaveBalance,
} from '../../api/attendanceApi'

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayStr = () => ymd(new Date())
const monthStartStr = () => {
  const d = new Date()
  return ymd(new Date(d.getFullYear(), d.getMonth(), 1))
}

const DEFAULT_POLICY: AtndPolicySaveRequest = {
  policyNm: '표준 근무 정책',
  workBgnTm: '09:00',
  workEndTm: '18:00',
  breakMin: 60,
  lateGraceMin: 0,
  stdWorkMinDay: 480,
  stdWorkDaysWk: 5,
  stdWorkMinWk: 2400,
  maxOtMinWk: 720,
  otUnitMin: 30,
  annualLeaveDef: 15,
}

const formatMin = (min?: number | null) => {
  const m = min ?? 0
  if (m <= 0) return '0분'
  const h = Math.floor(m / 60)
  const r = m % 60
  return h === 0 ? `${r}분` : r === 0 ? `${h}시간` : `${h}시간 ${r}분`
}

const formatTime = (dtm?: string | null) => {
  if (!dtm) return '-'
  const d = new Date(dtm)
  return Number.isNaN(d.getTime())
    ? '-'
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDate = (ymdStr?: string | null) => {
  if (!ymdStr) return '-'
  const d = new Date(ymdStr)
  if (Number.isNaN(d.getTime())) return ymdStr
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getMonth() + 1}.${d.getDate()} (${week})`
}

type Variant = 'success' | 'danger' | 'primary' | 'warning' | 'neutral'

const statusVariant = (nm?: string): Variant => {
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

const inputCls =
  'h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium outline-none focus:border-blue-500'

const AdminAttendancePage = () => {
  const [searchParams] = useSearchParams()
  const view = searchParams.get('view') ?? 'policy'

  return (
    <div className="flex w-full flex-col gap-5 p-6 text-slate-950">
      <div>
        <h1 className="text-xl font-black">
          {view === 'stats' ? '사원 근태 현황' : view === 'leave' ? '연차 관리' : '근무 정책'}
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {view === 'stats'
            ? '일자별 전체 사원의 근태를 통계로 확인합니다.'
            : view === 'leave'
              ? '사원별 연차 현황을 확인하고 연차를 부여합니다.'
              : '회사의 표준 근무 정책을 설정합니다.'}
        </p>
      </div>

      {view === 'stats' ? <StatsView /> : view === 'leave' ? <LeaveView /> : <PolicyView />}
    </div>
  )
}

// ───────────────────────── 근무 정책 뷰 ─────────────────────────

const PolicyView = () => {
  const [form, setForm] = useState<AtndPolicySaveRequest>(DEFAULT_POLICY)
  const [saving, setSaving] = useState(false)

  const { data: policy } = useApi(attendanceApi.getPolicy)

  useEffect(() => {
    if (policy) {
      setForm({
        policyNm: policy.policyNm,
        workBgnTm: policy.workBgnTm,
        workEndTm: policy.workEndTm,
        breakMin: policy.breakMin,
        lateGraceMin: policy.lateGraceMin,
        stdWorkMinDay: policy.stdWorkMinDay,
        stdWorkDaysWk: policy.stdWorkDaysWk,
        stdWorkMinWk: policy.stdWorkMinWk,
        maxOtMinWk: policy.maxOtMinWk,
        otUnitMin: policy.otUnitMin ?? 30,
        annualLeaveDef: policy.annualLeaveDef,
      })
    }
  }, [policy])

  const setNum = (key: keyof AtndPolicySaveRequest, value: string) =>
    setForm((p) => ({ ...p, [key]: Number(value) }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await attendanceApi.savePolicy(form)
      alert(res.data.message ?? '저장되었습니다.')
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
      else alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ContentCard
      title="근무 정책 설정"
      actions={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save size={15} />}
          loading={saving}
          onClick={handleSave}
        >
          저장
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="정책명">
          <input
            className={inputCls}
            value={form.policyNm}
            onChange={(e) => setForm((p) => ({ ...p, policyNm: e.target.value }))}
          />
        </Field>
        <Field label="출근 시각">
          <input
            type="time"
            className={inputCls}
            value={form.workBgnTm}
            onChange={(e) => setForm((p) => ({ ...p, workBgnTm: e.target.value }))}
          />
        </Field>
        <Field label="퇴근 시각">
          <input
            type="time"
            className={inputCls}
            value={form.workEndTm}
            onChange={(e) => setForm((p) => ({ ...p, workEndTm: e.target.value }))}
          />
        </Field>
        <Field label="휴게 시간(분)">
          <input
            type="number"
            className={inputCls}
            value={form.breakMin}
            onChange={(e) => setNum('breakMin', e.target.value)}
          />
        </Field>
        <Field label="지각 허용(분)">
          <input
            type="number"
            className={inputCls}
            value={form.lateGraceMin}
            onChange={(e) => setNum('lateGraceMin', e.target.value)}
          />
        </Field>
        <Field label="1일 소정근로(분)">
          <input
            type="number"
            className={inputCls}
            value={form.stdWorkMinDay}
            onChange={(e) => setNum('stdWorkMinDay', e.target.value)}
          />
        </Field>
        <Field label="주 소정근로일">
          <input
            type="number"
            className={inputCls}
            value={form.stdWorkDaysWk}
            onChange={(e) => setNum('stdWorkDaysWk', e.target.value)}
          />
        </Field>
        <Field label="주 소정근로(분)">
          <input
            type="number"
            className={inputCls}
            value={form.stdWorkMinWk}
            onChange={(e) => setNum('stdWorkMinWk', e.target.value)}
          />
        </Field>
        <Field label="주 연장 한도(분)">
          <input
            type="number"
            className={inputCls}
            value={form.maxOtMinWk}
            onChange={(e) => setNum('maxOtMinWk', e.target.value)}
          />
        </Field>
        <Field label="연장 인정 단위(분)">
          <input
            type="number"
            className={inputCls}
            value={form.otUnitMin ?? 0}
            onChange={(e) => setNum('otUnitMin', e.target.value)}
          />
        </Field>
        <Field label="기본 연차(일)">
          <input
            type="number"
            className={inputCls}
            value={form.annualLeaveDef}
            onChange={(e) => setNum('annualLeaveDef', e.target.value)}
          />
        </Field>
      </div>
    </ContentCard>
  )
}

// ───────────────────────── 사원 근태 통계 뷰 ─────────────────────────

const StatsView = () => {
  const [from, setFrom] = useState(monthStartStr())
  const [to, setTo] = useState(todayStr())
  const [keyword, setKeyword] = useState('')
  const [detailEmp, setDetailEmp] = useState<AdminAtndStat | null>(null)

  const { data: rows, execute: fetchStats } = useApi(attendanceApi.getAttendanceStats, {
    immediate: false,
  })

  useEffect(() => {
    void fetchStats({ from, to })
  }, [from, to, fetchStats])

  const handleSearch = () => {
    void fetchStats({ from, to, keyword: keyword.trim() || undefined })
  }

  const list: AdminAtndStat[] = rows ?? []

  // 요약
  const totalPeople = list.length
  const lateCount = list.reduce((s, r) => s + (r.lateCnt ?? 0), 0)
  const totalLeaveDays = list.reduce((s, r) => s + (r.leaveDays ?? 0), 0)
  const workedList = list.filter((r) => (r.workMin ?? 0) > 0)
  const avgWorkMin =
    workedList.length === 0
      ? 0
      : Math.round(
          workedList.reduce((s, r) => s + (r.workMin ?? 0), 0) / workedList.length,
        )

  // 사원별 근무시간 (상위 정렬)
  const byWork = [...list]
    .filter((r) => (r.workMin ?? 0) > 0)
    .sort((a, b) => (b.workMin ?? 0) - (a.workMin ?? 0))
  const maxWork = Math.max(1, ...byWork.map((r) => r.workMin ?? 0))

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className={inputCls}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="text-sm font-bold text-slate-400">~</span>
          <input
            type="date"
            className={inputCls}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="사원명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" size="sm" leftIcon={<Search size={15} />} onClick={handleSearch}>
            조회
          </Button>
        </div>

        {/* 요약 카드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="대상 인원" value={`${totalPeople}명`} accent="text-blue-600" />
          <SummaryCard label="총 지각" value={`${lateCount}회`} accent="text-red-600" />
          <SummaryCard label="총 휴가" value={`${totalLeaveDays}일`} accent="text-violet-600" />
          <SummaryCard label="평균 근무" value={formatMin(avgWorkMin)} accent="text-emerald-600" />
        </div>

        {/* 사원별 근무시간 */}
        <ContentCard title="사원별 근무시간 (기간 합계)">
          {byWork.length === 0 ? (
            <EmptyHint />
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              {byWork.map((r) => (
                <div key={r.empId} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-sm font-bold text-slate-700">
                    {r.empNm}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="flex h-full items-center justify-end rounded-md bg-blue-500 px-2"
                      style={{ width: `${Math.max(8, ((r.workMin ?? 0) / maxWork) * 100)}%` }}
                    >
                      <span className="text-[10px] font-black text-white">
                        {formatMin(r.workMin)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentCard>

        {/* 상세 테이블 (사원 클릭 시 상세 모달) */}
        <ContentCard title="상세 내역" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-blue-50 text-xs font-bold text-slate-600">
                  <th className="px-4 py-3">사원</th>
                  <th className="px-4 py-3">부서</th>
                  <th className="px-4 py-3">직급</th>
                  <th className="px-4 py-3 text-right">출근</th>
                  <th className="px-4 py-3 text-right">근무시간</th>
                  <th className="px-4 py-3 text-right">지각</th>
                  <th className="px-4 py-3 text-right">조퇴</th>
                  <th className="px-4 py-3 text-right">휴가</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                      근태 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr
                      key={r.empId}
                      className="cursor-pointer font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                      onClick={() => setDetailEmp(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProfileAvatar fileId={r.prflImgFileId} name={r.empNm} size={28} />
                          <span>{r.empNm}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.deptNm ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{r.jbpsNm ?? '-'}</td>
                      <td className="px-4 py-3 text-right">{r.presentDays}일</td>
                      <td className="px-4 py-3 text-right font-black">{formatMin(r.workMin)}</td>
                      <td className="px-4 py-3 text-right">
                        {r.lateCnt > 0 ? (
                          <span className="text-red-600">{r.lateCnt}</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.earlyLeaveCnt > 0 ? (
                          <span className="text-amber-600">{r.earlyLeaveCnt}</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{r.leaveDays}일</td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight size={16} className="text-slate-400" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      </div>

      {detailEmp && (
        <EmployeeDetailModal
          emp={detailEmp}
          from={from}
          to={to}
          onClose={() => setDetailEmp(null)}
        />
      )}
    </>
  )
}

// ───────────────────────── 사원 근태 상세 모달 ─────────────────────────

const EmployeeDetailModal = ({
  emp,
  from,
  to,
  onClose,
}: {
  emp: AdminAtndStat
  from: string
  to: string
  onClose: () => void
}) => {
  const { data: rows, loading } = useApi(
    () => attendanceApi.getEmployeeAttendance(emp.empId, { from, to }),
    { immediate: true },
  )
  const list: AdminAtndRow[] = rows ?? []

  return (
    <Modal open title={`${emp.empNm} 근태 상세`} onClose={onClose} size="lg">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <ProfileAvatar fileId={emp.prflImgFileId} name={emp.empNm} size={48} rounded="xl" />
        <div className="min-w-0">
          <p className="text-base font-black text-slate-950">{emp.empNm}</p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {emp.deptNm ?? '-'} · {emp.jbpsNm ?? '-'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-semibold text-slate-400">
            {from} ~ {to}
          </p>
          <p className="text-sm font-black text-slate-900">
            근무 {formatMin(emp.workMin)} · 출근 {emp.presentDays}일
          </p>
        </div>
      </div>

      <div className="mt-3 max-h-[50vh] overflow-y-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0">
            <tr className="bg-blue-50 text-xs font-bold text-slate-600">
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2">출근</th>
              <th className="px-3 py-2">퇴근</th>
              <th className="px-3 py-2">근무</th>
              <th className="px-3 py-2">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  불러오는 중...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  해당 기간 근태 기록이 없습니다.
                </td>
              </tr>
            ) : (
              list.map((r) => (
                <tr key={r.atndDt} className="font-semibold text-slate-800">
                  <td className="px-3 py-2">{formatDate(r.atndDt)}</td>
                  <td className="px-3 py-2">{formatTime(r.wrkStartDtm)}</td>
                  <td className="px-3 py-2">{formatTime(r.wrkEndDtm)}</td>
                  <td className="px-3 py-2 font-black">{formatMin(r.workMin)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant(r.atndStatNm)} size="sm">
                      {r.atndStatNm}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

// ───────────────────────── 연차 관리 뷰 ─────────────────────────

const LeaveView = () => {
  const nowYear = new Date().getFullYear()
  const [baseYear, setBaseYear] = useState(nowYear)
  const [keyword, setKeyword] = useState('')
  const [grantDays, setGrantDays] = useState<Record<number, string>>({})
  const [grantingId, setGrantingId] = useState<number | null>(null)

  const { data: rows, execute: fetchBalances } = useApi(attendanceApi.getLeaveBalances, {
    immediate: false,
  })

  useEffect(() => {
    void fetchBalances({ baseYear })
  }, [baseYear, fetchBalances])

  const handleSearch = () => {
    void fetchBalances({ baseYear, keyword: keyword.trim() || undefined })
  }

  const handleGrant = async (empId: number) => {
    const days = Number(grantDays[empId])
    if (!days || Number.isNaN(days)) {
      alert('부여 일수를 입력하세요.')
      return
    }
    setGrantingId(empId)
    try {
      await attendanceApi.grantLeave({
        empId,
        baseYear,
        days,
        remark: `${baseYear}년 연차 부여`,
      })
      setGrantDays((p) => ({ ...p, [empId]: '' }))
      await fetchBalances({ baseYear, keyword: keyword.trim() || undefined })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '연차 부여에 실패했습니다.')
    } finally {
      setGrantingId(null)
    }
  }

  const list: LeaveBalance[] = rows ?? []
  const yearOptions = [nowYear - 2, nowYear - 1, nowYear, nowYear + 1]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={inputCls}
          value={baseYear}
          onChange={(e) => setBaseYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <input
          className={inputCls}
          placeholder="사원명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="outline" size="sm" leftIcon={<Search size={15} />} onClick={handleSearch}>
          조회
        </Button>
      </div>

      <ContentCard title={`${baseYear}년 사원별 연차 현황`} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-blue-50 text-xs font-bold text-slate-600">
                <th className="px-4 py-3">사원</th>
                <th className="px-4 py-3">부서</th>
                <th className="px-4 py-3 text-right">기본</th>
                <th className="px-4 py-3 text-right">추가부여</th>
                <th className="px-4 py-3 text-right">사용</th>
                <th className="px-4 py-3 text-right">잔여</th>
                <th className="px-4 py-3">연차 부여</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    사원이 없습니다.
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr key={r.empId} className="font-semibold text-slate-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProfileAvatar fileId={r.prflImgFileId} name={r.empNm} size={28} />
                        <span>{r.empNm}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.deptNm ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{r.baseDay}일</td>
                    <td className="px-4 py-3 text-right">{r.grantedDay}일</td>
                    <td className="px-4 py-3 text-right text-slate-600">{r.usedDay}일</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">
                      {r.remainDay}일
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-sm"
                          placeholder="일수"
                          value={grantDays[r.empId] ?? ''}
                          onChange={(e) =>
                            setGrantDays((p) => ({ ...p, [r.empId]: e.target.value }))
                          }
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Plus size={14} />}
                          loading={grantingId === r.empId}
                          onClick={() => handleGrant(r.empId)}
                        >
                          부여
                        </Button>
                      </div>
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

// ───────────────────────── 공통 소품 ─────────────────────────

const SummaryCard = ({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) => (
  <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-black ${accent}`}>{value}</p>
  </div>
)

const EmptyHint = () => (
  <div className="py-10 text-center text-sm font-semibold text-slate-400">
    해당 일자의 근태 기록이 없습니다.
  </div>
)

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex w-full flex-col gap-1.5 [&_input]:w-full">
    <span className="text-xs font-bold text-slate-600">{label}</span>
    {children}
  </label>
)

export default AdminAttendancePage
