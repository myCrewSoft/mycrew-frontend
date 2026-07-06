import type { ButtonSize, ButtonVariant } from './button.types'

export const buttonVariantStyle: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-sky-400 text-white shadow-lg shadow-blue-200/50',
  secondary:
    'bg-gradient-to-r from-slate-500 to-slate-300 text-white shadow-lg shadow-slate-200/50',
  outline:
    'border border-slate-200 bg-gradient-to-r from-white to-slate-50 text-slate-700 shadow-sm',
  danger:
    'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-lg shadow-red-200/50',
  success:
    'bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-200/50',
  ghost:
    'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 hover:from-slate-200 hover:to-slate-100',
}

export const buttonSizeStyle: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-2xl',
  lg: 'h-14 px-8 text-base rounded-full',
  xl: 'h-16 px-10 text-lg rounded-full',
  icon: 'h-8 w-8 p-0 rounded-full',
}
