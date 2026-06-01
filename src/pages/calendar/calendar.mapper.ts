import type { ScheduleResponseDto } from '../../types'
import {
  scheduleTypeColorTokenMap,
  type CalendarEventItem,
  type ScheduleTypeCode,
} from '../../types/calendar'

// 구분 코드 확인 
const isScheduleTypeCode = (value?: string): value is ScheduleTypeCode => {
  return !!value && value in scheduleTypeColorTokenMap
}

export const toCalendarEvent = (
  schedule: ScheduleResponseDto,
): CalendarEventItem | null => {
  // id: number -> string
  if (!schedule.id || !schedule.title || !schedule.start) {
    return null
  }

  // 구분 코드 검증
  if (!isScheduleTypeCode(schedule.scheduleTypeCode)) {
    throw new Error(
      `알 수 없는 일정 구분 코드입니다: ${schedule.scheduleTypeCode ?? '없음'}`,
    )
  }

  const scheduleTypeCode = schedule.scheduleTypeCode
  
  // 구분 코드에 맞춰 색상 적용
  const colorToken = scheduleTypeColorTokenMap[scheduleTypeCode]

  // 필수값 체크
  return {
    id: String(schedule.id),
    title: schedule.title,
    start: schedule.start,
    end: schedule.end,
    allDay: schedule.allDay ?? false,
    scheduleTypeCode,
    detail: schedule.detail,
    deptCd: schedule.deptCd,
    projId: schedule.projId,
    taskId: schedule.taskId,
    repeat: schedule.repeat,
    repeatTypeCode: schedule.repeatTypeCode as CalendarEventItem['repeatTypeCode'],
    repeatEndDate: schedule.repeatEndDate,
    backgroundColor: colorToken.background,
    borderColor: colorToken.border,
    textColor: colorToken.text,
  }
}
