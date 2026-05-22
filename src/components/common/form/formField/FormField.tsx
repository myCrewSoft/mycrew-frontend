import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
  errorText?: string
  required?: boolean
  rightSlot?: ReactNode
}

const FormField = ({
  label,
  helperText,
  errorText,
  required = false,
  rightSlot,
  className = '',
  ...props
}: FormFieldProps) => {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>

      <div className="relative">
        <input
          className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 ${
            rightSlot ? 'pr-12' : ''
          } ${errorText ? 'border-red-300 focus:border-red-400' : ''} ${className}`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
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

export default FormField
