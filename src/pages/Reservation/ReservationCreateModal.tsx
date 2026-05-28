import { useMemo } from 'react'
import Button from '../../components/common/button/Button'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Modal from '../../components/common/overlay/modal/Modal'
import type { CreateReservationRequest, MeetingRoom } from '../../types/Reservation'

interface ReservationCreateModalProps {
  open: boolean
  rooms: MeetingRoom[]
  formValues: CreateReservationRequest
  loading: boolean
  onChange: (values: CreateReservationRequest) => void
  onClose: () => void
  onSubmit: (values: CreateReservationRequest) => void
}

const toDateTimeInputValue = (dateTime: string) => {
  return dateTime ? dateTime.slice(0, 16) : ''
}

const fromDateTimeInputValue = (dateTime: string) => {
  return dateTime ? `${dateTime}:00` : ''
}

const ReservationCreateModal = ({
  open,
  rooms,
  formValues,
  loading,
  onChange,
  onClose,
  onSubmit,
}: ReservationCreateModalProps) => {
  const selectedRoom = rooms.find((room) => room.roomId === formValues.roomId)

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        value: String(room.roomId),
        label: `${room.roomName} (${room.capacity}인)`,
      })),
    [rooms],
  )

  const validationMessage = useMemo(() => {
    if (rooms.length === 0) return '등록 가능한 회의실이 없습니다.'
    if (!formValues.roomId) return '회의실을 선택해주세요.'
    if (!formValues.title.trim()) return '예약 제목을 입력해주세요.'
    if (!formValues.startDateTime) return '시작 시간을 선택해주세요.'
    if (!formValues.endDateTime) return '종료 시간을 선택해주세요.'

    const start = new Date(formValues.startDateTime)
    const end = new Date(formValues.endDateTime)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '예약 시간을 다시 확인해주세요.'
    }

    if (start >= end) {
      return '종료 시간은 시작 시간보다 늦어야 합니다.'
    }

    return ''
  }, [formValues])

  const handleSubmit = () => {
    if (validationMessage) return

    const nextValues = {
      ...formValues,
      title: formValues.title.trim(),
    }

    onChange(nextValues)
    onSubmit(nextValues)
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
            {selectedRoom.floor} · {selectedRoom.roomName} · 최대{' '}
            {selectedRoom.capacity}인
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="시작 시간"
            type="datetime-local"
            value={toDateTimeInputValue(formValues.startDateTime)}
            onChange={(event) =>
              onChange({
                ...formValues,
                startDateTime: fromDateTimeInputValue(event.target.value),
              })
            }
          />

          <FormField
            label="종료 시간"
            type="datetime-local"
            value={toDateTimeInputValue(formValues.endDateTime)}
            onChange={(event) =>
              onChange({
                ...formValues,
                endDateTime: fromDateTimeInputValue(event.target.value),
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
