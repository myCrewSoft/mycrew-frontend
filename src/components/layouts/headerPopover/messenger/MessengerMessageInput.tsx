import { AtSign, Send, Smile } from 'lucide-react'

interface MessengerMessageInputProps {
  value: string
  onChange: (value: string) => void
}

const MessengerMessageInput = ({ value, onChange }: MessengerMessageInputProps) => {
  return (
    <footer className="border-t border-slate-200 p-3">
      {/* 입력창, 보조 아이콘, 전송 버튼을 하나의 둥근 박스 안에 배치합니다. */}
      <div className="flex min-h-[128px] flex-col rounded-2xl border border-slate-300 bg-white p-4 focus-within:border-blue-400">
        <textarea
          value={value}
          // 입력할 때마다 부모 컴포넌트의 messageText 상태를 최신 입력값으로 바꿉니다.
          onChange={(event) => onChange(event.target.value)}
          placeholder="메시지 입력"
          className="min-h-8 flex-1 resize-none border-none bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-500"
        />

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-center gap-3">
            {/* 이모지/멘션은 아직 기능 연결 전이며, UI 위치를 먼저 잡아둔 상태입니다. */}
            <button
              type="button"
              className="text-slate-700 transition-colors hover:text-blue-600"
              aria-label="이모지"
            >
              <Smile size={22} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="text-slate-700 transition-colors hover:text-blue-600"
              aria-label="멘션"
            >
              <AtSign size={22} strokeWidth={2.2} />
            </button>
          </div>

          <button
            type="button"
            aria-label="메시지 전송"
            // 공백만 입력한 경우에는 전송 버튼을 비활성화합니다.
            disabled={value.trim().length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <Send size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default MessengerMessageInput
