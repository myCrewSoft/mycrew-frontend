import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ProfileStatus = 'online' | 'away' | 'busy' | 'offline'

interface StatusOption {
  value: ProfileStatus
  label: string
  dotClassName: string
}

const statusOptions: StatusOption[] = [
  { value: 'online', label: '온라인', dotClassName: 'bg-emerald-500' },
  { value: 'away', label: '자리 비움', dotClassName: 'bg-amber-500' },
  { value: 'busy', label: '다른 업무 중', dotClassName: 'bg-red-500' },
  { value: 'offline', label: '오프라인', dotClassName: 'bg-slate-300' },
]

const profileMeta = 'FrontEnd Developer · 개발팀'

const HeaderProfileStatusMenu = () => {
  // open은 프로필 상태 변경 드롭다운이 열려 있는지 저장합니다.
  const [open, setOpen] = useState(false)

  // status는 현재 선택된 내 상태입니다. 실제 백엔드 연동 전까지는 화면 상태만 바꿉니다.
  const [status, setStatus] = useState<ProfileStatus>('online')

  // menuRef는 드롭다운 바깥 클릭을 감지하기 위해 전체 영역을 가리킵니다.
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedStatus =
    statusOptions.find((option) => option.value === status) ?? statusOptions[0]

  useEffect(() => {
    if (!open) return

    // 프로필 메뉴 바깥을 클릭하면 드롭다운을 닫습니다.
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    // ESC 키를 누르면 드롭다운을 닫습니다.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        className="flex items-center gap-3 rounded-xl p-1 transition-all hover:bg-slate-50"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="relative h-9 w-9 rounded-xl bg-blue-100">
          {/* 실제 프로필 사진 URL이 생기면 src만 백엔드 이미지 경로로 교체하면 됩니다. */}
          <img
            src="/favicon.svg"
            alt="박범준 프로필"
            className="h-full w-full rounded-xl object-cover"
          />

          {/* 프로필 아이콘 오른쪽 아래에 현재 상태를 작은 점으로 표시합니다. */}
          <span
            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-white shadow-sm ${selectedStatus.dotClassName}`}
          />
        </div>

        <div className="hidden text-left md:block">
          <p className="text-sm font-bold leading-tight text-slate-800">
            박범준
          </p>
          <p className="text-[11px] text-slate-400">{profileMeta}</p>
        </div>

        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <section
          className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          aria-label="프로필 상태 변경"
        >
          <p className="px-1 pb-2 text-[11px] font-semibold text-slate-500">
            상태 변경
          </p>

          <div className="flex flex-col gap-1">
            {statusOptions.map((option) => {
              const selected = option.value === status

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatus(option.value)
                    setOpen(false)
                  }}
                  className="flex h-8 items-center justify-between rounded-lg px-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  role="menuitem"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${option.dotClassName}`}
                    />
                    {option.label}
                  </span>

                  {selected && <Check size={16} className="text-green-600" />}
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default HeaderProfileStatusMenu
