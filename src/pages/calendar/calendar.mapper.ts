import type { ScheduleResponseDto } from '../../types'
import {
  scheduleTypeColorTokenMap,
  isCalendarSystemEvent,
  type CalendarEventItem,
  type ScheduleTypeCode,
} from '../../types/calendar'

// 백엔드에서 내려온 일정 구분 코드가 프론트에서 정의한 코드인지 확인합니다.
const isScheduleTypeCode = (value?: string): value is ScheduleTypeCode => {
  return !!value && value in scheduleTypeColorTokenMap
}

export const toCalendarEvent = (
  schedule: ScheduleResponseDto,
): CalendarEventItem | null => {
  const isSystemEvent = isScheduleTypeCode(schedule.scheduleTypeCode)
    ? isCalendarSystemEvent(schedule.scheduleTypeCode)
    : false

  if ((!schedule.id && !isSystemEvent) || !schedule.title || !schedule.start) {
    return null
  }

  // 알 수 없는 일정 구분 코드는 색상과 라벨을 정할 수 없으므로 화면에 조용히 숨기지 않고 에러로 드러냅니다.
  if (!isScheduleTypeCode(schedule.scheduleTypeCode)) {
    throw new Error(
      `알 수 없는 일정 구분 코드입니다: ${schedule.scheduleTypeCode ?? '없음'}`,
    )
  }

  const scheduleTypeCode = schedule.scheduleTypeCode

  // 일정 구분 코드는 백엔드 값 그대로 쓰고, 색상만 프론트 정책으로 입힙니다.
  const colorToken = scheduleTypeColorTokenMap[scheduleTypeCode]

  return {
    id: isSystemEvent
      ? `${scheduleTypeCode.toLowerCase()}-${schedule.start}-${schedule.title}`
      : String(schedule.id),
    title: schedule.title,
    start: schedule.start,
    end: schedule.end,
    allDay: schedule.allDay ?? false,
    scheduleTypeCode,
    detail: schedule.detail,
    deptCd: schedule.deptCd,
    deptNm: schedule.deptNm,
    projId: schedule.projId,
    taskId: schedule.taskId,
    mtngId: schedule.mtngId,
    rsrvId: schedule.rsrvId,
    repeat: schedule.repeat,
    repeatTypeCode: schedule.repeatTypeCode as CalendarEventItem['repeatTypeCode'],
    repeatEndDate: schedule.repeatEndDate,
    targets: schedule.targets,
    writerId: schedule.writerId,
    writerName: schedule.writerName,
    writerDeptNm: schedule.writerDeptNm,
    writerJobGrdNm: schedule.writerJobGrdNm,
    writerPrflImgFileId: schedule.writerPrflImgFileId,
    backgroundColor: colorToken.background,
    borderColor: colorToken.border,
    textColor: colorToken.text,
  }
}
