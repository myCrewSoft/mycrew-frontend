import { useEffect, useRef, useState, type ReactNode } from 'react'

interface HeaderPopoverRenderProps {
  open: boolean
  toggle: () => void
  close: () => void
}

interface HeaderPopoverProps {
  title: string
  // trigger는 팝오버를 여는 버튼 영역입니다. open, toggle, close를 넘겨서 버튼 상태를 제어할 수 있게 합니다.
  trigger: (props: HeaderPopoverRenderProps) => ReactNode
  // children에는 메일 목록, 메신저 목록, 알림 목록처럼 팝오버마다 다른 본문 UI를 넣습니다.
  children?: ReactNode
  // footer는 "전체 보기"처럼 하단에 고정해서 보여줄 액션이 있을 때 사용합니다.
  footer?: ReactNode
  className?: string
  // 제목 오른쪽 버튼
  headerAction?: ReactNode
  onClose?: () => void
}

const HeaderPopover = ({
  title,
  trigger,
  children,
  footer,
  className = '',
  headerAction,
  onClose,
}: HeaderPopoverProps) => {
  // open은 팝오버가 현재 열려 있는지 저장하는 상태입니다.
  const [open, setOpen] = useState(false)

  // popoverRef는 바깥 클릭을 구분하기 위해 전체 팝오버 영역을 가리킵니다.
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = () => {
    setOpen(false)
    onClose?.()
  }
  const toggle = () => {
    if (open) {
      close()
      return
    }

    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    // 팝오버 영역 밖을 클릭하면 닫습니다.
    const handlePointerDown = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        close()
      }
    }

    // 사용자가 ESC 키를 누르면 닫습니다.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    // 컴포넌트가 사라지거나 open 값이 바뀔 때 이벤트를 정리해서 중복 등록을 막습니다.
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={popoverRef} className="relative inline-flex">
      {/* trigger를 함수로 받은 이유는 열림 상태에 따라 아이콘 버튼 색상 등을 바꿀 수 있게 하기 위해서입니다. */}
      {trigger({ open, toggle, close })}

      {open && children && (
        <section
          className={`absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${className}`}
          aria-label={title}
        >
          <div className="flex h-10 items-center justify-between border-b border-slate-200 px-4">
            <h2 className="text-[15px] font-bold text-slate-950">{title}</h2>
            {headerAction}
          </div>

          {/* children 영역은 팝오버마다 자유롭게 다른 UI를 넣는 자리입니다. */}
          <div className="max-h-[420px] overflow-y-auto">{children}</div>

          {footer && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center">
              {footer}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default HeaderPopover
