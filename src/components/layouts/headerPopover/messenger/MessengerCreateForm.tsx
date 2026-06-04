import { X } from 'lucide-react'
import EmployeeSearchPicker from '../../../common/employeeSearch/EmployeeSearchPicker'

interface MessengerCreateFormProps {
  roomName: string
  roomDescription: string
  selectedMemberIds: number[]
  onChangeRoomName: (value: string) => void
  onChangeRoomDescription: (value: string) => void
  onChangeSelectedMembers: (memberIds: number[]) => void
  onCreate: () => void
  onCancel: () => void
}

const MessengerCreateForm = ({
  roomName,
  roomDescription,
  selectedMemberIds,
  onChangeRoomName,
  onChangeRoomDescription,
  onChangeSelectedMembers,
  onCreate,
  onCancel,
}: MessengerCreateFormProps) => {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">대화방 생성</h3>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="대화방 생성 취소"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              채팅방 이름
            </span>
            <input
              value={roomName}
              onChange={(event) => onChangeRoomName(event.target.value)}
              placeholder="예: 신규 서비스 일정 공유"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              채팅방 설명
            </span>
            <textarea
              value={roomDescription}
              onChange={(event) => onChangeRoomDescription(event.target.value)}
              placeholder="채팅방 목적을 입력하세요."
              className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </label>

          {/* 참여자 검색은 공통 사원 검색 API를 사용하므로 별도 메신저 mapper가 필요 없습니다. */}
          <EmployeeSearchPicker
            variant="compact"
            remoteSearch
            showAllOnEmpty
            selectedEmployeeIds={selectedMemberIds}
            onChange={(nextMemberIds) =>
              onChangeSelectedMembers(nextMemberIds.map(Number))
            }
          />
        </div>
      </div>

      <footer className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={selectedMemberIds.length === 0}
          className="h-10 w-full rounded-lg bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          대화 시작
        </button>
      </footer>
    </section>
  )
}

export default MessengerCreateForm
