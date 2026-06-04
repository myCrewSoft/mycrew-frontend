import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import ToastViewport from './ToastViewport'
import type { ToastItem, ToastOptions } from './toast.types'

interface ToastContextValue {
  showToast: (options: ToastOptions) => void
  closeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

interface ToastProviderProps {
  children: ReactNode
}

const createToastId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [items, setItems] = useState<ToastItem[]>([])
  const timerMapRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const closeToast = useCallback((id: string) => {
    const timer = timerMapRef.current[id]

    if (timer) {
      clearTimeout(timer)
      delete timerMapRef.current[id]
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    Object.values(timerMapRef.current).forEach(clearTimeout)
    timerMapRef.current = {}
    setItems([])
  }, [])

  const showToast = useCallback(
    ({ title, description, variant = 'info', duration = 3000 }: ToastOptions) => {
      const id = createToastId()

      const newToast: ToastItem = {
        id,
        title,
        description,
        variant,
      }

      setItems((prev) => [...prev, newToast])

      if (duration > 0) {
        timerMapRef.current[id] = setTimeout(() => {
          closeToast(id)
        }, duration)
      }
    },
    [closeToast],
  )

  useEffect(() => {
    return () => {
      Object.values(timerMapRef.current).forEach(clearTimeout)
    }
  }, [])

  const value = useMemo(
    () => ({
      showToast,
      closeToast,
      clearToasts,
    }),
    [showToast, closeToast, clearToasts],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onClose={closeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다.')
  }

  return context
}