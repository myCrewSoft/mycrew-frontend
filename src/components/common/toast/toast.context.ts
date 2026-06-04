import { createContext } from 'react'
import type { ToastOptions } from './toast.types'

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void
  closeToast: (id: string) => void
  clearToasts: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
