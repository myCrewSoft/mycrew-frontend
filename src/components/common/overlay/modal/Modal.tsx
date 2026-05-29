import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import Button from '../../button/Button'
import IconButton from '../../button/IconButton'

interface ModalProps {
  open: boolean
  title?: ReactNode
  description?: string
  children?: ReactNode
  footer?: ReactNode
  onClose: () => void
  variant?: 'default' | 'confirm' | 'danger'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  maxWidthClassName?: string
}

const Modal = ({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  variant = 'default',
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  maxWidthClassName = 'max-w-lg',
}: ModalProps) => {
  if (!open) {
    return null
  }

  const resolvedFooter =
    footer ??
    (variant !== 'default' ? (
      <>
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </>
    ) : null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <section
        className={`w-full ${maxWidthClassName} rounded-xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <IconButton size="sm" aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>

        {children && <div className="p-5">{children}</div>}

        {resolvedFooter && (
          <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
            {resolvedFooter}
          </div>
        )}
      </section>
    </div>
  )
}

export default Modal
