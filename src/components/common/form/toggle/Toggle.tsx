import type { ButtonHTMLAttributes } from 'react'

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

const Toggle = ({ checked, onChange, label, className = '', ...props }: ToggleProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 ${className}`}
      {...props}
    >
      <span
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      {label && <span className="text-sm font-semibold text-slate-700">{label}</span>}
    </button>
  )
}

export default Toggle
