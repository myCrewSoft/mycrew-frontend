import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  Clock,
  Crown,
  DoorOpen,
  FileText,
  FolderKanban,
  Globe2,
  Trash2,
  Users,
  Video,
} from 'lucide-react'
import { ApiError } from '../../api/axiosInstance'
import { scheduleApi } from '../../api/scheduleApi'
import Button from '../../components/common/button/Button'
import Modal from '../../components/common/overlay/modal/Modal'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
import { formatDateKey } from '../../utils/date'
import type { ScheduleResponseDto } from '../../types'
import type { CalendarEventItem, ScheduleTypeCode } from '../../types/calendar'
import { useCalendar } from './CalendarContext'
import { toCalendarEvent } from './calendar.mapper'

interface CalendarScheduleDetailModalProps {
  open: boolean
  schedule: CalendarEventItem | null
  onClose: () => void
  onEdit: (schedule: CalendarEventItem) => void
}

type ScheduleTargetDisplayItem = NonNullable<
  CalendarEventItem['targets']
>[number] & {
  targetNm?: string
  deptNm?: string
  jobGrdNm?: string
  profileImgUrl?: string
}

const scheduleTypeDisplayLabelMap: Record<ScheduleTypeCode, string> = {
  C001: '전사 일정',
  C002: '개인 일정',
  C003: '간부 일정',
  C004: '부서 일정',
  C005: '프로젝트 일정',
  C006: '업무 일정',
  C007: '회의',
  C008: '회의실 예약',
  PUBLIC_HOLIDAY: '법정 공휴일',
  ANNIVERSARY: '기념일',
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

const getTargetProfileFileId = (target: ScheduleTargetDisplayItem) => {
  const fileId = target.profileImgUrl?.match(/\/images\/(\d+)/)?.[1]
  return fileId ? Number(fileId) : null
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

const getTargetName = (target: ScheduleTargetDisplayItem) =>
  target.targetNm ?? `대상 ${target.targetId}`

const getTargetDepartmentName = (target: ScheduleTargetDisplayItem) =>
  target.deptNm ?? '소속 정보 없음'

const getTargetPositionName = (target: ScheduleTargetDisplayItem) =>
  target.jobGrdNm

const isSelfTarget = (target: ScheduleTargetDisplayItem, writerId?: number) =>
  writerId != null && String(writerId) === String(target.targetId)

const getScheduleScopeInfo = (schedule: CalendarEventItem) => {
  if (schedule.scheduleTypeCode === 'C003') {
    return {
      icon: <Crown size={18} />,
      title: '간부 일정',
      description: '간부 구성원에게 공유되는 일정입니다.',
      className: 'border-purple-100 bg-purple-50 text-purple-700',
      titleClassName: 'text-purple-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C001') {
    return {
      icon: <Globe2 size={18} />,
      title: '전사 전체 일정',
      description: '모든 구성원에게 공유되는 일정입니다.',
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      titleClassName: 'text-blue-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C004') {
    const departmentName = schedule.deptNm ?? schedule.deptCd ?? '선택한 부서'

    return {
      icon: <Building2 size={18} />,
      title: `${departmentName} 일정`,
      description: `${departmentName} 구성원에게 공유되는 일정입니다.`,
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      titleClassName: 'text-emerald-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C005') {
    return {
      icon: <FolderKanban size={18} />,
      title: '프로젝트 일정',
      description: '해당 프로젝트 참여자에게 공유되는 일정입니다.',
      className: 'border-cyan-100 bg-cyan-50 text-cyan-700',
      titleClassName: 'text-cyan-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C006') {
    return {
      icon: <ClipboardList size={18} />,
      title: '업무 일정',
      description: '해당 업무 담당자와 관련 구성원에게 공유되는 일정입니다.',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
      titleClassName: 'text-slate-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C007') {
    return {
      icon: <Video size={18} />,
      title: '회의 일정',
      description: '해당 회의 구성원에게 공유되는 일정입니다.',
      className: 'border-rose-100 bg-rose-50 text-rose-700',
      titleClassName: 'text-rose-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C008') {
    return {
      icon: <DoorOpen size={18} />,
      title: '회의실 예약 일정',
      description: '해당 회의실 예약 구성원에게 공유되는 일정입니다.',
      className: 'border-teal-100 bg-teal-50 text-teal-700',
      titleClassName: 'text-teal-950',
    }
  }

  return null
}

const getScheduleNavigationTarget = (schedule: CalendarEventItem) => {
  if (schedule.scheduleTypeCode === 'C005' && schedule.projId) {
    return { label: '프로젝트로 이동', path: `/project/${schedule.projId}` }
  }

  if (schedule.scheduleTypeCode === 'C006' && schedule.projId && schedule.taskId) {
    return {
      label: '업무로 이동',
      path: `/project/${schedule.projId}?tab=tasks&taskId=${schedule.taskId}`,
    }
  }

  if (schedule.scheduleTypeCode === 'C007' && schedule.mtngId) {
    return { label: '회의록으로 이동', path: `/meeting/minutes/${schedule.mtngId}` }
  }

  if (schedule.scheduleTypeCode === 'C008' && schedule.rsrvId) {
    const dateKey = formatDateKey(new Date(schedule.start))

    return {
      label: '예약 확인하기',
      path: `/reservations?reservationId=${schedule.rsrvId}&date=${dateKey}`,
    }
  }

  return null
}

const CalendarScheduleDetailModal = ({
  open,
  schedule,
  onClose,
  onEdit,
}: CalendarScheduleDetailModalProps) => {
  const navigate = useNavigate()
  const { refreshSchedules } = useCalendar()
  const { showToast } = useToast()
  const {
    data: scheduleDetail,
    loading: detailLoading,
    error: detailError,
    execute: fetchSchedule,
    reset: resetScheduleDetail,
  } = useApi<ScheduleResponseDto, [string | number]>(scheduleApi.getSchedule, {
    immediate: false,
  })
  const { loading: deleting, execute: deleteSchedule } = useApi<
    null,
    [string | number]
  >(scheduleApi.deleteSchedule, {
    immediate: false,
  })

  useEffect(() => {
    if (!open || !schedule) {
      resetScheduleDetail()
      return
    }

    void fetchSchedule(schedule.id).catch(() => {
      // 상세 조회가 실패해도 목록에서 받은 최소 정보는 그대로 보여줍니다.
    })
  }, [fetchSchedule, open, resetScheduleDetail, schedule])

  const detailSchedule = useMemo(() => {
    if (!scheduleDetail) return schedule

    try {
      return toCalendarEvent(scheduleDetail) ?? schedule
    } catch {
      return schedule
    }
  }, [schedule, scheduleDetail])

  if (!detailSchedule) return null

  const scheduleTypeLabel =
    scheduleTypeDisplayLabelMap[detailSchedule.scheduleTypeCode]
  const targetItems =
    (detailSchedule.targets as ScheduleTargetDisplayItem[] | undefined) ?? []
  const scheduleScopeInfo = getScheduleScopeInfo(detailSchedule)
  const isPersonalScheduleType = detailSchedule.scheduleTypeCode === 'C002'
  const visibleAttendees = isPersonalScheduleType
    ? targetItems.filter(
        (target) => !isSelfTarget(target, detailSchedule.writerId),
      )
    : targetItems
  const navigationTarget = getScheduleNavigationTarget(detailSchedule)
  const writerSubtitle = [
    detailSchedule.writerJobGrdNm,
    detailSchedule.writerDeptNm,
  ]
    .filter(Boolean)
    .join(' · ')
  const modalTitle = (
    <span className="flex items-start gap-3">
      <span
        className="mt-1 h-12 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: detailSchedule.borderColor }}
      />
      <span className="min-w-0">
        <span
          className="block text-sm font-bold"
          style={{ color: detailSchedule.textColor }}
        >
          {scheduleTypeLabel}
        </span>
        <span className="mt-1 block break-words text-xl font-bold text-slate-950">
          {detailSchedule.title}
        </span>
      </span>
    </span>
  )

  const handleDelete = async () => {
    try {
      await deleteSchedule(detailSchedule.id)
      await refreshSchedules()
      showToast({
        title: '일정을 삭제했습니다.',
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
            <Button onClick={() => onEdit(detailSchedule)}>일정 수정</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        {detailLoading && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            상세 정보를 불러오는 중입니다.
          </div>
        )}

        {detailError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            상세 조회에 실패해 목록 정보를 대신 표시합니다.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={`flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 ${
              detailSchedule.writerName ? '' : 'sm:col-span-2'
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Clock size={18} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">TIME</p>
              {detailSchedule.allDay ? (
                <>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(detailSchedule.start)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">종일</p>
                </>
              ) : (
                <div className="mt-1 grid gap-1 text-sm">
                  <p className="font-bold text-slate-800">
                    시작: {formatDateTime(detailSchedule.start)}
                  </p>
                  <p className="font-bold text-slate-800">
                    종료: {formatDateTime(detailSchedule.end)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {detailSchedule.writerName && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <ProfileAvatar
                fileId={detailSchedule.writerPrflImgFileId}
                name={detailSchedule.writerName}
                size={40}
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase text-slate-400">
                  작성자
                </span>
                <span className="block truncate text-sm font-bold text-slate-800">
                  {detailSchedule.writerName}
                </span>
                {writerSubtitle && (
                  <span className="block truncate text-xs font-medium text-slate-400">
                    {writerSubtitle}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <FileText size={14} />
            Description
          </div>
          <div className="min-h-20 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            {detailSchedule.detail || '등록된 상세 내용이 없습니다.'}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
            <Users size={14} />
            Attendees
          </div>

          {scheduleScopeInfo ? (
            <div
              role={navigationTarget ? 'button' : undefined}
              tabIndex={navigationTarget ? 0 : undefined}
              onClick={
                navigationTarget
                  ? () => {
                      navigate(navigationTarget.path)
                      onClose()
                    }
                  : undefined
              }
              onKeyDown={
                navigationTarget
                  ? (event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      navigate(navigationTarget.path)
                      onClose()
                    }
                  : undefined
              }
              className={`rounded-2xl border px-4 py-4 ${scheduleScopeInfo.className} ${
                navigationTarget
                  ? 'cursor-pointer transition-opacity hover:opacity-80'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  {scheduleScopeInfo.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-extrabold ${scheduleScopeInfo.titleClassName}`}
                  >
                    {scheduleScopeInfo.title}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-5">
                    {scheduleScopeInfo.description}
                  </p>
                </div>
                {navigationTarget && (
                  <ArrowUpRight size={18} className="mt-1 shrink-0" />
                )}
              </div>
            </div>
          ) : isPersonalScheduleType && visibleAttendees.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleAttendees.map((target) => {
                const positionName = getTargetPositionName(target)
                const departmentName = getTargetDepartmentName(target)

                return (
                  <div
                    key={`${target.targetTypeCd}-${target.targetId}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <ProfileAvatar
                      fileId={getTargetProfileFileId(target)}
                      name={getTargetName(target)}
                      size={40}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">
                        {getTargetName(target)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">
                        {[positionName, departmentName].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-500">
              참여자 없이 나에게만 표시되는 일정입니다.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CalendarScheduleDetailModal
