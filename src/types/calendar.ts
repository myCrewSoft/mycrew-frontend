import type { ScheduleTargetResponseDto } from './index'

export type ScheduleTypeCode =
  | 'C001' // 사내 전체 일정
  | 'C002' // 개인(휴가 등) 일정
  | 'C003' // 부서 일정
  | 'C004' // 간부 일정
  | 'C005' // 프로젝트 일정
  | 'C006' // 프로젝트 내 업무 일정
  | 'C007' // 화상회의 일정
  | 'C008' // 회의실 일정

export type RepeatTypeCode = '01' | '02' | '03'

export interface CalendarSelectedRange {
  start: string
  end: string
  allDay: boolean
}
// 반복 타입: 01 - 매일, 02 - 매주, 03 - 매월

// 스케줄 응답 데이터
export interface ScheduleResponse {
  schdId: number
  schdClsfCd: ScheduleTypeCode | null
  deptCd: string | null
  projId: number | null
  schdNm: string | null
  schdDetailCn: string | null
  schdColor: string | null
  beginDt: string | null
  endDt: string | null
  schdWrtrId: number
  schdRegstDt: string | null
  schdChgrId: number | null
  schdChgDt: string | null
  delYn: 'Y' | 'N' | null
  delDt: string | null
  reptYn: 'Y' | 'N' | null
  reptTypeCd: RepeatTypeCode | null
  reptEndDt: string | null
}

// 일정 등록 폼
export interface ScheduleFormValues {
  title: string
  detail: string
  scheduleTypeCode: ScheduleTypeCode
  color: string
  beginDate: string
  endDate: string
  allDay: boolean
  deptCd?: string
  projId?: number
  repeatYn: boolean
  repeatTypeCode?: RepeatTypeCode
  repeatEndDate?: string
}

// 출력용 일정 데이터
export interface CalendarEventItem {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  scheduleTypeCode: ScheduleTypeCode
  detail?: string
  deptCd?: string
  projId?: number
  taskId?: number
  repeat?: boolean
  repeatTypeCode?: RepeatTypeCode
  repeatEndDate?: string
  targets?: ScheduleTargetResponseDto[]
  backgroundColor: string
  borderColor: string
  textColor: string
}

// 코드를 한글로 변환
export const scheduleTypeLabelMap: Record<ScheduleTypeCode, string> = {
  C001: '전체일정',
  C002: '개인 일정',
  C003: '부서일정',
  C004: '간부일정',
  C005: '프로젝트 일정',
  C006: '프로젝트 업무 일정',
  C007: '화상회의 일정',
  C008: '회의실 일정',
}

interface ScheduleTypeColorToken {
  background: string
  border: string
  text: string
}

// 일정 타입별 화면 색상 값
export const scheduleTypeColorTokenMap: Record<
  ScheduleTypeCode,
  ScheduleTypeColorToken
> = {
  C001: { background: '#E8EFFF', border: '#3377FF', text: '#0044CC' },
  C002: { background: '#FFF1E8', border: '#FF8C42', text: '#B34B00' },
  C003: { background: '#E6F4EA', border: '#34A853', text: '#137333' },
  C004: { background: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
  C005: { background: '#E0F7FA', border: '#26C6DA', text: '#00838F' },
  C006: { background: '#F1F3F4', border: '#9AA0A6', text: '#3C4043' },
  C007: { background: '#FCE8E6', border: '#EA4335', text: '#C5221F' },
  C008: { background: '#E2F2F1', border: '#00BFA5', text: '#00695C' },
}

// 체크박스, 아바타 점처럼 단일 대표색이 필요한 곳에서는 border 색상을 씁니다.
export const scheduleTypeColorMap: Record<ScheduleTypeCode, string> = {
  C001: scheduleTypeColorTokenMap.C001.border,
  C002: scheduleTypeColorTokenMap.C002.border,
  C003: scheduleTypeColorTokenMap.C003.border,
  C004: scheduleTypeColorTokenMap.C004.border,
  C005: scheduleTypeColorTokenMap.C005.border,
  C006: scheduleTypeColorTokenMap.C006.border,
  C007: scheduleTypeColorTokenMap.C007.border,
  C008: scheduleTypeColorTokenMap.C008.border,
}

// 반복 타입 코드를 한글로 변환
export const repeatTypeLabelMap: Record<RepeatTypeCode, string> = {
  '01': '매일',
  '02': '매주',
  '03': '매월',
}
