import { CalendarDays, Clock } from 'lucide-react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { ko } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import './DatePickerField.css'

registerLocale('ko', ko)

type DatePickerMode = 'date' | 'datetime' | 'time'

interface DatePickerFieldProps {
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  mode?: DatePickerMode
  placeholder?: string
  helperText?: string
  errorText?: string
  required?: boolean
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
  labelClassName?: string
  inputWrapperClassName?: string
  inline?: boolean
  leadingIcon?: boolean
}

const dateFormatByMode: Record<DatePickerMode, string> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm',
  time: 'HH:mm',
}

const defaultPlaceholderByMode: Record<DatePickerMode, string> = {
  date: '날짜를 선택하세요',
  datetime: '날짜와 시간을 선택하세요',
  time: '시간을 선택하세요',
}

const DatePickerField = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  helperText,
  errorText,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  labelClassName = '',
  inputWrapperClassName = '',
  inline = false,
  leadingIcon = false,
}: DatePickerFieldProps) => {
  const isTimeOnly = mode === 'time'
  const hasTimeSelect = mode === 'datetime' || mode === 'time'
  const Icon = mode === 'datetime' || isTimeOnly ? Clock : CalendarDays

  return (
    <label
      className={
        inline
          ? 'flex w-full items-center gap-3'
          : 'flex w-full flex-col gap-2'
      }
    >
      <span
        className={`flex items-center gap-1 text-sm font-semibold text-slate-700 ${
          inline ? 'shrink-0' : ''
        } ${labelClassName}`}
      >
        {label}
      </span>

      <div
        className={`relative ${
          inline ? 'min-w-0 flex-1' : ''
        } ${inputWrapperClassName}`}
      >
        <ReactDatePicker
          selected={value}
          onChange={(date) => onChange(date)}
          locale="ko"
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={hasTimeSelect}
          showTimeSelectOnly={isTimeOnly}
          timeIntervals={15}
          timeCaption="시간"
          dateFormat={dateFormatByMode[mode]}
          placeholderText={placeholder ?? defaultPlaceholderByMode[mode]}
          wrapperClassName="w-full"
          calendarClassName="common-datepicker-calendar"
          popperClassName="common-datepicker-popper"
          popperPlacement="bottom-end"
          portalId="common-datepicker-portal"
          className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm font-semibold text-slate-600 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            leadingIcon ? 'pl-11' : ''
          } ${
            errorText ? 'border-red-300 focus:border-red-400' : ''
          } ${className}`}
        />

        {leadingIcon && (
          <CalendarDays
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
          />
        )}

        <Icon
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
        />
      </div>

      {(errorText || helperText) && (
        <span
          className={`text-xs ${errorText ? 'text-red-500' : 'text-slate-400'}`}
        >
          {errorText || helperText}
        </span>
      )}
    </label>
  )
}

export default DatePickerField
