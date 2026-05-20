// components/common/header/Header.tsx

import {
  Bell,
  Search,
  Settings,
  ChevronDown,
} from 'lucide-react'

import IconButton from '../button/IconButton'
import Button from '../button/Button'

const Header = () => {
  return (
    <header
      className="
        flex items-center justify-between

        border-b border-slate-200

        bg-white

        px-6 py-4
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-5">
        {/* LOGO */}
        <div
          className="
            flex items-center gap-3
          "
        >
          <div
            className="
              flex h-12 w-12 items-center justify-center

              rounded-2xl

              bg-gradient-to-r
              from-blue-600
              to-sky-400

              text-lg font-black text-white

              shadow-lg
              shadow-blue-200/50
            "
          >
            AI
          </div>

          <div>
            <p className="text-lg font-black text-slate-900">
              AI Groupware
            </p>

            <p className="text-xs text-slate-500">
              Smart Collaboration
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative ml-6">
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
            placeholder="검색어를 입력하세요"
            className="
              h-12
              w-[360px]

              rounded-2xl

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
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* QUICK BUTTON */}
        <Button size="md">
          메일 쓰기
        </Button>

        {/* NOTIFICATION */}
        <div className="relative">
          <IconButton>
            <Bell size={18} />
          </IconButton>

          <div
            className="
              absolute -right-1 -top-1

              flex h-5 min-w-5 items-center justify-center

              rounded-full

              bg-red-500

              px-1

              text-[10px]
              font-bold
              text-white
            "
          >
            5
          </div>
        </div>

        {/* SETTINGS */}
        <IconButton>
          <Settings size={18} />
        </IconButton>

        {/* PROFILE */}
        <button
          className="
            flex items-center gap-3

            rounded-2xl

            border border-slate-200

            bg-white

            px-3 py-2

            transition-all

            hover:bg-slate-50
          "
        >
          {/* AVATAR */}
          <div
            className="
              flex h-11 w-11 items-center justify-center

              rounded-2xl

              bg-gradient-to-r
              from-blue-600
              to-sky-400

              text-sm font-bold text-white
            "
          >
            BJ
          </div>

          {/* USER */}
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">
              박비주
            </p>

            <p className="text-xs text-slate-500">
              FrontEnd Developer
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-slate-400"
          />
        </button>
      </div>
    </header>
  )
}

export default Header