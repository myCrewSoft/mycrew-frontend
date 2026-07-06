import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
}

const Checkbox = ({ label, helperText, className = '', ...props }: CheckboxProps) => {
  return (
    <label className={`flex items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        {...props}
      />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {helperText && <span className="text-xs text-slate-400">{helperText}</span>}
      </span>
    </label>
  )
}

export default Checkbox
