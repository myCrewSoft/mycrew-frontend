import { X } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/common/button/Button'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'
import IconButton from '../../components/common/button/IconButton'
import DatePickerField from '../../components/common/form/datePicker/DatePickerField'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Textarea from '../../components/common/form/textarea/Textarea'
import {
  scheduleTypeColorMap,
  scheduleTypeLabelMap,
  type RepeatTypeCode,
  type ScheduleFormValues,
  type ScheduleTypeCode,
} from '../../types/calendar'

interface CalendarScheduleDrawerProps {
  open: boolean
  selectedDate: string
  onClose: () => void
}

interface OptionItem {
  value: string
  label: string
}

const scheduleTypeOptions: OptionItem[] = [
  { value: 'C001', label: scheduleTypeLabelMap.C001 },
  { value: 'C002', label: scheduleTypeLabelMap.C002 },
  { value: 'C003', label: scheduleTypeLabelMap.C003 },
  { value: 'C004', label: scheduleTypeLabelMap.C004 },
  { value: 'C005', label: scheduleTypeLabelMap.C005 },
  { value: 'C006', label: scheduleTypeLabelMap.C006 },
  { value: 'C007', label: scheduleTypeLabelMap.C007 },
  { value: 'C008', label: scheduleTypeLabelMap.C008 },
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

// 프로젝트/업무/참석자는 임의 데이터를 넣지 않습니다.
// 백엔드 연동 후 API 응답을 아래 배열 대신 내려받아 연결하면 됩니다.
const projectOptions: OptionItem[] = []
const taskOptions: OptionItem[] = []

const createInitialFormValues = (
  selectedDate: string,
): ScheduleFormValues => ({
  title: '',
  detail: '',
  scheduleTypeCode: 'C002',
  color: scheduleTypeColorMap.C002,
  beginDate: `${selectedDate}T09:00`,
  endDate: `${selectedDate}T10:00`,
  allDay: false,
  repeatYn: false,
})

const padTimeValue = (value: number) => String(value).padStart(2, '0')

// DatePickerField는 Date 객체를 쓰고, 폼 상태는 백엔드 DTO에 맞추기 좋게 문자열로 보관합니다.
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

const CalendarScheduleDrawer = ({
  open,
  selectedDate,
  onClose,
}: CalendarScheduleDrawerProps) => {
  const [formValues, setFormValues] = useState<ScheduleFormValues>(() =>
    createInitialFormValues(selectedDate),
  )
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<
    Array<string | number>
  >([])
  const [alarmMinutes, setAlarmMinutes] = useState('30')
  const [relatedProjectId, setRelatedProjectId] = useState('')
  const [relatedTaskId, setRelatedTaskId] = useState('')

  // 일정 구분을 바꾸면 해당 구분의 기본 색상으로 같이 맞춥니다.
  const handleScheduleTypeChange = (nextTypeCode: ScheduleTypeCode) => {
    setFormValues((current) => ({
      ...current,
      scheduleTypeCode: nextTypeCode,
      color: scheduleTypeColorMap[nextTypeCode],
    }))
    setRelatedProjectId('')
    setRelatedTaskId('')
  }

  const shouldShowProjectSelect = formValues.scheduleTypeCode === 'C005'
  const shouldShowTaskSelect = formValues.scheduleTypeCode === 'C006'

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

  const handleSubmit = () => {
    // 아직 API가 없으므로, 백엔드로 보낼 데이터를 콘솔에서 먼저 확인합니다.
    console.log({
      ...formValues,
      projectId: shouldShowProjectSelect ? relatedProjectId : undefined,
      taskId: shouldShowTaskSelect ? relatedTaskId : undefined,
      attendeeIds: selectedAttendeeIds,
      alarmMinutes,
    })

    onClose()
  }

  return (
    <aside
      className={`h-full shrink-0 overflow-hidden border-slate-200 bg-white transition-[width,border-color] duration-300 ${
        open ? 'w-[420px] border-l' : 'w-0 border-l-0'
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full w-[420px] flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">일정 등록</h2>
          </div>

          <IconButton aria-label="일정 등록 닫기" size="sm" onClick={onClose}>
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

            <EmployeeSearchPicker
              variant="detailed"
              employees={[]}
              selectedEmployeeIds={selectedAttendeeIds}
              onChange={setSelectedAttendeeIds}
            />

            <Select
              label="알림 시간"
              value={alarmMinutes}
              options={alarmOptions}
              onChange={(event) => setAlarmMinutes(event.target.value)}
            />
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>등록</Button>
        </footer>
      </div>
    </aside>
  )
}

export default CalendarScheduleDrawer
