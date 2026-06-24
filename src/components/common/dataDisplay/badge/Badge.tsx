import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant =
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'violet'
  | 'neutral'
  | 'outline'

export type BadgeSize = 'sm' | 'md' | 'count'
export type BadgeShape = 'pill' | 'rounded'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  shape?: BadgeShape
  leftIcon?: ReactNode
  iconClassName?: string
}

const variantStyle: Record<BadgeVariant, string> = {
  primary: 'bg-blue-600 text-white',
  danger: 'bg-red-500 text-white',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-cyan-100 text-cyan-700',
  violet: 'bg-violet-100 text-violet-700',
  neutral: 'bg-slate-100 text-slate-600',
  outline: 'border border-slate-200 bg-white text-slate-600',
}

const sizeStyle: Record<BadgeSize, string> = {
  sm: 'h-6 px-2 text-xs',
  md: 'h-7 px-2.5 text-sm',
  count: 'h-4 min-w-4 px-1 text-[9px]',
}

const shapeStyle: Record<BadgeShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-lg',
}

const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  shape = 'pill',
  leftIcon,
  iconClassName = '',
  className = '',
  ...props
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold ${leftIcon ? 'gap-1.5' : ''} ${variantStyle[variant]} ${sizeStyle[size]} ${shapeStyle[shape]} ${className}`}
      {...props}
    >
      {leftIcon ? (
        <span className={`inline-flex shrink-0 items-center justify-center ${iconClassName}`}>
          {leftIcon}
        </span>
      ) : null}
      {children}
    </span>
  )
}

export default Badge
