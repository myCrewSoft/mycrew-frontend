import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import Button from '../../components/common/button/Button'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Modal from '../../components/common/overlay/modal/Modal'
import type { MeetingRoom } from '../../types/Reservation'

type RoomManagementRoom = MeetingRoom & {
  confRmColor?: string
  useYn?: string
  status?: string
}

type RoomFormValues = {
  roomName: string
  capacity: string
  floor: string
  confRmColor: string
  useYn: string
}

type FormMode = 'create' | 'edit'

interface RoomManagementModalProps {
  open: boolean
  rooms: RoomManagementRoom[]
  onClose: () => void
}

const demoRooms: RoomManagementRoom[] = [
  {
    roomId: 9001,
    roomName: '한라',
    floor: '3F',
    capacity: 8,
    confRmColor: '#3B82F6',
    useYn: 'Y',
  },
  {
    roomId: 9002,
    roomName: '백두',
    floor: '3F',
    capacity: 12,
    confRmColor: '#10B981',
    useYn: 'N',
  },
  {
    roomId: 9003,
    roomName: '설악',
    floor: '4F',
    capacity: 4,
    confRmColor: '#D97706',
    useYn: 'Y',
  },
]

const emptyFormValues: RoomFormValues = {
  roomName: '',
  capacity: '',
  floor: '',
  confRmColor: '#3B82F6',
  useYn: 'Y',
}

const statusOptions = [
  { value: 'Y', label: '운영중' },
  { value: 'N', label: '점검중' },
]

const colorOptions = [
  { value: '#3B82F6', label: '파랑' },
  { value: '#10B981', label: '초록' },
  { value: '#D97706', label: '주황' },
  { value: '#8B5CF6', label: '보라' },
  { value: '#64748B', label: '회색' },
]

const getRoomColor = (room: RoomManagementRoom) => {
  return room.confRmColor || '#3B82F6'
}

const getRoomStatus = (room: RoomManagementRoom) => {
  if (room.useYn === 'N' || room.status === 'STOPPED') {
    return {
      label: '점검중',
      className: 'bg-red-50 text-red-600',
      actionLabel: '재개',
      nextUseYn: 'Y',
      actionClassName: 'border-green-200 text-green-700 hover:bg-green-50',
    }
  }

  return {
    label: '운영중',
    className: 'bg-green-100 text-green-700',
    actionLabel: '중단',
    nextUseYn: 'N',
    actionClassName: 'border-red-200 text-red-600 hover:bg-red-50',
  }
}

const toFormValues = (room: RoomManagementRoom): RoomFormValues => ({
  roomName: room.roomName,
  capacity: String(room.capacity),
  floor: room.floor,
  confRmColor: getRoomColor(room),
  useYn: room.useYn === 'N' ? 'N' : 'Y',
})

const RoomManagementModal = ({
  open,
  rooms,
  onClose,
}: RoomManagementModalProps) => {
  const [managedRooms, setManagedRooms] = useState<RoomManagementRoom[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<RoomFormValues>(emptyFormValues)

  useEffect(() => {
    if (!open) return

    setManagedRooms(rooms.length > 0 ? rooms : demoRooms)
    setFormOpen(false)
    setFormMode('create')
    setEditingRoomId(null)
    setFormValues(emptyFormValues)
  }, [open, rooms])

  const formTitle = formMode === 'create' ? '회의실 추가' : '회의실 수정'

  const formValid = useMemo(
    () =>
      Boolean(
        formValues.roomName.trim() &&
          formValues.capacity.trim() &&
          Number(formValues.capacity) > 0 &&
          formValues.floor.trim(),
      ),
    [formValues],
  )

  const openCreateForm = () => {
    setFormOpen(true)
    setFormMode('create')
    setEditingRoomId(null)
    setFormValues(emptyFormValues)
  }

  const openEditForm = (room: RoomManagementRoom) => {
    setFormOpen(true)
    setFormMode('edit')
    setEditingRoomId(room.roomId)
    setFormValues(toFormValues(room))
  }

  const closeForm = () => {
    setFormOpen(false)
    setFormMode('create')
    setEditingRoomId(null)
    setFormValues(emptyFormValues)
  }

  const saveRoom = () => {
    if (!formValid) return

    const nextRoom: RoomManagementRoom = {
      roomId: editingRoomId ?? Date.now(),
      roomName: formValues.roomName.trim(),
      capacity: Number(formValues.capacity),
      floor: formValues.floor.trim(),
      confRmColor: formValues.confRmColor,
      useYn: formValues.useYn,
    }

    setManagedRooms((current) =>
      formMode === 'edit'
        ? current.map((room) =>
            room.roomId === editingRoomId ? { ...room, ...nextRoom } : room,
          )
        : [...current, nextRoom],
    )
    closeForm()
  }

  const deleteRoom = (roomId: number) => {
    const confirmed = window.confirm('회의실을 삭제하시겠습니까?')
    if (!confirmed) return

    setManagedRooms((current) =>
      current.filter((room) => room.roomId !== roomId),
    )
    if (editingRoomId === roomId) {
      closeForm()
    }
  }

  const toggleRoomStatus = (room: RoomManagementRoom) => {
    const status = getRoomStatus(room)

    setManagedRooms((current) =>
      current.map((item) =>
        item.roomId === room.roomId
          ? { ...item, useYn: status.nextUseYn }
          : item,
      ),
    )
  }

  return (
    <Modal
      open={open}
      title="회의실 관리"
      onClose={onClose}
      size="md"
      footer={null}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={openCreateForm}
          >
            회의실 추가
          </Button>
        </div>

        {formOpen && (
          <section className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">{formTitle}</h3>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                aria-label="폼 닫기"
                onClick={closeForm}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                label="회의실명"
                value={formValues.roomName}
                placeholder="예: 한라"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    roomName: event.target.value,
                  }))
                }
              />
              <FormField
                label="인원"
                type="number"
                min={1}
                value={formValues.capacity}
                placeholder="예: 8"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    capacity: event.target.value,
                  }))
                }
              />
              <FormField
                label="층"
                value={formValues.floor}
                placeholder="예: 3F"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    floor: event.target.value,
                  }))
                }
              />
              <Select
                label="상태"
                value={formValues.useYn}
                options={statusOptions}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    useYn: event.target.value,
                  }))
                }
              />
              <Select
                label="색상"
                value={formValues.confRmColor}
                options={colorOptions}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    confRmColor: event.target.value,
                  }))
                }
              />
              <div className="flex items-end justify-end gap-2">
                <Button variant="outline" size="sm" onClick={closeForm}>
                  취소
                </Button>
                <Button size="sm" disabled={!formValid} onClick={saveRoom}>
                  저장
                </Button>
              </div>
            </div>
          </section>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[620px] table-fixed text-sm">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">회의실명</th>
                <th className="px-3 py-3 text-left">인원</th>
                <th className="px-3 py-3 text-left">층</th>
                <th className="px-3 py-3 text-left">상태</th>
                <th className="px-3 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {managedRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-sm font-semibold text-slate-400"
                  >
                    등록된 회의실이 없습니다.
                  </td>
                </tr>
              ) : (
                managedRooms.map((room) => {
                  const status = getRoomStatus(room)

                  return (
                    <tr key={room.roomId} className="bg-white">
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{ backgroundColor: getRoomColor(room) }}
                          />
                          <span className="truncate font-semibold text-slate-800">
                            {room.roomName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {room.capacity}인
                      </td>
                      <td className="px-3 py-3 text-slate-700">{room.floor}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex h-7 min-w-16 items-center justify-center rounded-md px-2 text-xs font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => openEditForm(room)}
                          >
                            <Pencil size={12} />
                            수정
                          </button>
                          <button
                            type="button"
                            className={`h-8 rounded-md border px-2 text-xs font-bold ${status.actionClassName}`}
                            onClick={() => toggleRoomStatus(room)}
                          >
                            {status.actionLabel}
                          </button>
                          <button
                            type="button"
                            className="flex h-8 items-center gap-1 rounded-md border border-red-200 px-2 text-xs font-bold text-red-600 hover:bg-red-50"
                            onClick={() => deleteRoom(room.roomId)}
                          >
                            <Trash2 size={12} />
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}

export default RoomManagementModal
