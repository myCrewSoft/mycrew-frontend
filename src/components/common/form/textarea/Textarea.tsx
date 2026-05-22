import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  errorText?: string
}

const Textarea = ({
  label,
  helperText,
  errorText,
  className = '',
  ...props
}: TextareaProps) => {
  return (
    <label className="flex w-full flex-col gap-2">
      {label && (
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      )}
      <textarea
        className={`min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 ${
          errorText ? 'border-red-300 focus:border-red-400' : ''
        } ${className}`}
        {...props}
      />
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

export default Textarea
