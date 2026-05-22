export type ToastVariant = 'info' | 'success' | 'danger'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant

  /**
   * ms 단위
   * 기본값: 3000
   * 0이면 자동 종료 안 함
   */
  duration?: number
}