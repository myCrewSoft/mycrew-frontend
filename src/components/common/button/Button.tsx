// components/common/button/Button.tsx

import type{ ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'success'
    | 'ghost'

  size?: 'sm' | 'md' | 'lg'

  loading?: boolean

  fullWidth?: boolean

  leftIcon?: React.ReactNode

  rightIcon?: React.ReactNode
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: Props) => {
  return (
    <button
      disabled={disabled || loading}
      className={`
        
        inline-flex items-center justify-center gap-2

        font-semibold

        transition-all duration-200

        active:scale-[0.98]

        disabled:cursor-not-allowed
        disabled:opacity-50

        hover:opacity-90

        ${
          variant === 'primary'
            ? `
              bg-gradient-to-r
              from-blue-600
              to-sky-400
              text-white
              shadow-lg
              shadow-blue-200/50
            `
            : ''
        }

        ${
          variant === 'secondary'
            ? `
              bg-gradient-to-r
              from-slate-500
              to-slate-300
              text-white
              shadow-lg
              shadow-slate-200/50
            `
            : ''
        }

        ${
          variant === 'outline'
            ? `
              border
              border-slate-200

              bg-gradient-to-r
              from-white
              to-slate-50

              text-slate-700

              shadow-sm
            `
            : ''
        }

        ${
          variant === 'danger'
            ? `
              bg-gradient-to-r
              from-red-500
              to-rose-400

              text-white

              shadow-lg
              shadow-red-200/50
            `
            : ''
        }

        ${
          variant === 'success'
            ? `
              bg-gradient-to-r
              from-emerald-500
              to-green-400

              text-white

              shadow-lg
              shadow-emerald-200/50
            `
            : ''
        }

        ${
          variant === 'ghost'
            ? `
              bg-gradient-to-r
              from-slate-100
              to-slate-50

              text-slate-700

              hover:from-slate-200
              hover:to-slate-100
            `
            : ''
        }

        ${
          size === 'sm'
            ? `
              h-9
              px-4
              text-sm
              rounded-xl
            `
            : ''
        }

        ${
          size === 'md'
            ? `
              h-11
              px-5
              text-sm
              rounded-2xl
            `
            : ''
        }

        ${
          size === 'lg'
            ? `
              h-14
              px-8
              text-base
              rounded-full
            `
            : ''
        }

        ${fullWidth ? 'w-full' : ''}

        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2
          size={16}
          className="animate-spin"
        />
      ) : (
        leftIcon
      )}

      {children}

      {!loading && rightIcon}
    </button>
  )
}

export default Button