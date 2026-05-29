import { X } from 'lucide-react'
import { useMemo } from 'react'
import EmployeeSearchPicker, {
  type EmployeeSearchItem,
} from '../../../common/employeeSearch/EmployeeSearchPicker'
import type { ChatMember } from './messenger.types'

interface MessengerCreateFormProps {
  roomName: string
  roomDescription: string
  memberSearch: string
  members: ChatMember[]
  selectedMemberIds: number[]
  onChangeRoomName: (value: string) => void
  onChangeRoomDescription: (value: string) => void
  onChangeMemberSearch: (value: string) => void
  onChangeSelectedMembers: (memberIds: number[]) => void
  onCreate: () => void
  onCancel: () => void
}

const MessengerCreateForm = ({
  roomName,
  roomDescription,
  memberSearch,
  members,
  selectedMemberIds,
  onChangeRoomName,
  onChangeRoomDescription,
  onChangeMemberSearch,
  onChangeSelectedMembers,
  onCreate,
  onCancel,
}: MessengerCreateFormProps) => {
  // 메신저의 ChatMember는 jobTitle이라는 이름을 쓰고,
  // 공통 사원 검색 컴포넌트는 position이라는 이름을 씁니다.
  // 여기서 한 번만 화면 공통 타입으로 바꿔주면 컴포넌트 재사용이 쉬워집니다.
  const employeeItems = useMemo<EmployeeSearchItem[]>(
    () =>
      members.map((member) => ({
        id: member.id,
        name: member.name,
        department: member.department,
        position: member.jobTitle,
      })),
    [members],
  )

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      {/* 새 대화 생성 화면의 상단 영역입니다. 닫기 버튼을 누르면 기존 채팅 화면으로 돌아갑니다. */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">새 대화</h3>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="새 대화 취소"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          {/* 채팅방 이름은 그룹 대화일 때 특히 중요합니다. 1:1 대화라면 백엔드에서 상대 이름으로 처리할 수도 있습니다. */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              채팅방 이름
            </span>
            <input
              value={roomName}
              onChange={(event) => onChangeRoomName(event.target.value)}
              placeholder="예: 신규 서비스 런칭 준비"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </label>

          {/* 채팅방 설명은 사용자가 직접 남기는 짧은 목적 설명입니다. */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">
              채팅방 설명
            </span>
            <textarea
              value={roomDescription}
              onChange={(event) => onChangeRoomDescription(event.target.value)}
              placeholder="예: 신규 서비스 런칭 일정과 자료를 공유하는 대화방"
              className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </label>

          <EmployeeSearchPicker
            variant="compact"
            employees={employeeItems}
            keyword={memberSearch}
            selectedEmployeeIds={selectedMemberIds}
            onKeywordChange={onChangeMemberSearch}
            onChange={(nextMemberIds) =>
              onChangeSelectedMembers(nextMemberIds.map(Number))
            }
          />
        </div>
      </div>

      <footer className="border-t border-slate-200 p-3">
        {/* 참여자가 1명 이상 선택되어야 채팅방 생성을 요청할 수 있습니다. */}
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
