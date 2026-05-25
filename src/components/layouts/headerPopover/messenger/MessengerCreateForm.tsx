import { X } from 'lucide-react'
import type { ChatMember } from './messenger.types'

interface MessengerCreateFormProps {
  roomName: string
  roomDescription: string
  memberSearch: string
  members: ChatMember[]
  selectedMembers: ChatMember[]
  selectedMemberIds: number[]
  onChangeRoomName: (value: string) => void
  onChangeRoomDescription: (value: string) => void
  onChangeMemberSearch: (value: string) => void
  onToggleMember: (memberId: number) => void
  onCreate: () => void
  onCancel: () => void
}

const MessengerCreateForm = ({
  roomName,
  roomDescription,
  memberSearch,
  members,
  selectedMembers,
  selectedMemberIds,
  onChangeRoomName,
  onChangeRoomDescription,
  onChangeMemberSearch,
  onToggleMember,
  onCreate,
  onCancel,
}: MessengerCreateFormProps) => {
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

          {/* 참여자 검색어는 부모 상태로 관리합니다. 나중에 API 검색으로 바꿀 때 이 값으로 searchMembers를 호출하면 됩니다. */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              참여자 검색
            </label>
            <input
              value={memberSearch}
              onChange={(event) => onChangeMemberSearch(event.target.value)}
              placeholder="이름, 부서, 직급으로 검색"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700">참여자</p>
              <span className="text-[11px] text-slate-400">
                {selectedMembers.length}명 선택
              </span>
            </div>

            {/* 선택된 참여자는 칩 형태로 먼저 보여줍니다. 칩을 누르면 선택 해제됩니다. */}
            {selectedMembers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onToggleMember(member.id)}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600"
                  >
                    {member.name}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* 검색 결과 목록입니다. 구성원을 누르면 선택/해제가 토글됩니다. */}
            <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200">
              {members.map((member) => {
                const selected = selectedMemberIds.includes(member.id)

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onToggleMember(member.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                      selected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {member.jobTitle} · {member.department}
                      </span>
                    </span>

                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 p-3">
        {/* 참여자가 1명 이상 선택되어야 채팅방 생성을 요청할 수 있습니다. */}
        <button
          type="button"
          onClick={onCreate}
          disabled={selectedMembers.length === 0}
          className="h-10 w-full rounded-lg bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          대화 시작
        </button>
      </footer>
    </section>
  )
}

export default MessengerCreateForm
