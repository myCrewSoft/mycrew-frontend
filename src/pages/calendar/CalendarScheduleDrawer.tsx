import { Building2, ClipboardList, FolderKanban, Globe2, X } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '../../api/axiosInstance'
import { scheduleApi } from '../../api/scheduleApi'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'
import DatePickerField from '../../components/common/form/datePicker/DatePickerField'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Textarea from '../../components/common/form/textarea/Textarea'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
import type { ScheduleRequestDto } from '../../types'
import {
  scheduleTypeColorMap,
  scheduleTypeLabelMap,
  type CalendarSelectedRange,
  type CalendarEventItem,
  type RepeatTypeCode,
  type ScheduleFormValues,
  type ScheduleTypeCode,
} from '../../types/calendar'
import { useCalendar } from './CalendarContext'

interface CalendarScheduleDrawerProps {
  open: boolean
  selectedDate: string
  selectedRange?: CalendarSelectedRange | null
  schedule?: CalendarEventItem | null
  onClose: () => void
}

interface OptionItem {
  value: string
  label: string
}

const scheduleTypeOptions: OptionItem[] = [
  { value: 'C002', label: scheduleTypeLabelMap.C002 },
  { value: 'C003', label: scheduleTypeLabelMap.C003 },
]

const repeatTypeOptions: OptionItem[] = [
  { value: '01', label: '매일' },
  { value: '02', label: '매주' },
  { value: '03', label: '매월' },
]

const alarmOptions: OptionItem[] = [
  { value: 'none', label: '알림 없음' },
  { value: '10', label: '10분 전' },
  { value: '30', label: '30분 전' },
  { value: '60', label: '1시간 전' },
  { value: '1440', label: '1일 전' },
]

const projectOptions: OptionItem[] = []
const taskOptions: OptionItem[] = []

const createInitialFormValues = (
  selectedDate: string,
  schedule?: CalendarEventItem | null,
  selectedRange?: CalendarSelectedRange | null,
): ScheduleFormValues => ({
  title: schedule?.title ?? '',
  detail: schedule?.detail ?? '',
  scheduleTypeCode: schedule?.scheduleTypeCode ?? 'C002',
  color: schedule
    ? scheduleTypeColorMap[schedule.scheduleTypeCode]
    : scheduleTypeColorMap.C002,
  beginDate: schedule?.start ?? selectedRange?.start ?? `${selectedDate}T09:00`,
  endDate: schedule?.end ?? selectedRange?.end ?? `${selectedDate}T10:00`,
  allDay: schedule?.allDay ?? selectedRange?.allDay ?? false,
  deptCd: schedule?.deptCd,
  projId: schedule?.projId,
  repeatYn: schedule?.repeat ?? false,
  repeatTypeCode: schedule?.repeatTypeCode,
  repeatEndDate: schedule?.repeatEndDate,
})

const padTimeValue = (value: number) => String(value).padStart(2, '0')

const parseLocalDateTime = (value?: string) => {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const parseLocalDate = (value?: string) => {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? null : date
}

const formatLocalDateTime = (date: Date | null) => {
  if (!date) return ''

  return [
    `${date.getFullYear()}-${padTimeValue(date.getMonth() + 1)}-${padTimeValue(date.getDate())}`,
    `${padTimeValue(date.getHours())}:${padTimeValue(date.getMinutes())}`,
  ].join('T')
}

const formatLocalDate = (date: Date | null) => {
  if (!date) return ''

  return `${date.getFullYear()}-${padTimeValue(date.getMonth() + 1)}-${padTimeValue(date.getDate())}`
}

const formatAllDayStartDateTime = (date: Date | null) => {
  const dateText = formatLocalDate(date)

  return dateText ? `${dateText}T00:00` : ''
}

const formatAllDayEndDateTime = (date: Date | null) => {
  const dateText = formatLocalDate(date)

  return dateText ? `${dateText}T23:59` : ''
}

const getOneHourLater = (date: Date | null) => {
  if (!date) return null

  const nextDate = new Date(date)
  nextDate.setHours(nextDate.getHours() + 1)

  return nextDate
}

const getScheduleScopeNotice = (
  scheduleTypeCode: ScheduleTypeCode,
  options: {
    deptCd?: string
    projectId?: string
    taskId?: string
  },
) => {
  if (scheduleTypeCode === 'C001') {
    return {
      icon: <Globe2 size={18} />,
      title: '전사 전체 일정',
      description: '모든 구성원에게 공유되는 일정으로 등록됩니다.',
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      titleClassName: 'text-blue-950',
    }
  }

  if (scheduleTypeCode === 'C003') {
    return {
      icon: <Building2 size={18} />,
      title: `${options.deptCd ?? '선택한 부서'} 일정`,
      description: '해당 부서 구성원에게 공유되는 일정으로 등록됩니다.',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      titleClassName: 'text-emerald-950',
    }
  }

  if (scheduleTypeCode === 'C005') {
    const projectName = options.projectId
      ? `프로젝트 #${options.projectId}`
      : '선택한 프로젝트'

    return {
      icon: <FolderKanban size={18} />,
      title: `${projectName} 일정`,
      description: '해당 프로젝트 참여자에게 공유되는 일정으로 등록됩니다.',
      className: 'border-cyan-100 bg-cyan-50 text-cyan-700',
      titleClassName: 'text-cyan-950',
    }
  }

  if (scheduleTypeCode === 'C006') {
    const taskName = options.taskId ? `업무 #${options.taskId}` : '선택한 업무'

    return {
      icon: <ClipboardList size={18} />,
      title: `${taskName} 일정`,
      description: '해당 업무 담당자와 관련 구성원에게 공유되는 일정으로 등록됩니다.',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
      titleClassName: 'text-slate-950',
    }
  }

  return null
}

const CalendarScheduleDrawer = ({
  open,
  selectedDate,
  selectedRange,
  schedule,
  onClose,
}: CalendarScheduleDrawerProps) => {
  const isEditMode = !!schedule
  const [formValues, setFormValues] = useState<ScheduleFormValues>(() =>
    createInitialFormValues(selectedDate, schedule, selectedRange),
  )
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<
    Array<string | number>
  >([])
  const [alarmMinutes, setAlarmMinutes] = useState('30')
  const [relatedProjectId, setRelatedProjectId] = useState(
    schedule?.projId ? String(schedule.projId) : '',
  )
  const [relatedTaskId, setRelatedTaskId] = useState(
    schedule?.taskId ? String(schedule.taskId) : '',
  )
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

  // 달력에서 날짜 선택이 바뀌면(비편집 모드) 시작/종료 일시를 즉시 갱신합니다.
  // useEffect 대신 렌더 중 setState 패턴을 사용해 cascading render를 방지합니다.
  const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate)
  const [prevSelectedRange, setPrevSelectedRange] = useState(selectedRange)
  if (
    !isEditMode &&
    (prevSelectedDate !== selectedDate ||
      prevSelectedRange?.start !== selectedRange?.start ||
      prevSelectedRange?.end !== selectedRange?.end ||
      prevSelectedRange?.allDay !== selectedRange?.allDay)
  ) {
    setPrevSelectedDate(selectedDate)
    setPrevSelectedRange(selectedRange)
    const nextInitialValues = createInitialFormValues(selectedDate, null, selectedRange)
    setFormValues((current) => ({
      ...current,
      beginDate: nextInitialValues.beginDate,
      endDate: nextInitialValues.endDate,
      allDay: nextInitialValues.allDay,
    }))
  }

  const { refreshSchedules } = useCalendar()
  const { showToast } = useToast()

  const { loading: saving, execute: createSchedule } = useApi<
    number,
    [ScheduleRequestDto]
  >(scheduleApi.createSchedule, {
    immediate: false,
  })
  const { loading: updating, execute: updateSchedule } = useApi<
    null,
    [string | number, ScheduleRequestDto]
  >(scheduleApi.updateSchedule, {
    immediate: false,
  })

  const submitting = saving || updating
  const shouldShowProjectSelect = formValues.scheduleTypeCode === 'C005'
  const shouldShowTaskSelect = formValues.scheduleTypeCode === 'C006'
  const shouldShowAttendeePicker = formValues.scheduleTypeCode !== 'C001'
  const scheduleScopeNotice = getScheduleScopeNotice(formValues.scheduleTypeCode, {
    deptCd: formValues.deptCd,
    projectId: relatedProjectId,
    taskId: relatedTaskId,
  })

  const handleScheduleTypeChange = (nextTypeCode: ScheduleTypeCode) => {
    setFormValues((current) => ({
      ...current,
      scheduleTypeCode: nextTypeCode,
      color: scheduleTypeColorMap[nextTypeCode],
    }))
    setRelatedProjectId('')
    setRelatedTaskId('')
  }

  const handleAllDayChange = (checked: boolean) => {
    setFormValues((current) => {
      const beginDate = parseLocalDateTime(current.beginDate)
      const endDate = parseLocalDateTime(current.endDate)

      return {
        ...current,
        allDay: checked,
        beginDate: checked
          ? formatAllDayStartDateTime(beginDate)
          : formatLocalDateTime(beginDate),
        endDate: checked
          ? formatAllDayEndDateTime(endDate)
          : formatLocalDateTime(endDate),
      }
    })
  }

  const handleBeginDateChange = (date: Date | null) => {
    setFormValues((current) => {
      const currentEndDate = parseLocalDateTime(current.endDate)
      const shouldMoveEndDate =
        date && (!currentEndDate || currentEndDate.getTime() < date.getTime())

      return {
        ...current,
        beginDate: current.allDay
          ? formatAllDayStartDateTime(date)
          : formatLocalDateTime(date),
        endDate: shouldMoveEndDate
          ? current.allDay
            ? formatAllDayEndDateTime(date)
            : formatLocalDateTime(getOneHourLater(date))
          : current.endDate,
      }
    })
  }

  const handleEndDateChange = (date: Date | null) => {
    setFormValues((current) => {
      const beginDate = parseLocalDateTime(current.beginDate)
      const nextDate =
        beginDate && date && date.getTime() < beginDate.getTime()
          ? beginDate
          : date

      return {
        ...current,
        endDate: current.allDay
          ? formatAllDayEndDateTime(nextDate)
          : formatLocalDateTime(nextDate),
      }
    })
  }

  const handleRepeatChange = (checked: boolean) => {
    setFormValues((current) => ({
      ...current,
      repeatYn: checked,
      repeatTypeCode: checked ? '01' : undefined,
      repeatEndDate: checked ? selectedDate : undefined,
    }))
  }

  const validateScheduleForm = () => {
    const title = formValues.title.trim()
    const beginDate = parseLocalDateTime(formValues.beginDate)
    const endDate = parseLocalDateTime(formValues.endDate)
    const repeatEndDate = formValues.repeatYn
      ? parseLocalDate(formValues.repeatEndDate)
      : null

    if (!title) return '일정명을 입력해 주세요.'
    if (!beginDate || !endDate) {
      return '시작 일시와 종료 일시를 모두 입력해 주세요.'
    }
    if (endDate.getTime() < beginDate.getTime()) {
      return '종료 일시는 시작 일시보다 빠를 수 없습니다.'
    }
    if (shouldShowProjectSelect && !relatedProjectId) {
      return '프로젝트 일정을 등록하려면 프로젝트를 선택해 주세요.'
    }
    if (shouldShowTaskSelect && !relatedTaskId) {
      return '업무 일정을 등록하려면 업무를 선택해 주세요.'
    }
    if (formValues.repeatYn && !formValues.repeatTypeCode) {
      return '반복 유형을 선택해 주세요.'
    }
    if (formValues.repeatYn && !repeatEndDate) {
      return '반복 종료일을 선택해 주세요.'
    }

    return null
  }

  const createSchedulePayload = (): ScheduleRequestDto => ({
    schdClsfCd: formValues.scheduleTypeCode,
    schdNm: formValues.title.trim(),
    deptCd: formValues.deptCd ?? '',
    projId:
      shouldShowProjectSelect && relatedProjectId
        ? Number(relatedProjectId)
        : 0,
    taskId:
      shouldShowTaskSelect && relatedTaskId
        ? Number(relatedTaskId)
        : 0,
    vconfId: 0,
    rsrvId: 0,
    schdDetailCn: formValues.detail,
    beginDt: formValues.beginDate,
    endDt: formValues.endDate,
    allDayYn: formValues.allDay ? 'Y' : 'N',
    reptYn: formValues.repeatYn ? 'Y' : 'N',
    reptTypeCd: formValues.repeatYn ? (formValues.repeatTypeCode ?? '') : '',
    reptEndDt: formValues.repeatYn ? (formValues.repeatEndDate ?? '') : '',
    targets: shouldShowAttendeePicker
      ? selectedAttendeeIds.map((id) => ({
          targetTypeCd: '01',
          targetId: String(id),
        }))
      : [],
  })

  const handleSubmit = async () => {
    const validationMessage = validateScheduleForm()
    setSaveErrorMessage(validationMessage)

    if (validationMessage) return

    try {
      if (isEditMode) {
        await updateSchedule(schedule.id, createSchedulePayload())
      } else {
        await createSchedule(createSchedulePayload())
      }

      await refreshSchedules()
      showToast({
        title: isEditMode
          ? '일정이 수정되었습니다.'
          : '일정이 등록되었습니다.',
        description: '캘린더에 변경 사항이 반영되었습니다.',
        variant: 'success',
      })
      onClose()
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveErrorMessage(error.message)
        return
      }

      setSaveErrorMessage(
        isEditMode
          ? '일정 수정 중 오류가 발생했습니다.'
          : '일정 등록 중 오류가 발생했습니다.',
      )
    }
  }

  return (
    <aside
      className={`h-full shrink-0 overflow-hidden border-slate-200 bg-white transition-[width,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? 'w-[420px] border-l' : 'w-0 border-l border-transparent'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`flex h-full w-[420px] flex-col shadow-[-16px_0_32px_rgba(15,23,42,0.06)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
        }`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {isEditMode ? '일정 수정' : '일정 등록'}
            </h2>
          </div>

          <IconButton aria-label="일정 창 닫기" size="sm" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5">
            <FormField
              label="일정명"
              required
              placeholder="일정명을 입력하세요"
              value={formValues.title}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />

            <Select
              label="일정 구분"
              value={formValues.scheduleTypeCode}
              options={scheduleTypeOptions}
              onChange={(event) =>
                handleScheduleTypeChange(event.target.value as ScheduleTypeCode)
              }
            />

            {scheduleScopeNotice && (
              <div
                className={`rounded-2xl border px-4 py-4 ${scheduleScopeNotice.className}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    {scheduleScopeNotice.icon}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-extrabold ${scheduleScopeNotice.titleClassName}`}
                    >
                      {scheduleScopeNotice.title}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-5">
                      {scheduleScopeNotice.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  일정 시간
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700">
                  <input
                    type="checkbox"
                    checked={formValues.allDay}
                    onChange={(event) =>
                      handleAllDayChange(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  종일
                </label>
              </div>

              <div className="flex flex-col gap-4 pl-3">
                <DatePickerField
                  label={formValues.allDay ? '시작일' : '시작 일시'}
                  mode={formValues.allDay ? 'date' : 'datetime'}
                  required
                  inline
                  leadingIcon={!formValues.allDay}
                  labelClassName="w-20 text-sm font-semibold !text-slate-500"
                  value={parseLocalDateTime(formValues.beginDate)}
                  onChange={handleBeginDateChange}
                />
                <DatePickerField
                  label={formValues.allDay ? '종료일' : '종료 일시'}
                  mode={formValues.allDay ? 'date' : 'datetime'}
                  required
                  inline
                  leadingIcon={!formValues.allDay}
                  labelClassName="w-20 text-sm font-semibold !text-slate-500"
                  minDate={parseLocalDateTime(formValues.beginDate) ?? undefined}
                  value={parseLocalDateTime(formValues.endDate)}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>

            {shouldShowProjectSelect && (
              <Select
                label="프로젝트 선택"
                value={relatedProjectId}
                options={[
                  { value: '', label: '프로젝트를 선택하세요' },
                  ...projectOptions,
                ]}
                onChange={(event) => setRelatedProjectId(event.target.value)}
              />
            )}

            {shouldShowTaskSelect && (
              <Select
                label="업무 선택"
                value={relatedTaskId}
                options={[
                  { value: '', label: '업무를 선택하세요' },
                  ...taskOptions,
                ]}
                onChange={(event) => setRelatedTaskId(event.target.value)}
              />
            )}

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  반복 일정
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700">
                  <input
                    type="checkbox"
                    checked={formValues.repeatYn}
                    onChange={(event) => handleRepeatChange(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  반복 설정
                </label>
              </div>

              {formValues.repeatYn && (
                <div className="flex flex-col gap-4 pl-3">
                  <label className="flex w-full items-center gap-3">
                    <span className="w-20 shrink-0 text-sm font-semibold text-slate-500">
                      반복 유형
                    </span>
                    <select
                      value={formValues.repeatTypeCode}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          repeatTypeCode: event.target.value as RepeatTypeCode,
                        }))
                      }
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none transition-all focus:border-blue-400"
                    >
                      {repeatTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <DatePickerField
                    label="반복 종료"
                    mode="date"
                    inline
                    labelClassName="w-20 text-sm font-semibold !text-slate-500"
                    value={parseLocalDate(formValues.repeatEndDate)}
                    onChange={(date) =>
                      setFormValues((current) => ({
                        ...current,
                        repeatEndDate: formatLocalDate(date),
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <Textarea
              label="상세 내용"
              placeholder="일정 상세 내용을 입력하세요"
              value={formValues.detail}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  detail: event.target.value,
                }))
              }
            />

            {shouldShowAttendeePicker && (
              <EmployeeSearchPicker
                variant="detailed"
                remoteSearch
                showDepartmentFilter
                showAllOnEmpty
                selectedEmployeeIds={selectedAttendeeIds}
                onChange={setSelectedAttendeeIds}
              />
            )}

            <Select
              label="알림 시간"
              value={alarmMinutes}
              options={alarmOptions}
              onChange={(event) => setAlarmMinutes(event.target.value)}
            />

          </div>
        </div>

        {saveErrorMessage && (
          <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {saveErrorMessage}
          </div>
        )}

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} loading={isEditMode ? updating : saving}>
            {isEditMode ? '수정' : '등록'}
          </Button>
        </footer>
      </div>
    </aside>
  )
}

export default CalendarScheduleDrawer
