import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  FileVolume,
  LayoutList,
  Link2,
  Pencil,
  Play,
  PhoneOff,
  Trash2,
  Users,
  UserPlus,
  Video,
  X,
} from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type FullCalendarComponent from '@fullcalendar/react'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import { formatMonthTitle } from '../../utils/date'
import '../calendar/calendar.css'
import { meetingApi } from '../../api/meetingApi'
import { meetingRoomReservationApi } from '../../api/ReservationApi'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Button from '../../components/common/button/Button'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'
import FormField from '../../components/common/form/formField/FormField'
import Tabs from '../../components/common/tabs/Tabs'
import { useToast } from '../../components/common/toast/useToast'
import PageComponent from '../../components/layouts/PageComponent'
import { useApi } from '../../hooks/useApi'
import type {
  ReservationResponse,
  RoomResponse,
} from '../../types'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import MeetingRoomAvailabilityTimeline from './MeetingRoomAvailabilityTimeline'
import MeetingMinutesPage from './MeetingMinutesPage'
import type {
  MeetingDetail,
  MeetingCreateRequest,
  MeetingListItem,
  MeetingParticipant,
  MeetingStatus,
  MeetingTypeCode,
} from '../../types/meeting.dto'

const filterTabs: Array<{ value: MeetingStatus; label: string }> = [
  { value: 'scheduled', label: '예약된 회의' },
  { value: 'live', label: '진행 중' },
  { value: 'ended', label: '지난 회의' },
]

const filterPathMap: Record<MeetingStatus, string> = {
  scheduled: '/meeting/scheduled',
  live: '/meeting/list',
  ended: '/meeting/history',
}

const EMPTY_MEETING_ROOMS: RoomResponse[] = []
const EMPTY_ROOM_RESERVATIONS: ReservationResponse[] = []

const getFilterFromPath = (pathname: string): MeetingStatus => {
  if (pathname.includes('/minutes')) return 'ended'
  if (pathname.includes('/history')) return 'ended'
  if (pathname.includes('/list')) return 'live'
  return 'scheduled'
}

const statusLabelMap: Record<MeetingStatus, string> = {
  scheduled: '예약됨',
  live: '진행 중',
  ended: '종료',
}

const statusBadgeVariantMap: Record<
  MeetingStatus,
  'primary' | 'success' | 'neutral' | 'danger' | 'outline'
> = {
  scheduled: 'primary',
  live: 'success',
  ended: 'neutral',
}

const meetingTypeLabelMap: Record<MeetingTypeCode, string> = {
  '01': '온라인',
  '02': '오프라인',
  '03': '혼합',
}

const meetingTypeBadgeVariantMap: Record<
  MeetingTypeCode,
  'violet' | 'warning' | 'info'
> = {
  '01': 'violet',
  '02': 'warning',
  '03': 'info',
}

const getMeetingTypeLabel = (code?: string | null) =>
  meetingTypeLabelMap[code as MeetingTypeCode] ?? '오프라인'

const getMeetingTypeBadgeVariant = (code?: string | null) =>
  meetingTypeBadgeVariantMap[code as MeetingTypeCode] ?? 'warning'

const getRecordingLabel = (meeting: MeetingListItem | MeetingDetail) => {
  if (meeting.vconfId === null) return '해당 없음'
  if ('rcrdgAtchFileId' in meeting) {
    return meeting.rcrdgAtchFileId ? '생성 완료' : '녹취록 없음'
  }
  if (meeting.mtngSttus === 'ended') return '상세에서 확인'
  return '회의 종료 후 생성'
}

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

const isDateTimeRangeValid = (beginDt: string, endDt: string) => {
  const beginTimestamp = new Date(beginDt).getTime()
  const endTimestamp = new Date(endDt).getTime()

  return (
    !Number.isNaN(beginTimestamp) &&
    !Number.isNaN(endTimestamp) &&
    beginTimestamp < endTimestamp
  )
}

const isReservationOverlapping = (
  beginDt: string,
  endDt: string,
  reservation: ReservationResponse,
) =>
  new Date(beginDt).getTime() < new Date(reservation.endDateTime).getTime() &&
  new Date(endDt).getTime() > new Date(reservation.startDateTime).getTime()


const formatTime = (dateTime?: string | null) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const formatDateTitle = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-')
  return `${Number(month)}월 ${Number(day)}일 · ${year}`
}

const formatDateTime = (dateTime?: string | null) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const toDateTimeInputValue = (dateTime?: string | null) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const getMeetingDateKey = (meeting: MeetingListItem) =>
  toDateKey(new Date(meeting.beginDt ?? ''))

// 예약됨(01)·진행 중(02) 모두 입장 가능
const canJoinMeeting = (meeting: MeetingListItem | MeetingDetail) =>
  meeting.vconfId !== null &&
  (meeting.mtngSttus === 'scheduled' || meeting.mtngSttus === 'live')

// 회의록 상태 한글 변환
const getMomStatusLabel = (cd?: string | null) => {
  const map: Record<string, string> = {
    '01': 'AI 초안',
    '02': '편집 중',
    '03': '검토 중',
    '04': '확정',
  }
  return cd ? (map[cd] ?? '생성 중') : '생성 중'
}

const groupMeetingsByDate = (meetings: MeetingListItem[]) =>
  meetings.reduce<Record<string, MeetingListItem[]>>((groups, meeting) => {
    const dateKey = getMeetingDateKey(meeting)
    return {
      ...groups,
      [dateKey]: [...(groups[dateKey] ?? []), meeting],
    }
  }, {})

const isMeetingDetail = (
  meeting: MeetingListItem | MeetingDetail,
): meeting is MeetingDetail =>
  Array.isArray((meeting as MeetingDetail).ptcptList)

// 서버 전송 필드와 화면 전용 체크박스 상태를 함께 관리합니다.
type ScheduleForm = Omit<MeetingCreateRequest, 'mtngTypeCd'> & {
  beginDt: string
  endDt: string
  confRmId: number | null
  useVideoConference: boolean
  useMeetingRoom: boolean
}

const createDefaultScheduleForm = (): ScheduleForm => {
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  const beginDt = localNow.toISOString().slice(0, 16)
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const localLater = new Date(oneHourLater.getTime() - oneHourLater.getTimezoneOffset() * 60_000)
  const endDt = localLater.toISOString().slice(0, 16)
  return {
    mtngNm: '',
    beginDt,
    endDt,
    confRmId: null,
    ptcptEmpIds: [],
    useVideoConference: true,
    useMeetingRoom: false,
  }
}
const MeetingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const selectedFilter = useMemo(
    () => getFilterFromPath(location.pathname),
    [location.pathname],
  )

  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetail | null>(null)
  const [selectedMinutesMeeting, setSelectedMinutesMeeting] = useState<MeetingDetail | null>(null)
  const [meetingSearchKeyword, setMeetingSearchKeyword] = useState('')
  const [meetingDateFrom, setMeetingDateFrom] = useState('')
  const [meetingDateTo, setMeetingDateTo] = useState('')
  const [meetingViewMode, setMeetingViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth')
  const [calendarTitle, setCalendarTitle] = useState(() => formatMonthTitle(new Date()))
  const meetingCalendarRef = useRef<FullCalendarComponent>(null)
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false)
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null)
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(createDefaultScheduleForm)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Array<string | number>>([])
  const [scheduleValidationMessage, setScheduleValidationMessage] = useState('')

  const { data: meetings, execute: fetchMeetings } = useApi<MeetingListItem[], []>(
    meetingApi.getMeetingList,
    { immediate: false },
  )

  const { loading: createConfLoading, execute: createConf } = useApi(
    meetingApi.createMeeting,
    { immediate: false },
  )

  const { loading: updateMeetingLoading, execute: execUpdateMeeting } = useApi(
    meetingApi.updateMeeting,
    { immediate: false },
  )

  const { loading: deleteMeetingLoading, execute: execDeleteMeeting } = useApi(
    meetingApi.deleteMeeting,
    { immediate: false },
  )

  const { execute: fetchMeetingDetail } = useApi(
    meetingApi.getMeeting,
    { immediate: false },
  )

  const { data: meetingRooms } = useApi<RoomResponse[]>(
    meetingRoomReservationApi.getMeetingRooms,
    { initialData: EMPTY_MEETING_ROOMS },
  )

  const {
    data: roomReservations,
    loading: roomReservationsLoading,
    error: roomReservationsError,
    execute: fetchRoomReservations,
    reset: resetRoomReservations,
  } = useApi<ReservationResponse[], [string, string]>(
    meetingRoomReservationApi.getReservations,
    {
      immediate: false,
      initialData: EMPTY_ROOM_RESERVATIONS,
    },
  )

  const { execute: issueToken } = useApi(
    meetingApi.issueToken,
    { immediate: false },
  )

  const { loading: endMeetingLoading, execute: execEndMeeting } = useApi(
    meetingApi.endConf,
    { immediate: false },
  )

  useEffect(() => {
    void fetchMeetings().catch(() => {
      // 조회 오류는 useApi의 error 상태에서 관리합니다.
    })
  }, [fetchMeetings, selectedFilter])

  const reservationBeginDate = scheduleForm.beginDt.slice(0, 10)
  const reservationEndDate = scheduleForm.endDt.slice(0, 10)

  useEffect(() => {
    if (
      !schedulePanelOpen ||
      !reservationBeginDate ||
      !reservationEndDate ||
      !isDateTimeRangeValid(scheduleForm.beginDt, scheduleForm.endDt)
    ) {
      resetRoomReservations()
      return
    }

    void fetchRoomReservations(
      reservationBeginDate,
      reservationEndDate,
    ).catch(() => {
      // 조회 오류는 타임라인 내부에서 안내합니다.
    })
  }, [
    fetchRoomReservations,
    reservationBeginDate,
    reservationEndDate,
    resetRoomReservations,
    scheduleForm.beginDt,
    scheduleForm.endDt,
    schedulePanelOpen,
  ])

  const meetingList = useMemo(() => meetings ?? [], [meetings])

  const filteredMeetings = meetingList
    .filter((meeting: MeetingListItem) => meeting.mtngSttus === selectedFilter)
    .filter((meeting: MeetingListItem) => {
      if (!meetingSearchKeyword.trim()) return true
      const keyword = meetingSearchKeyword.trim().toLowerCase()
      return [meeting.mtngNm, meeting.crtrNm, meeting.roomNm].some(
        (value) => value?.toLowerCase().includes(keyword),
      )
    })
    .filter((meeting: MeetingListItem) => {
      const dateKey = getMeetingDateKey(meeting)
      if (meetingDateFrom && dateKey < meetingDateFrom) return false
      if (meetingDateTo && dateKey > meetingDateTo) return false
      return true
    })
    .sort(
      (a: MeetingListItem, b: MeetingListItem) =>
        new Date(a.beginDt ?? '').getTime() - new Date(b.beginDt ?? '').getTime(),
    )

  const groupedMeetings = groupMeetingsByDate(filteredMeetings)
  const dateKeys = Object.keys(groupedMeetings).sort()

  const statusColorMap: Record<MeetingStatus, { bg: string; border: string }> = {
    scheduled: { bg: '#3b82f6', border: '#2563eb' },
    live:      { bg: '#10b981', border: '#059669' },
    ended:     { bg: '#94a3b8', border: '#64748b' },
  }

  const calendarEvents = useMemo(
    () =>
      filteredMeetings.map((m) => ({
        id: String(m.mtngId),
        title: m.mtngNm ?? '',
        start: m.beginDt ?? '',
        end: m.endDt ?? '',
        backgroundColor: statusColorMap[m.mtngSttus].bg,
        borderColor: statusColorMap[m.mtngSttus].border,
        textColor: '#ffffff',
        extendedProps: { meeting: m },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredMeetings],
  )

  const handleCalendarEventClick = (info: EventClickArg) => {
    const meeting = info.event.extendedProps.meeting as MeetingListItem
    handlePrimaryMeetingAction(meeting)
  }

  const moveCalendar = (direction: 'prev' | 'today' | 'next') => {
    const api = meetingCalendarRef.current?.getApi()
    if (!api) return
    if (direction === 'prev') api.prev()
    else if (direction === 'next') api.next()
    else api.today()
    setCalendarTitle(formatMonthTitle(api.getDate()))
  }

  const handleCalendarViewChange = (view: 'dayGridMonth' | 'timeGridWeek') => {
    meetingCalendarRef.current?.getApi().changeView(view)
    setCalendarView(view)
  }

  const renderMeetingCalendarEvent = (info: EventContentArg) => (
    <div
      className="calendar-main-event"
      style={
        {
          '--calendar-event-bg': info.event.backgroundColor ?? '#3b82f6',
          '--calendar-event-border': info.event.borderColor ?? '#2563eb',
          '--calendar-event-color': '#ffffff',
        } as React.CSSProperties
      }
    >
      <span className="calendar-main-event-dot" />
      <span className="calendar-main-event-time">{formatTime(info.event.startStr)}</span>
      <span className="calendar-main-event-title">{info.event.title}</span>
    </div>
  )

  const tabsWithCount = filterTabs.map((tab) => ({
    ...tab,
    count: meetingList.filter(
      (meeting: MeetingListItem) => meeting.mtngSttus === tab.value,
    ).length,
  }))

  const hasMeetingFilter =
    Boolean(meetingSearchKeyword.trim()) || Boolean(meetingDateFrom) || Boolean(meetingDateTo)

  const resetMeetingFilters = () => {
    setMeetingSearchKeyword('')
    setMeetingDateFrom('')
    setMeetingDateTo('')
  }

  // 회의 입장 버튼 - 토큰 발급 후 LiveKit 회의실 페이지로 이동
  const handleJoinMeeting = useCallback(
    async (meeting: MeetingListItem | MeetingDetail) => {
      if (meeting.vconfId === null) return
      try {
        const tokenRes = await issueToken(meeting.vconfId)
        if (tokenRes.data?.token) {
          navigate(`/meeting/room/${meeting.vconfId}`, {
            state: {
              token: tokenRes.data.token,
              roomNm: tokenRes.data.roomNm,
              mtngId: meeting.mtngId,
              canEnd: meeting.canEnd,
            },
          })
        }
      } catch {
        // 에러 처리는 추후 토스트로 교체
      }
    },
    [issueToken, navigate],
  )

  const openMeetingDetail = useCallback(
    async (mtngId: number) => {
      const response = await fetchMeetingDetail(mtngId)
      if (response.data) setSelectedMeeting(response.data)
    },
    [fetchMeetingDetail],
  )

  const handlePrimaryMeetingAction = (meeting: MeetingListItem) => {
    // 진행 중인 회의는 바로 입장, 그 외(예약됨·종료)는 상세 모달 먼저 표시
    if (meeting.mtngSttus === 'live' && meeting.vconfId !== null) {
      void handleJoinMeeting(meeting)
      return
    }
    void openMeetingDetail(meeting.mtngId)
  }

  const handleEndMeeting = async (meeting: MeetingListItem | MeetingDetail) => {
    if (meeting.vconfId === null || !meeting.canEnd) return
    if (!window.confirm(`'${meeting.mtngNm}' 회의를 종료하시겠습니까?`)) return

    try {
      await execEndMeeting(meeting.vconfId)
      setSelectedMeeting(null)
      await fetchMeetings()
      showToast({
        title: '회의를 종료했습니다.',
        description: '종료된 회의는 지난 회의에서 확인할 수 있습니다.',
        variant: 'success',
      })
    } catch {
      showToast({
        title: '회의 종료에 실패했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const openMinutesWorkspace = useCallback(
    async (meeting: MeetingListItem | MeetingDetail) => {
      const detail =
        isMeetingDetail(meeting)
          ? meeting
          : (await fetchMeetingDetail(meeting.mtngId)).data

      if (!detail) return
      setSelectedMeeting(null)
      setSelectedMinutesMeeting(detail)
    },
    [fetchMeetingDetail],
  )

  const handleDownloadRecording = useCallback(
    async (meeting: MeetingListItem | MeetingDetail) => {
      const detail =
        'rcrdgAtchFileId' in meeting
          ? meeting
          : (await fetchMeetingDetail(meeting.mtngId)).data

      if (detail?.vconfId === null || !detail?.rcrdgAtchFileId) {
        showToast({
          title: '다운로드할 녹취록이 없습니다.',
          description: '녹취록 생성이 완료된 후 다시 시도해 주세요.',
          variant: 'info',
        })
        return
      }

      window.location.assign(
        meetingApi.getRcrdgDownloadUrl(
          detail.vconfId,
          detail.rcrdgAtchFileId,
        ),
      )
    },
    [fetchMeetingDetail, showToast],
  )

  const handleStreamRecording = useCallback(
    async (meeting: MeetingListItem | MeetingDetail) => {
      const streamWindow = window.open('', '_blank')
      if (streamWindow) streamWindow.opener = null

      try {
        const detail =
          'rcrdgAtchFileId' in meeting
            ? meeting
            : (await fetchMeetingDetail(meeting.mtngId)).data

        if (detail?.vconfId === null || !detail?.rcrdgAtchFileId) {
          streamWindow?.close()
          showToast({
            title: '재생할 녹취록이 없습니다.',
            description: '녹취록 생성이 완료된 후 다시 시도해 주세요.',
            variant: 'info',
          })
          return
        }

        const streamUrl = meetingApi.getRcrdgStreamUrl(
          detail.vconfId,
          detail.rcrdgAtchFileId,
        )
        if (streamWindow) {
          streamWindow.location.href = streamUrl
        } else {
          window.location.assign(streamUrl)
        }
      } catch {
        streamWindow?.close()
        showToast({
          title: '녹취록을 재생하지 못했습니다.',
          description: '잠시 후 다시 시도해 주세요.',
          variant: 'danger',
        })
      }
    },
    [fetchMeetingDetail, showToast],
  )

  const handleScheduleFormChange = (
    field: keyof ScheduleForm,
    value: string | boolean | number | number[] | null,
  ) => {
    setScheduleValidationMessage('')
    setScheduleForm((current : ScheduleForm) => ({ ...current, [field]: value }))
  }

  const closeSchedulePanel = () => {
    setSchedulePanelOpen(false)
    setEditingMeetingId(null)
    setScheduleForm(createDefaultScheduleForm())
    setSelectedEmployeeIds([])
    setScheduleValidationMessage('')
  }

  const handleEditMeeting = (meeting: MeetingDetail) => {
    const usesVideoConference =
      meeting.mtngTypeCd === '01' || meeting.mtngTypeCd === '03'
    const usesMeetingRoom = meeting.confRmId !== null

    setEditingMeetingId(meeting.mtngId)
    setScheduleForm({
      mtngNm: meeting.mtngNm,
      beginDt: toDateTimeInputValue(meeting.beginDt),
      endDt: toDateTimeInputValue(meeting.endDt),
      confRmId: meeting.confRmId,
      ptcptEmpIds: meeting.ptcptList.map((participant) => participant.empId),
      useVideoConference: usesVideoConference,
      useMeetingRoom: usesMeetingRoom,
    })
    setSelectedEmployeeIds(
      meeting.ptcptList.map((participant) => participant.empId),
    )
    setScheduleValidationMessage('')
    setSelectedMeeting(null)
    setSchedulePanelOpen(true)
  }

  const handleDeleteMeeting = async (meeting: MeetingDetail) => {
    if (!window.confirm(`'${meeting.mtngNm}' 회의를 삭제하시겠습니까?`)) return

    try {
      await execDeleteMeeting(meeting.mtngId)
      setSelectedMeeting(null)
      await fetchMeetings()
      showToast({
        title: '회의를 삭제했습니다.',
        description: '예약된 회의 목록에서 제거되었습니다.',
        variant: 'success',
      })
    } catch {
      showToast({
        title: '회의 삭제에 실패했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const handleSubmitScheduleMeeting = async () => {
    if (!scheduleForm.mtngNm.trim()) {
      setScheduleValidationMessage('회의 제목을 입력해주세요.')
      return
    }

    if (!scheduleForm.beginDt || !scheduleForm.endDt) {
      setScheduleValidationMessage('회의 시작 일시와 종료 일시를 입력해주세요.')
      return
    }

    if (new Date(scheduleForm.beginDt) >= new Date(scheduleForm.endDt)) {
      setScheduleValidationMessage('종료 일시는 시작 일시보다 늦어야 합니다.')
      return
    }

    if (scheduleForm.useMeetingRoom && scheduleForm.confRmId === null) {
      setScheduleValidationMessage('사용할 회의실을 선택해주세요.')
      return
    }

    const selectedRoomUnavailable =
      scheduleForm.useMeetingRoom &&
      (roomReservations ?? []).some(
        (reservation) =>
          reservation.roomId === scheduleForm.confRmId &&
          reservation.mtngId !== editingMeetingId &&
          isReservationOverlapping(
            scheduleForm.beginDt,
            scheduleForm.endDt,
            reservation,
          ),
      )

    if (selectedRoomUnavailable) {
      setScheduleValidationMessage(
        '선택한 시간에 이미 예약된 회의실입니다. 다른 회의실을 선택해주세요.',
      )
      return
    }

    const ptcptEmpIds = selectedEmployeeIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))

    const mtngTypeCd: MeetingTypeCode =
      scheduleForm.useVideoConference && scheduleForm.useMeetingRoom
        ? '03'
        : scheduleForm.useVideoConference
          ? '01'
          : '02'

    const payload = {
      mtngNm: scheduleForm.mtngNm,
      mtngTypeCd,
      beginDt: scheduleForm.beginDt,
      endDt: scheduleForm.endDt,
      confRmId: scheduleForm.useMeetingRoom
        ? scheduleForm.confRmId
        : null,
      ptcptEmpIds,
    }

    if (editingMeetingId !== null) {
      await execUpdateMeeting(editingMeetingId, payload)
      showToast({
        title: '회의 정보를 수정했습니다.',
        description: '변경한 내용이 예약된 회의에 반영되었습니다.',
        variant: 'success',
      })
    } else {
      await createConf(payload)
    }

    closeSchedulePanel()
    navigate('/meeting/scheduled')
    await fetchMeetings()
  }

  useEffect(() => {
    const action = new URLSearchParams(location.search).get('action')
    const detailMeetingId = Number(new URLSearchParams(location.search).get('detailMeetingId'))
    const minutesMeetingId = Number(new URLSearchParams(location.search).get('minutesMeetingId'))

    if (action === 'reserve') {
      queueMicrotask(() => {
        setEditingMeetingId(null)
        setScheduleForm(createDefaultScheduleForm())
        setSelectedEmployeeIds([])
        setScheduleValidationMessage('')
        setSchedulePanelOpen(true)
        navigate(location.pathname, { replace: true })
      })
    }

    if (Number.isFinite(detailMeetingId) && detailMeetingId > 0) {
      const target = meetingList.find((m: MeetingListItem) => m.mtngId === detailMeetingId)
      if (target) {
        queueMicrotask(() => {
          setSelectedMinutesMeeting(null)
          void openMeetingDetail(target.mtngId)
          navigate(location.pathname, { replace: true })
        })
      }
    }

    if (Number.isFinite(minutesMeetingId) && minutesMeetingId > 0) {
      const target = meetingList.find((m: MeetingListItem) => m.mtngId === minutesMeetingId)
      if (target) {
        queueMicrotask(() => {
          setSelectedMeeting(null)
          void openMinutesWorkspace(target)
          navigate(location.pathname, { replace: true })
        })
      }
    }
  }, [
    location.pathname,
    location.search,
    meetingList,
    navigate,
    openMeetingDetail,
    openMinutesWorkspace,
  ])

  useEffect(() => {
    if (!schedulePanelOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSchedulePanelOpen(false)
        setEditingMeetingId(null)
        setScheduleForm(createDefaultScheduleForm())
        setSelectedEmployeeIds([])
        setScheduleValidationMessage('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [schedulePanelOpen])

  if (selectedMinutesMeeting) {
    return (
      <MeetingMinutesPage
        meeting={selectedMinutesMeeting}
        onBack={() => setSelectedMinutesMeeting(null)}
      />
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 목록 화면
  // ─────────────────────────────────────────────────────────────

  return (
    <PageComponent>
      <div className="flex w-full flex-col gap-6">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {meetingViewMode === 'list' && (
                <div className="min-w-0 overflow-x-auto">
                  <Tabs
                    items={tabsWithCount}
                    value={selectedFilter}
                    onChange={(value) => navigate(filterPathMap[value as MeetingStatus])}
                  />
                </div>
              )}
              {meetingViewMode === 'calendar' && (
                <>
                  <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      aria-label="이전"
                      onClick={() => moveCalendar('prev')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCalendar('today')}
                      className="h-8 rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-white"
                    >
                      오늘
                    </button>
                    <button
                      type="button"
                      aria-label="다음"
                      onClick={() => moveCalendar('next')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <h2 className="shrink-0 text-base font-bold text-slate-800">
                    {calendarTitle}
                  </h2>
                </>
              )}
              {meetingViewMode === 'calendar' && (
                <div className="ml-auto flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {(['dayGridMonth', 'timeGridWeek'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleCalendarViewChange(v)}
                      className={`h-8 rounded-lg px-3 text-sm font-bold transition-colors ${
                        calendarView === v
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {v === 'dayGridMonth' ? '월' : '주'}
                    </button>
                  ))}
                </div>
              )}
              <div
                className={`flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 ${
                  meetingViewMode === 'list' ? 'ml-auto' : ''
                }`}
              >
                <button
                  type="button"
                  aria-label="목록 보기"
                  onClick={() => setMeetingViewMode('list')}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    meetingViewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutList size={16} />
                </button>
                <button
                  type="button"
                  aria-label="캘린더 보기"
                  onClick={() => setMeetingViewMode('calendar')}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    meetingViewMode === 'calendar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CalendarDays size={16} />
                </button>
              </div>
            </div>

            {meetingViewMode === 'list' && (
              <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 lg:grid-cols-[minmax(260px,1fr)_170px_170px_auto] lg:items-end">
                <SearchInput
                  placeholder="회의명, 작성자, 화상 회의실 검색"
                  value={meetingSearchKeyword}
                  onChange={(e) => setMeetingSearchKeyword(e.target.value)}
                  wrapperClassName="w-full"
                />
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-500">시작일</span>
                  <input
                    type="date"
                    value={meetingDateFrom}
                    onChange={(e) => setMeetingDateFrom(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-500">종료일</span>
                  <input
                    type="date"
                    value={meetingDateTo}
                    onChange={(e) => setMeetingDateTo(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-400"
                  />
                </label>
                <Button
                  variant="outline"
                  leftIcon={<X size={15} />}
                  disabled={!hasMeetingFilter}
                  onClick={resetMeetingFilters}
                  className="w-full lg:w-auto"
                >
                  초기화
                </Button>
              </div>
            )}
          </div>

          {meetingViewMode === 'list' ? (
            dateKeys.length === 0 ? (
              <EmptyState
                title="조회된 회의가 없습니다."
                description="백엔드에서 회의 데이터가 내려오면 이 영역에 날짜별 목록으로 표시됩니다."
              />
            ) : (
              dateKeys.map((dateKey) => (
                <section key={dateKey} className="flex flex-col gap-3">
                  <h2 className="text-sm font-bold text-slate-600">{formatDateTitle(dateKey)}</h2>
                  {groupedMeetings[dateKey].map((meeting) => {
                    const isLive = meeting.mtngSttus === 'live'
                    const status = meeting.mtngSttus
                    return (
                      <article
                        key={meeting.mtngId}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:border-blue-200 hover:bg-white"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-bold text-slate-950">
                                  {meeting.mtngNm}
                                </h3>
                                <Badge variant={statusBadgeVariantMap[status]}>
                                  {statusLabelMap[status]}
                                </Badge>
                                <Badge variant={getMeetingTypeBadgeVariant(meeting.mtngTypeCd)}>
                                  {getMeetingTypeLabel(meeting.mtngTypeCd)}
                                </Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock size={16} />
                                  {formatTime(meeting.beginDt)}
                                  {meeting.endDt ? ` - ${formatTime(meeting.endDt)}` : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Users size={16} />
                                  참여자 {meeting.ptcptCnt ?? 0}명
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarClock size={16} />
                                  생성자 {meeting.crtrNm}
                                </span>
                              </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                              <Button
                                variant={isLive && meeting.vconfId !== null ? 'primary' : 'outline'}
                                leftIcon={isLive && meeting.vconfId !== null ? <Video size={16} /> : <FileText size={16} />}
                                className="w-full lg:w-32"
                                onClick={() => handlePrimaryMeetingAction(meeting)}
                              >
                                {isLive && meeting.vconfId !== null ? '회의 입장' : '상세 보기'}
                              </Button>
                              {isLive && meeting.vconfId !== null && meeting.canEnd && (
                                <Button
                                  variant="danger"
                                  leftIcon={<PhoneOff size={16} />}
                                  className="w-full lg:w-32"
                                  loading={endMeetingLoading}
                                  onClick={() => void handleEndMeeting(meeting)}
                                >
                                  회의 종료
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <UserPlus size={14} />
                                참여 정보
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {meeting.ptcptCnt ?? 0}명 참여 예정
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void openMinutesWorkspace(meeting)}
                              className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-100"
                            >
                              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <FileText size={14} />
                                회의록
                              </p>
                              <p className="mt-1 text-sm font-bold text-blue-700">
                                {getMomStatusLabel(meeting.momSttusCd)}
                              </p>
                            </button>
                            <div className="relative rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <FileVolume size={14} />
                                녹취록
                              </p>
                              <div className="mt-1 flex items-start justify-between gap-3 pr-20">
                                <p className="text-sm font-bold text-emerald-700">
                                  {getRecordingLabel(meeting)}
                                </p>
                              </div>
                              {meeting.vconfId !== null &&
                                meeting.mtngSttus === 'ended' && (
                                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      aria-label="녹취록 스트리밍"
                                      title="스트리밍"
                                      onClick={() => void handleStreamRecording(meeting)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                                    >
                                      <Play size={13} fill="currentColor" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="녹취록 다운로드"
                                      title="다운로드"
                                      onClick={() => void handleDownloadRecording(meeting)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                                    >
                                      <Download size={13} />
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </section>
              ))
            )
          ) : (
            <div className="calendar-main overflow-hidden rounded-xl border border-slate-200 bg-white">
              <FullCalendar
                ref={meetingCalendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={calendarView}
                height={680}
                locale="ko"
                headerToolbar={false}
                dayMaxEvents={3}
                moreLinkContent={(args) => `+${args.num} 더보기`}
                eventDisplay="block"
                eventContent={renderMeetingCalendarEvent}
                events={calendarEvents}
                eventClick={handleCalendarEventClick}
                datesSet={(info) => setCalendarTitle(formatMonthTitle(info.view.currentStart))}
              />
            </div>
          )}

        </section>
      </div>

      {/* ── 상세 모달 ── */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <section className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setSelectedMeeting(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <X size={22} />
            </button>

            <div className="px-8 pb-6 pt-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariantMap[selectedMeeting.mtngSttus]}>
                  {statusLabelMap[selectedMeeting.mtngSttus]}
                </Badge>
                <Badge variant={getMeetingTypeBadgeVariant(selectedMeeting.mtngTypeCd)}>
                  {getMeetingTypeLabel(selectedMeeting.mtngTypeCd)}
                </Badge>
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-950">
                {selectedMeeting.mtngNm}
              </h2>
              <div className="mt-6 flex flex-col gap-3 text-sm font-bold text-slate-600">
                <p className="flex items-center gap-3">
                  <CalendarClock size={20} className="text-blue-700" />
                  {formatDateTime(selectedMeeting.beginDt)}
                  {selectedMeeting.endDt ? ` - ${formatTime(selectedMeeting.endDt)}` : ''}
                </p>
                <p className="flex items-center gap-3">
                  <Link2 size={20} className="text-blue-700" />
                  {selectedMeeting.confRmNm ?? selectedMeeting.roomNm ?? '회의실 미사용'}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-500">
                  참여자 ({selectedMeeting.ptcptList?.length ?? 0}명)
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {(selectedMeeting.ptcptList ?? []).slice(0, 4).map((p: MeetingParticipant) => (
                      <ProfileAvatar
                        key={p.empId}
                        fileId={p.prflImgFileId}
                        name={p.empNm}
                        size={40}
                        rounded="xl"
                        className="border-2 border-white shadow-sm"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-slate-600">
                    {selectedMeeting.ptcptList?.length
                      ? `${selectedMeeting.ptcptList[0].empNm} 외 ${(selectedMeeting.ptcptList.length - 1)}명`
                      : `${selectedMeeting.ptcptList?.length ?? 0}명 참여 예정`}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void openMinutesWorkspace(selectedMeeting)}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100"
                >
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <FileText size={14} />
                    회의록
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-700">
                    {getMomStatusLabel(selectedMeeting.momSttusCd)}
                  </p>
                </button>
                <div className="relative rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <FileVolume size={14} />
                    녹취록
                  </p>
                  <p className="mt-1 pr-20 text-sm font-bold text-emerald-700">
                    {getRecordingLabel(selectedMeeting)}
                  </p>
                  {selectedMeeting.vconfId !== null &&
                    selectedMeeting.rcrdgAtchFileId && (
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="녹취록 스트리밍"
                          title="스트리밍"
                          onClick={() =>
                            void handleStreamRecording(selectedMeeting)
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Play size={13} fill="currentColor" />
                        </button>
                        <button
                          type="button"
                          aria-label="녹취록 다운로드"
                          title="다운로드"
                          onClick={() =>
                            void handleDownloadRecording(selectedMeeting)
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    )}
                </div>
              </div>
              {selectedMeeting.vconfId !== null &&
                selectedMeeting.rcrdgAtchFileId && (
                  <audio
                    controls
                    preload="metadata"
                    className="mt-4 w-full"
                    src={meetingApi.getRcrdgStreamUrl(
                      selectedMeeting.vconfId,
                      selectedMeeting.rcrdgAtchFileId,
                    )}
                  >
                    브라우저가 오디오 재생을 지원하지 않습니다.
                  </audio>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-8 py-5">
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  leftIcon={<Trash2 size={16} />}
                  disabled={!selectedMeeting.canDelete}
                  loading={deleteMeetingLoading}
                  onClick={() => void handleDeleteMeeting(selectedMeeting)}
                >
                  삭제
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Pencil size={16} />}
                  disabled={!selectedMeeting.canEdit}
                  onClick={() => handleEditMeeting(selectedMeeting)}
                >
                  수정
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedMeeting(null)}>
                  닫기
                </Button>
                {selectedMeeting.vconfId !== null && (
                  <Button
                    disabled={!canJoinMeeting(selectedMeeting)}
                    onClick={() => void handleJoinMeeting(selectedMeeting)}
                  >
                    입장하기
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 회의 등록과 수정은 같은 폼을 사용해 입력 규칙을 한 곳에서 관리합니다. */}
      {schedulePanelOpen && (
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end bg-slate-950/35">
          <aside className="pointer-events-auto flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold text-blue-700">통합 회의</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {editingMeetingId !== null ? '회의 수정' : '회의 예약'}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {editingMeetingId !== null
                    ? '변경한 회의 정보를 저장합니다.'
                    : '회의 정보를 입력하면 예약된 회의 목록에 반영됩니다.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={closeSchedulePanel}
                className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-5">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4">
                    <FormField
                      label="회의 제목"
                      placeholder="예: 신규 기능 기획 논의"
                      value={scheduleForm.mtngNm}
                      onChange={(e) => handleScheduleFormChange('mtngNm', e.target.value)}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">일정</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="시작 일시"
                      type="datetime-local"
                      value={scheduleForm.beginDt}
                      onChange={(e) => handleScheduleFormChange('beginDt', e.target.value)}
                    />
                    <FormField
                      label="종료 일시"
                      type="datetime-local"
                      value={scheduleForm.endDt}
                      onChange={(e) => handleScheduleFormChange('endDt', e.target.value)}
                    />
                  </div>
                </section>

                <MeetingRoomAvailabilityTimeline
                  rooms={(meetingRooms ?? []).filter((room) => room.useYn === 'Y')}
                  reservations={roomReservations ?? []}
                  beginDt={scheduleForm.beginDt}
                  endDt={scheduleForm.endDt}
                  selectedRoomId={
                    scheduleForm.useMeetingRoom ? scheduleForm.confRmId : null
                  }
                  editingMeetingId={editingMeetingId}
                  loading={roomReservationsLoading}
                  errorMessage={roomReservationsError?.message ?? null}
                  onSelectRoom={(roomId) => {
                    handleScheduleFormChange('useMeetingRoom', true)
                    handleScheduleFormChange('confRmId', roomId)
                    setScheduleValidationMessage('')
                  }}
                />

                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">회의 진행 방식</h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={scheduleForm.useVideoConference}
                        onChange={(event) =>
                          handleScheduleFormChange('useVideoConference', event.target.checked)
                        }
                      />
                      화상회의로 진행
                    </label>
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={scheduleForm.useMeetingRoom}
                        onChange={(event) => {
                          const checked = event.target.checked
                          handleScheduleFormChange('useMeetingRoom', checked)
                          if (!checked) handleScheduleFormChange('confRmId', null)
                        }}
                      />
                      회의실 사용
                    </label>

                    {scheduleForm.useMeetingRoom && (
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-slate-500">회의실</span>
                        <select
                          value={scheduleForm.confRmId ?? ''}
                          onChange={(event) =>
                            handleScheduleFormChange(
                              'confRmId',
                              event.target.value ? Number(event.target.value) : null,
                            )
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                        >
                          <option value="">회의실을 선택하세요</option>
                          {(meetingRooms ?? [])
                            .filter((room) => room.useYn === 'Y')
                            .map((room) => {
                              const unavailable = (roomReservations ?? []).some(
                                (reservation) =>
                                  reservation.roomId === room.roomId &&
                                  reservation.mtngId !== editingMeetingId &&
                                  isReservationOverlapping(
                                    scheduleForm.beginDt,
                                    scheduleForm.endDt,
                                    reservation,
                                  ),
                              )

                              return (
                                <option
                                  key={room.roomId}
                                  value={room.roomId}
                                  disabled={unavailable}
                                >
                                  {room.roomName}
                                  {unavailable ? ' (예약 불가)' : ''}
                                </option>
                              )
                            })}
                        </select>
                      </label>
                    )}
                  </div>
                </section>

                <EmployeeSearchPicker
                  variant="detailed"
                  remoteSearch
                  showDepartmentFilter
                  showAllOnEmpty
                  selectedEmployeeIds={selectedEmployeeIds}
                  onChange={setSelectedEmployeeIds}
                  emptyText="검색된 직원이 없습니다."
                />
              </div>
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-100 px-6 py-5">
              <Button variant="outline" onClick={closeSchedulePanel}>
                취소
              </Button>
              {scheduleValidationMessage && (
                <p className="mr-auto self-center text-sm font-semibold text-red-600">
                  {scheduleValidationMessage}
                </p>
              )}
              <Button
                loading={createConfLoading || updateMeetingLoading}
                onClick={() => void handleSubmitScheduleMeeting()}
              >
                {editingMeetingId !== null ? '수정 저장' : '예약 생성'}
              </Button>
            </footer>
          </aside>
        </div>
      )}
    </PageComponent>
  )
}

export default MeetingPage
