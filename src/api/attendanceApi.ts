import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

// ── 타입 정의 ────────────────────────────────────────────────────

/** 오늘 본인 근태 현황 */
export interface AtndToday {
  atndDt: string
  checkedIn: boolean
  checkedOut: boolean
  atndStatCd?: string
  atndStatNm?: string
  wrkStartDtm?: string | null
  wrkEndDtm?: string | null
  lateMin: number
  workMin: number
}

/** 출근/퇴근 처리 결과 */
export interface AtndCheckResult {
  atndDt: string
  atndStatCd: string
  atndStatNm: string
  wrkStartDtm?: string | null
  wrkEndDtm?: string | null
  lateMin: number
  earlyLeaveMin: number
  workMin: number
  otMin: number
  message: string
}

/** 근태 통계 지표 */
export interface AtndStats {
  period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  periodLabel: string
  workMin: number
  normalWorkMin: number
  otMin: number
  approvedOtMin: number
  excessMin: number
  lateCnt: number
  earlyLeaveCnt: number
  halfDayCnt: number
  leaveUseDay: number
  remainingWorkMin: number
  remainingOtMin: number
  stdWorkMinWk: number
  maxOtMinWk: number
  remainAnnualLeave: number
}

/** 근태 이력(일자별) */
export interface AtndHistory {
  atndDt: string
  wrkStartDtm?: string | null
  wrkEndDtm?: string | null
  workMin?: number | null
  lateMin?: number | null
  otMin?: number | null
  atndStatCd: string
  atndStatNm: string
}

/** 근무 정책 */
export interface AtndPolicy {
  atndPolicyId: number
  policyNm: string
  workBgnTm: string
  workEndTm: string
  breakMin: number
  lateGraceMin: number
  stdWorkMinDay: number
  stdWorkDaysWk: number
  stdWorkMinWk: number
  maxOtMinWk: number
  otUnitMin?: number | null
  annualLeaveDef: number
  effBgnYmd: string
  effEndYmd?: string | null
}

/** 근무 정책 저장 요청 */
export interface AtndPolicySaveRequest {
  policyNm: string
  workBgnTm: string
  workEndTm: string
  breakMin: number
  lateGraceMin: number
  stdWorkMinDay: number
  stdWorkDaysWk: number
  stdWorkMinWk: number
  maxOtMinWk: number
  otUnitMin?: number | null
  annualLeaveDef: number
}

/** 관리자 전체 근태 현황 행 */
export interface AdminAtndRow {
  empId: number
  empNm: string
  deptNm?: string | null
  jbpsNm?: string | null
  atndDt: string
  wrkStartDtm?: string | null
  wrkEndDtm?: string | null
  lateMin?: number | null
  workMin?: number | null
  otMin?: number | null
  atndStatCd: string
  atndStatNm: string
}

export type AtndPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

// ── 사원 API ─────────────────────────────────────────────────────

// 오늘 본인 근태 현황을 조회합니다.
const getToday = () => {
  return axiosInstance.get<ApiResponse<AtndToday>>('/api/attendance/today')
}

// 출근 처리합니다.
const checkIn = () => {
  return axiosInstance.post<ApiResponse<AtndCheckResult>>('/api/attendance/check-in')
}

// 퇴근 처리합니다.
const checkOut = () => {
  return axiosInstance.post<ApiResponse<AtndCheckResult>>('/api/attendance/check-out')
}

// 기간(일/주/월/년)별 근태 통계를 조회합니다.
const getStats = (period: AtndPeriod) => {
  return axiosInstance.get<ApiResponse<AtndStats>>('/api/attendance/stats', {
    params: { period },
  })
}

// 최근 N일 근태 이력을 조회합니다.
const getHistory = (days = 30) => {
  return axiosInstance.get<ApiResponse<AtndHistory[]>>('/api/attendance/history', {
    params: { days },
  })
}

// 지정한 월(YYYY-MM)의 일자별 근태를 조회합니다. (달력 표시용)
const getMonth = (ym: string) => {
  return axiosInstance.get<ApiResponse<AtndHistory[]>>('/api/attendance/month', {
    params: { ym },
  })
}

// ── 관리자 API ───────────────────────────────────────────────────

// 현재 유효한 근무 정책을 조회합니다.
const getPolicy = () => {
  return axiosInstance.get<ApiResponse<AtndPolicy | null>>('/api/admin/attendance/policy')
}

// 근무 정책을 저장합니다.
const savePolicy = (payload: AtndPolicySaveRequest) => {
  return axiosInstance.post<ApiResponse<AtndPolicy>>('/api/admin/attendance/policy', payload)
}

// 전체 사원 근태 현황을 조회합니다.
const getAllAttendance = (params: { date?: string; deptCd?: string; keyword?: string }) => {
  return axiosInstance.get<ApiResponse<AdminAtndRow[]>>('/api/admin/attendance', { params })
}

// ── 휴가 신청 API ─────────────────────────────────────────────────

/** 휴가 종류 */
export interface AtndLeaveType {
  leaveTypeCd: string
  leaveTypeNm: string
  deductDay: number
  paidYn: string
  halfDayCd?: string | null
}

/** 내 휴가 신청 내역 */
export interface MyLeave {
  leaveReqId: number
  drftDocSn: number
  leaveTypeNm: string
  leaveBgnDtm: string
  leaveEndDtm: string
  leaveDayCnt: number
  reqRsn?: string | null
  aprvlSttusCd: string
  rflctYn: string
  frstRegDt: string
}

/** 결재선 한 단계 */
export interface ApprovalLinePayload {
  aprvlMthdCd: string
  aprvlOrd: number
  aprvrEmpIds: number[]
}

/** 휴가 신청 요청 */
export interface LeaveApplyPayload {
  leaveTypeCd: string
  leaveBgnYmd: string
  leaveEndYmd: string
  reqRsn?: string
  docTtl: string
  tmplatCd?: string
  aprvlFullCn?: string
  aprvlHopeDt?: string
  atchFileId?: number
  approvalLines: ApprovalLinePayload[]
}

// 신청 가능한 휴가 종류를 조회합니다.
const getLeaveTypes = () => {
  return axiosInstance.get<ApiResponse<AtndLeaveType[]>>('/api/attendance/leave/types')
}

// 내 휴가 신청 내역을 조회합니다.
const getMyLeaves = () => {
  return axiosInstance.get<ApiResponse<MyLeave[]>>('/api/attendance/leave')
}

// 휴가를 신청합니다. (전자결재 문서 생성 + 결재요청)
const applyLeave = (payload: LeaveApplyPayload) => {
  return axiosInstance.post<ApiResponse<number>>('/api/attendance/leave', payload)
}

/** 사원별 연차 현황 */
export interface LeaveBalance {
  empId: number
  empNm: string
  deptNm?: string | null
  grantedDay: number
  usedDay: number
  remainDay: number
}

// (관리자) 사원별 연차 현황을 조회합니다.
const getLeaveBalances = (params: { baseYear?: number; keyword?: string }) => {
  return axiosInstance.get<ApiResponse<LeaveBalance[]>>('/api/admin/attendance/leave/balances', {
    params,
  })
}

// (관리자) 연차를 부여합니다.
const grantLeave = (payload: {
  empId: number
  baseYear: number
  days: number
  remark?: string
}) => {
  return axiosInstance.post<ApiResponse<void>>('/api/admin/attendance/leave/grant', payload)
}

export const attendanceApi = {
  getToday,
  checkIn,
  checkOut,
  getStats,
  getHistory,
  getMonth,
  getPolicy,
  savePolicy,
  getAllAttendance,
  getLeaveTypes,
  getMyLeaves,
  applyLeave,
}
