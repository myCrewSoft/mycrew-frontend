import { useEffect, useMemo } from 'react'
import {
  Building2,
  ClipboardList,
  Clock,
  FileText,
  FolderKanban,
  Globe2,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { ApiError } from '../../api/axiosInstance'
import { scheduleApi } from '../../api/scheduleApi'
import Button from '../../components/common/button/Button'
import Modal from '../../components/common/overlay/modal/Modal'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
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

type ScopeSchedule = CalendarEventItem & {
  deptName?: string
  deptNm?: string
  departmentName?: string
  projectName?: string
  projName?: string
  taskName?: string
}

interface TargetGroup {
  departmentName: string
  members: ScheduleTargetDisplayItem[]
}

const scheduleTypeDisplayLabelMap: Record<ScheduleTypeCode, string> = {
  C001: '전사 일정',
  C002: '개인 일정',
  C003: '부서 일정',
  C004: '간부 일정',
  C005: '프로젝트 일정',
  C006: '업무 일정',
  C007: '화상회의',
  C008: '회의실 예약',
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

const getTargetName = (target: ScheduleTargetDisplayItem) =>
  target.targetNm ?? `대상 ${target.targetId}`

const getTargetDepartmentName = (target: ScheduleTargetDisplayItem) =>
  target.deptNm ?? '소속 정보 없음'

const getTargetPositionName = (target: ScheduleTargetDisplayItem) =>
  target.jobGrdNm

const groupTargetsByDepartment = (
  targets: ScheduleTargetDisplayItem[],
): TargetGroup[] => {
  const groupMap = new Map<string, ScheduleTargetDisplayItem[]>()

  targets.forEach((target) => {
    const departmentName = getTargetDepartmentName(target)
    const currentMembers = groupMap.get(departmentName) ?? []

    groupMap.set(departmentName, [...currentMembers, target])
  })

  return Array.from(groupMap.entries()).map(([departmentName, members]) => ({
    departmentName,
    members,
  }))
}

const getScheduleScopeInfo = (schedule: ScopeSchedule) => {
  if (schedule.scheduleTypeCode === 'C001') {
    return {
      icon: <Globe2 size={18} />,
      title: '전사 전체 일정',
      description: '모든 구성원에게 공유되는 일정입니다.',
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      titleClassName: 'text-blue-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C003') {
    const departmentName =
      schedule.deptName ??
      schedule.deptNm ??
      schedule.departmentName ??
      schedule.deptCd ??
      '선택한 부서'

    return {
      icon: <Building2 size={18} />,
      title: `${departmentName} 일정`,
      description: '해당 부서 구성원에게 공유되는 일정입니다.',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      titleClassName: 'text-emerald-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C005') {
    const projectName =
      schedule.projectName ??
      schedule.projName ??
      (schedule.projId ? `프로젝트 #${schedule.projId}` : '선택한 프로젝트')

    return {
      icon: <FolderKanban size={18} />,
      title: `${projectName} 일정`,
      description: '해당 프로젝트 참여자에게 공유되는 일정입니다.',
      className: 'border-cyan-100 bg-cyan-50 text-cyan-700',
      titleClassName: 'text-cyan-950',
    }
  }

  if (schedule.scheduleTypeCode === 'C006') {
    const taskName =
      schedule.taskName ??
      (schedule.taskId ? `업무 #${schedule.taskId}` : '선택한 업무')

    return {
      icon: <ClipboardList size={18} />,
      title: `${taskName} 일정`,
      description: '해당 업무 담당자와 관련 구성원에게 공유되는 일정입니다.',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
      titleClassName: 'text-slate-950',
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
  const scheduleScopeInfo = getScheduleScopeInfo(detailSchedule as ScopeSchedule)
  const departmentTargets = targetItems.filter(
    (target) => target.targetTypeCd === '02',
  )
  const personalTargetGroups = groupTargetsByDepartment(
    targetItems.filter((target) => target.targetTypeCd !== '02'),
  )
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

        <div className="flex gap-3">
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
              className={`rounded-2xl border px-4 py-4 ${scheduleScopeInfo.className}`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  {scheduleScopeInfo.icon}
                </span>
                <div>
                  <p
                    className={`text-sm font-extrabold ${scheduleScopeInfo.titleClassName}`}
                  >
                    {scheduleScopeInfo.title}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-5">
                    {scheduleScopeInfo.description}
                  </p>
                </div>
              </div>
            </div>
          ) : targetItems.length > 0 ? (
            <div className="flex flex-col gap-4">
              {departmentTargets.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
                    <Building2 size={16} className="text-blue-700" />
                    부서 공유
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {departmentTargets.map((target) => (
                      <span
                        key={`${target.targetTypeCd}-${target.targetId}`}
                        className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-bold text-blue-700"
                      >
                        {getTargetName(target)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {personalTargetGroups.map((group) => (
                <div
                  key={group.departmentName}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Building2 size={16} className="shrink-0 text-slate-400" />
                      <p className="truncate text-sm font-extrabold text-slate-800">
                        {group.departmentName}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                      {group.members.length}명
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.members.map((target) => {
                      const positionName = getTargetPositionName(target)

                      return (
                        <div
                          key={`${target.targetTypeCd}-${target.targetId}`}
                          className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          {target.profileImgUrl ? (
                            <img
                              src={target.profileImgUrl}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                              <UserRound size={15} />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-800">
                              {getTargetName(target)}
                            </span>
                            {positionName && (
                              <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">
                                {positionName}
                              </span>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
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
