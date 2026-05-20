import type{ ButtonSize, ButtonVariant } from './button.types'

export const buttonVariantStyle: Record<
  ButtonVariant,
  string
> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover',

  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200',

  outline:
    'border border-border bg-white hover:bg-slate-50',

  danger:
    'bg-red-500 text-white hover:bg-red-600',

  success:
    'bg-emerald-500 text-white hover:bg-emerald-600',

  ghost:
    'bg-transparent hover:bg-slate-100',
}

export const buttonSizeStyle: Record<
  ButtonSize,
  string
> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  xl: 'h-14 px-6 text-base',
}