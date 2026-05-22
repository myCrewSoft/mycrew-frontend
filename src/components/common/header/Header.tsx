// components/common/header/Header.tsx
import {
  Bell,
  Search,
  Mail,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'

import IconButton from '../button/IconButton'

const Header = () => {
  return (
    <header
      className="
        flex items-center justify-between
       w-full                   
        min-w-0                  
        border-b border-slate-100
        bg-white
        px-8 py-3
        h-16
      "
    >
      {/* LEFT: 통합 검색창 */}
      <div className="relative w-full max-w-md"> 
        <Search
          size={18}
          className="
            absolute left-4 top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />
        <input
          type="text"
          placeholder="통합 검색"
          className="
            h-10
            w-full
            rounded-xl
            border border-slate-200
            bg-slate-50
            pl-11 pr-4
            text-sm
            outline-none
            transition-all
            focus:border-blue-400
            focus:bg-white
          "
        />
      </div>

      {/* ⭐ 핵심: 왼쪽 검색창과 오른쪽 아이콘 사이의 남은 공간을 전부 채워주는 빈 박스입니다 */}
      <div className="flex-1" />

      {/* RIGHT: 아이콘들과 프로필 배치 */}
      <div className="flex items-center gap-4">
        {/* MAIL */}
        <div className="relative">
          <IconButton>
            <Mail size={20} className="text-slate-700" />
          </IconButton>
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
            12
          </span>
        </div>

        {/* MESSENGER */}
        <div className="relative">
          <IconButton>
            <MessageSquare size={20} className="text-slate-700" />
          </IconButton>
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
            7
          </span>
        </div>

        {/* NOTIFICATION */}
        <div className="relative">
          <IconButton>
            <Bell size={20} className="text-slate-700" />
          </IconButton>
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            5
          </span>
        </div>

        {/* 세로 구분선 */}
        <div className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* PROFILE */}
        <button className="flex items-center gap-3 rounded-xl p-1 transition-all hover:bg-slate-50">
          {/* AVATAR */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-xs font-bold text-white">
            BJ
          </div>

          {/* USER */}
          <div className="text-left hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              박비주
            </p>
            <p className="text-[11px] text-slate-400">
              FrontEnd Developer
            </p>
          </div>

          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  )
}

export default Header