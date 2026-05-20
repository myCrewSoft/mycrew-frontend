import type{ ButtonHTMLAttributes } from 'react'

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean

  size?: 'sm' | 'md' | 'lg'
}

const IconButton = ({
  children,
  active = false,
  size = 'md',
  className = '',
  ...props
}: Props) => {
  return (
    <button
      className={`
        flex items-center justify-center
        rounded-2xl
        transition-all duration-200
        active:scale-[0.96]

        ${
          active
            ? 'bg-blue-600 text-white'
            : 'border border-slate-200 bg-white hover:bg-slate-100'
        }

        ${
          size === 'sm'
            ? 'h-9 w-9'
            : size === 'lg'
            ? 'h-12 w-12'
            : 'h-11 w-11'
        }

        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default IconButton