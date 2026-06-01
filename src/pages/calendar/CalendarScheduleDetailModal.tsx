import { Clock, FileText, Trash2, Users } from 'lucide-react'
import { ApiError } from '../../api/axiosInstance'
import { scheduleApi } from '../../api/scheduleApi'
import Button from '../../components/common/button/Button'
import Modal from '../../components/common/overlay/modal/Modal'
import { useToast } from '../../components/common/toast/ToastProvider'
import { useApi } from '../../hooks/useApi'
import type { CalendarEventItem, ScheduleTypeCode } from '../../types/calendar'
import { useCalendar } from './CalendarContext'

interface CalendarScheduleDetailModalProps {
  open: boolean
  schedule: CalendarEventItem | null
  onClose: () => void
  onEdit: (schedule: CalendarEventItem) => void
}

const scheduleTypeDisplayLabelMap: Record<ScheduleTypeCode, string> = {
  C001: '전사일정',
  C002: '개인일정',
  C003: '부서일정',
  C004: '간부일정',
  C005: '프로젝트일정',
  C006: '업무일정',
  C007: '화상회의',
  C008: '회의실예약',
}

const formatDate = (value?: string) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const CalendarScheduleDetailModal = ({
  open,
  schedule,
  onClose,
  onEdit,
}: CalendarScheduleDetailModalProps) => {
  const { refreshSchedules } = useCalendar()
  const { showToast } = useToast()
  const { loading: deleting, execute: deleteSchedule } = useApi<
    null,
    [string | number]
  >(scheduleApi.deleteSchedule, {
    immediate: false,
  })

  if (!schedule) return null

  const scheduleTypeLabel = scheduleTypeDisplayLabelMap[schedule.scheduleTypeCode]
  const modalTitle = (
    <span className="flex items-start gap-3">
      <span
        className="mt-1 h-12 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: schedule.borderColor }}
      />
      <span className="min-w-0">
        <span
          className="block text-sm font-bold"
          style={{ color: schedule.textColor }}
        >
          {scheduleTypeLabel}
        </span>
        <span className="mt-1 block break-words text-xl font-bold text-slate-950">
          {schedule.title}
        </span>
      </span>
    </span>
  )
  const handleDelete = async () => {
    try {
      await deleteSchedule(schedule.id)
      await refreshSchedules()
      showToast({
        title: '일정이 삭제되었습니다.',
        description: '캘린더에서 해당 일정이 제거되었습니다.',
        variant: 'success',
      })
      onClose()
    } catch (error) {
      showToast({
        title: '일정 삭제에 실패했습니다.',
        description:
          error instanceof ApiError
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  return (
    <Modal
      open={open}
      title={modalTitle}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="danger"
            leftIcon={<Trash2 size={16} />}
            onClick={handleDelete}
            loading={deleting}
          >
            삭제
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={() => onEdit(schedule)}>일정 수정</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <div className="grid gap-5">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Clock size={18} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">TIME</p>
              {schedule.allDay ? (
                <>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(schedule.start)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">종일</p>
                </>
              ) : (
                <div className="mt-1 grid gap-1 text-sm">
                  <p className="font-bold text-slate-800">
                    시작: {formatDateTime(schedule.start)}
                  </p>
                  <p className="font-bold text-slate-800">
                    종료: {formatDateTime(schedule.end)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <FileText size={14} />
            Description
          </div>
          <div className="min-h-20 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            {schedule.detail || '등록된 상세 내용이 없습니다.'}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <Users size={14} />
            Attendees
          </div>
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-500">
            혼자 챙기는 일정입니다. 공유 대상이 추가되면 이곳에 함께 표시됩니다.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default CalendarScheduleDetailModal
