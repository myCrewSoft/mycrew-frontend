import { Bell, ChevronDown, Mail, MessageSquare, Search } from 'lucide-react'
import IconButton from '../button/IconButton'

const Header = () => {
  return (
    <header className="flex h-16 w-full min-w-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-3">
      <div className="relative w-full max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="통합 검색"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white"
        />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <div className="relative">
          <IconButton aria-label="메일">
            <Mail size={20} className="text-slate-700" />
          </IconButton>
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
            12
          </span>
        </div>

        <div className="relative">
          <IconButton aria-label="메신저">
            <MessageSquare size={20} className="text-slate-700" />
          </IconButton>
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
            7
          </span>
        </div>

        <div className="relative">
          <IconButton aria-label="알림">
            <Bell size={20} className="text-slate-700" />
          </IconButton>
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            5
          </span>
        </div>

        <div className="mx-1 h-5 w-[1px] bg-slate-200" />

        <button
          className="flex items-center gap-3 rounded-xl p-1 transition-all hover:bg-slate-50"
          type="button"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-xs font-bold text-white">
            BJ
          </div>

          <div className="hidden text-left md:block">
            <p className="text-sm font-bold leading-tight text-slate-800">
              박범준
            </p>
            <p className="text-[11px] text-slate-400">FrontEnd Developer</p>
          </div>

          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  )
}

export default Header
