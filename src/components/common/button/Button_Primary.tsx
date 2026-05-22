// components/common/button/Button.tsx

import { Loader2 } from 'lucide-react'
import { buttonVariantStyle, buttonSizeStyle } from './button.styles'
import type { ButtonProps } from './button.types'

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
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold
        rounded-2xl
        transition-all duration-200
        active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-50
        ${buttonVariantStyle[variant]}
        ${buttonSizeStyle[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

export default Button