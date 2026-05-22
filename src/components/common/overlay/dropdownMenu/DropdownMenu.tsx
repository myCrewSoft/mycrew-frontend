import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import IconButton from '../../button/IconButton'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

interface DropdownMenuProps {
  label?: string
  items: DropdownMenuItem[]
}

const DropdownMenu = ({ label = '메뉴 열기', items }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex">
      <IconButton
        size="sm"
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal size={18} />
      </IconButton>

      {open && (
        <div className="absolute right-0 top-11 z-20 min-w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={`block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-slate-50 ${
                item.danger ? 'text-red-500' : 'text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default DropdownMenu
