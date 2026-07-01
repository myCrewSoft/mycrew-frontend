import { useMemo } from 'react'
import Button from '../../components/common/button/Button'
import Checkbox from '../../components/common/form/checkbox/Checkbox'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Modal from '../../components/common/overlay/modal/Modal'
import type { ReservationCreateRequest, ReservationResponse, RoomResponse } from '../../types'

interface ReservationCreateModalProps {
  open: boolean
  rooms: RoomResponse[]
  reservations: ReservationResponse[]
  formValues: ReservationCreateRequest
  loading: boolean
  onChange: (values: ReservationCreateRequest) => void
  onClose: () => void
  onSubmit: (values: ReservationCreateRequest) => void
}

const toDateTimeInputValue = (dateTime: string) => {
  return dateTime ? dateTime.slice(0, 16) : ''
}

const toDateInputValue = (dateTime: string) => {
  return dateTime ? dateTime.slice(0, 10) : ''
}

const fromDateTimeInputValue = (dateTime: string) => {
  return dateTime ? `${dateTime}:00` : ''
}

const fromStartDateInputValue = (date: string) => {
  return date ? `${date}T00:00:00` : ''
}

const fromEndDateInputValue = (date: string) => {
  return date ? `${date}T23:59:00` : ''
}

const ReservationCreateModal = ({
  open,
  rooms,
  reservations,
  formValues,
  loading,
  onChange,
  onClose,
  onSubmit,
}: ReservationCreateModalProps) => {
  const selectedRoom = rooms.find((room) => room.roomId === formValues.roomId)
  const allDay = formValues.allDayYn === 'Y'

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        value: String(room.roomId),
        label: `${room.roomName}${room.ho ? ` (${room.ho})` : ''}`,
      })),
    [rooms],
  )

  const validationMessage = useMemo(() => {
    if (rooms.length === 0) return '등록 가능한 회의실이 없습니다.'
    if (!formValues.roomId) return '회의실을 선택해주세요.'
    if (!formValues.title.trim()) return '예약 제목을 입력해주세요.'
    if (!formValues.startDateTime) return allDay ? '시작일을 선택해주세요.' : '시작 시간을 선택해주세요.'
    if (!formValues.endDateTime) return allDay ? '종료일을 선택해주세요.' : '종료 시간을 선택해주세요.'

    const start = new Date(formValues.startDateTime)
    const end = new Date(formValues.endDateTime)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '예약 시간을 다시 확인해주세요.'
    }

    if (start >= end) {
      return allDay
        ? '종료일은 시작일보다 같거나 늦어야 합니다.'
        : '종료 시간은 시작 시간보다 늦어야 합니다.'
    }

    const hasConflict = reservations.some((r) => {
      if (r.roomId !== formValues.roomId) return false
      const existingStart = new Date(r.startDateTime)
      const existingEnd = new Date(r.endDateTime)
      return start < existingEnd && end > existingStart
    })

    if (hasConflict) {
      return '선택하신 시간대에 이미 예약이 있습니다. 다른 시간을 선택해주세요.'
    }

    return ''
  }, [allDay, formValues, reservations, rooms.length])

  const handleSubmit = () => {
    if (validationMessage) return

    const nextValues = {
      ...formValues,
      title: formValues.title.trim(),
    }

    onChange(nextValues)
    onSubmit(nextValues)
  }

  const handleToggleAllDay = () => {
    const nextAllDay = !allDay

    onChange({
      ...formValues,
      allDayYn: nextAllDay ? 'Y' : 'N',
      startDateTime: nextAllDay
        ? fromStartDateInputValue(toDateInputValue(formValues.startDateTime))
        : formValues.startDateTime,
      endDateTime: nextAllDay
        ? fromEndDateInputValue(toDateInputValue(formValues.endDateTime))
        : formValues.endDateTime,
    })
  }

  return (
    <Modal
      open={open}
      title="회의실 예약 등록"
      description="회의실과 시간을 선택한 뒤 예약 정보를 저장합니다."
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={Boolean(validationMessage)}
          >
            등록
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="회의실"
          value={String(formValues.roomId)}
          options={
            roomOptions.length > 0
              ? roomOptions
              : [{ value: '0', label: '등록된 회의실 없음' }]
          }
          disabled={roomOptions.length === 0}
          onChange={(event) =>
            onChange({
              ...formValues,
              roomId: Number(event.target.value),
            })
          }
        />

        {selectedRoom && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {selectedRoom.floor}층 · {selectedRoom.roomName}
            {selectedRoom.ho ? ` · ${selectedRoom.ho}` : ''}
          </div>
        )}

        <FormField
          label="예약 제목"
          value={formValues.title}
          placeholder="예: 주간 회의"
          onChange={(event) =>
            onChange({
              ...formValues,
              title: event.target.value,
            })
          }
        />

        <Checkbox label="종일" checked={allDay} onChange={handleToggleAllDay} />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={allDay ? '시작일' : '시작 시간'}
            type={allDay ? 'date' : 'datetime-local'}
            value={
              allDay
                ? toDateInputValue(formValues.startDateTime)
                : toDateTimeInputValue(formValues.startDateTime)
            }
            onChange={(event) => {
              const newStartDateTime = allDay
                ? fromStartDateInputValue(event.target.value)
                : fromDateTimeInputValue(event.target.value)
              const autoEnd =
                !allDay && !formValues.endDateTime && newStartDateTime
                  ? (() => {
                      const d = new Date(newStartDateTime)
                      d.setTime(d.getTime() + 60 * 60 * 1000)
                      const pad = (n: number) => String(n).padStart(2, '0')
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
                    })()
                  : formValues.endDateTime
              onChange({
                ...formValues,
                startDateTime: newStartDateTime,
                endDateTime: autoEnd,
              })
            }}
          />

          <FormField
            label={allDay ? '종료일' : '종료 시간'}
            type={allDay ? 'date' : 'datetime-local'}
            value={
              allDay
                ? toDateInputValue(formValues.endDateTime)
                : toDateTimeInputValue(formValues.endDateTime)
            }
            onChange={(event) =>
              onChange({
                ...formValues,
                endDateTime: allDay
                  ? fromEndDateInputValue(event.target.value)
                  : fromDateTimeInputValue(event.target.value),
              })
            }
          />
        </div>

        {validationMessage && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {validationMessage}
          </p>
        )}
      </div>
    </Modal>
  )
}

export default ReservationCreateModal
