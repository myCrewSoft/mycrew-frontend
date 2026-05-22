import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface SubSidebarActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'soft'
}

const SubSidebarActionButton = ({
  children,
  variant = 'soft',
  className = '',
  type = 'button',
  ...props
}: SubSidebarActionButtonProps) => {
  return (
    <button
      type={type}
      className={`flex h-12 w-full items-center justify-center rounded-2xl px-4 text-[15px] font-bold transition-colors ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-blue-600 to-sky-400 text-white shadow-lg shadow-blue-200/50 hover:from-blue-700 hover:to-sky-500'
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default SubSidebarActionButton
