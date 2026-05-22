import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
}

const Select = ({ label, options, className = '', ...props }: SelectProps) => {
  return (
    <label className="flex min-w-40 flex-col gap-2">
      {label && (
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      )}
      <select
        className={`h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default Select
