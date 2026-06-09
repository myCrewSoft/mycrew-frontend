import { ArrowLeft, Edit3, LogOut, Save, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import EmployeeSearchPicker from '../../../common/employeeSearch/EmployeeSearchPicker'
import type { EmployeeSearchItem } from '../../../common/employeeSearch/EmployeeSearchPicker'
import type { ChatParticipant, ChatRoom } from './messenger.types'
import {
  getDirectRoomMeta,
  getProfileImageUrlByFileId,
  isDirectChatRoom,
  isWorkChatRoom,
} from './messenger.utils'

interface MessengerRoomInfoPanelProps {
  room: ChatRoom
  onBack: () => void
  onUpdateRoom: (payload: {
    chatName: string
    chatDescription: string
  }) => void
  onAddParticipants: (participantIds: number[]) => void
  onRemoveParticipants: (participantIds: number[]) => void
  onLeaveRoom: () => void
}

const toNumberIds = (employeeIds: Array<string | number>) =>
  employeeIds.map(Number).filter((employeeId) => Number.isFinite(employeeId))

const getParticipantId = (participant: ChatParticipant) => participant.empId

const getParticipantName = (participant: ChatParticipant) => participant.empNm

const getParticipantPosition = (participant: ChatParticipant) =>
  participant.jobPstnNm || '-'

const getParticipantDepartment = (participant: ChatParticipant) =>
  participant.deptNm || '-'

const getParticipantProfileImageUrl = (participant: ChatParticipant) =>
  getProfileImageUrlByFileId(participant.prflImgFileId)

const getParticipantInitial = (participant: ChatParticipant) =>
  getParticipantName(participant).trim().charAt(0) || '?'

const toEmployeeSearchItem = (
  participant: ChatParticipant,
): EmployeeSearchItem => ({
  id: getParticipantId(participant),
  name: getParticipantName(participant),
  department: getParticipantDepartment(participant),
  position: getParticipantPosition(participant),
  profileImageUrl: getParticipantProfileImageUrl(participant),
})

const MessengerRoomInfoPanel = ({
  room,
  onBack,
  onUpdateRoom,
  onAddParticipants,
  onRemoveParticipants,
  onLeaveRoom,
}: MessengerRoomInfoPanelProps) => {
  const [editMode, setEditMode] = useState(false)
  const [roomName, setRoomName] = useState(room.name)
  const [roomDescription, setRoomDescription] = useState(room.description)
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>(
    [],
  )

  const editableRoomInfo = !isDirectChatRoom(room) && !isWorkChatRoom(room)
  const canManageParticipants = !isDirectChatRoom(room) && !isWorkChatRoom(room)
  const canLeaveRoom = !isWorkChatRoom(room)
  const participants = room.participants ?? []
  const participantItems = useMemo(
    () => participants.map(toEmployeeSearchItem),
    [participants],
  )
  const originalParticipantIds = useMemo(
    () => participants.map(getParticipantId).filter((id) => id > 0),
    [participants],
  )

  useEffect(() => {
    // 다른 채팅방 정보로 이동하면 보기 모드와 입력값을 새 방 기준으로 초기화합니다.
    setEditMode(false)
    setRoomName(room.name)
    setRoomDescription(room.description)
    setSelectedParticipantIds(originalParticipantIds)
  }, [originalParticipantIds, room])

  const handleCancelEdit = () => {
    setEditMode(false)
    setRoomName(room.name)
    setRoomDescription(room.description)
    setSelectedParticipantIds(originalParticipantIds)
  }

  const handleSave = () => {
    const nextParticipantIdSet = new Set(selectedParticipantIds)
    const originalParticipantIdSet = new Set(originalParticipantIds)
    const addedParticipantIds = selectedParticipantIds.filter(
      (participantId) => !originalParticipantIdSet.has(participantId),
    )
    const removedParticipantIds = originalParticipantIds.filter(
      (participantId) => !nextParticipantIdSet.has(participantId),
    )

    if (editableRoomInfo) {
      onUpdateRoom({
        chatName: roomName.trim(),
        chatDescription: roomDescription.trim(),
      })
    }

    if (canManageParticipants && addedParticipantIds.length > 0) {
      onAddParticipants(addedParticipantIds)
    }

    if (canManageParticipants && removedParticipantIds.length > 0) {
      onRemoveParticipants(removedParticipantIds)
    }

    setEditMode(false)
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="채팅방으로 돌아가기"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {room.name}
            </h3>
            <p className="truncate text-[11px] text-slate-400">
              {editMode ? '채팅방 정보 수정' : '채팅방 정보'}
            </p>
          </div>
        </div>

        {editMode ? (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="수정 취소"
          >
            <X size={17} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            disabled={!editableRoomInfo && !canManageParticipants}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <Edit3 size={14} />
            수정
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {editMode ? (
          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  대화방 이름
                </span>
                <input
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  disabled={!editableRoomInfo}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-700">
                  대화방 설명
                </span>
                <textarea
                  value={roomDescription}
                  onChange={(event) => setRoomDescription(event.target.value)}
                  disabled={!editableRoomInfo}
                  className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none placeholder:text-slate-400 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </label>
            </section>

            <section className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-bold text-slate-700">
                참여자 관리
              </p>
              <EmployeeSearchPicker
                variant="compact"
                remoteSearch
                showAllOnEmpty
                selectedEmployeeIds={selectedParticipantIds}
                selectedEmployeeItems={participantItems}
                onChange={(nextEmployeeIds) =>
                  setSelectedParticipantIds(toNumberIds(nextEmployeeIds))
                }
              />
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <section className="rounded-lg border border-slate-200 p-4">
              {/* 정보 확인 모드에서는 백엔드 단건 조회로 받은 방 이름과 내용을 읽기 전용으로 보여줍니다. */}
              <div>
                <p className="text-[11px] font-bold text-slate-400">
                  채팅방 이름
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {room.name}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-bold text-slate-400">내용</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                  {isDirectChatRoom(room)
                    ? getDirectRoomMeta(room)
                    : room.description}
                </p>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">참여자</p>
                <span className="text-xs text-slate-400">
                  {participants.length}명
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {participants.map((participant) => (
                  <div
                    key={getParticipantId(participant)}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-blue-100">
                      {getParticipantProfileImageUrl(participant) ? (
                        <img
                          src={getParticipantProfileImageUrl(participant) ?? ''}
                          alt={`${getParticipantName(participant)} 프로필`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-blue-600">
                          {getParticipantInitial(participant)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {getParticipantName(participant)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {getParticipantPosition(participant)} ·{' '}
                        {getParticipantDepartment(participant)}
                      </p>
                    </div>
                  </div>
                ))}

                {participants.length === 0 && (
                  <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-400">
                    참여자 정보가 없습니다.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 p-3">
        {editMode ? (
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            <Save size={16} />
            저장
          </button>
        ) : (
          <button
            type="button"
            onClick={onLeaveRoom}
            disabled={!canLeaveRoom}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <LogOut size={16} />
            채팅방 나가기
          </button>
        )}
      </footer>
    </section>
  )
}

export default MessengerRoomInfoPanel
