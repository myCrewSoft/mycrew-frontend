import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarPlus,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FileVolume,
  History,
  Link2,
  Pencil,
  Play,
  Save,
  Send,
  Sparkles,
  Trash2,
  Users,
  UserPlus,
  Video,
  X,
} from 'lucide-react'
import { meetingApi } from '../../api/meetingApi'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Button from '../../components/common/button/Button'
import Checkbox from '../../components/common/form/checkbox/Checkbox'
import EmployeeSearchPicker, {
  type EmployeeSearchItem,
} from '../../components/common/employeeSearch/EmployeeSearchPicker'
import FormField from '../../components/common/form/formField/FormField'
import Select from '../../components/common/form/select/Select'
import Textarea from '../../components/common/form/textarea/Textarea'
import Tabs from '../../components/common/tabs/Tabs'
import PageComponent from '../../components/layouts/PageComponent'
import { useApi } from '../../hooks/useApi'
import type {
  CreateScheduledMeetingRequest,
  MeetingListFilter,
  MeetingMinutesRevisionResponse,
  MeetingStatus,
  MeetingSummaryResponse,
} from '../../types/meeting.dto'
import SearchInput from '../../components/common/form/searchInput/SearchInput'

const filterTabs: Array<{ value: MeetingListFilter; label: string }> = [
  { value: 'scheduled', label: '예약된 회의' },
  { value: 'live', label: '진행 중' },
  { value: 'ended', label: '지난 회의' },
]

const employeeOptions: EmployeeSearchItem[] = [
  { id: 1, name: '한재훈', department: '개발팀', position: '사원' },
  { id: 2, name: '정승우', department: '개발팀', position: '대리' },
  { id: 3, name: '오하린', department: '기획팀', position: '과장' },
  { id: 4, name: '김도윤', department: '경영지원팀', position: '팀장' },
  { id: 5, name: '이서연', department: '인사팀', position: '대리' },
  { id: 6, name: '강태오', department: '영업팀', position: '사원' },
]

const meetingRoomOptions = [
  { value: 'LiveKit Connect', label: 'LiveKit Connect' },
  { value: '온라인 회의실', label: '온라인 회의실' },
]

const filterPathMap: Record<MeetingListFilter, string> = {
  scheduled: '/meeting/scheduled',
  live: '/meeting/list',
  ended: '/meeting/history',
}

const getFilterFromPath = (pathname: string): MeetingListFilter => {
  if (pathname.includes('/minutes')) return 'ended'
  if (pathname.includes('/history')) return 'ended'
  if (pathname.includes('/list')) return 'live'
  return 'scheduled'
}

const statusLabelMap: Record<MeetingStatus, string> = {
  scheduled: '예약됨',
  live: '진행 중',
  ended: '종료',
  cancelled: '취소됨',
}

const statusBadgeVariantMap: Record<
  MeetingStatus,
  'primary' | 'success' | 'neutral' | 'danger' | 'outline'
> = {
  scheduled: 'neutral',
  live: 'success',
  ended: 'outline',
  cancelled: 'danger',
}

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

const setTime = (date: Date, hour: number, minute: number) => {
  const nextDate = new Date(date)
  nextDate.setHours(hour, minute, 0, 0)
  return nextDate
}

const formatTime = (dateTime?: string) => {
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

const formatDateTime = (dateTime?: string) => {
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

const getMeetingDateKey = (meeting: MeetingSummaryResponse) =>
  toDateKey(new Date(meeting.startDateTime))

const createFallbackMeetings = (): MeetingSummaryResponse[] => {
  const today = new Date()
  const tomorrow = addDays(today, 1)
  const yesterday = addDays(today, -1)

  // 백엔드 연결 전에도 화면 흐름을 확인할 수 있도록 만든 목업 데이터입니다.
  // 실제 API가 성공하면 useApi의 data가 이 배열을 백엔드 응답으로 교체합니다.
  return [
    {
      meetingId: 1001,
      title: 'Q2 개발팀 스프린트 리뷰',
      description:
        '이번 분기 개발팀 스프린트 진행 상황을 공유하고, 다음 배포 범위와 담당자를 정리합니다.',
      meetingRoomName: 'LiveKit Connect',
      creatorId: 1,
      creatorName: '한재훈',
      status: 'live',
      startDateTime: setTime(today, 14, 0).toISOString(),
      endDateTime: setTime(today, 15, 0).toISOString(),
      participantCount: 6,
      participants: [
        { memberId: 1, name: '한재훈', departmentName: '개발팀', positionName: '사원' },
        { memberId: 2, name: '정승우', departmentName: '개발팀', positionName: '대리' },
        { memberId: 3, name: '오하린', departmentName: '기획팀', positionName: '과장' },
      ],
      inviteUrl: '/meeting/1001/join',
      joinAvailable: true,
      minutesStatus: '수정 중',
    },
    {
      meetingId: 1002,
      title: '신규 기능 기획 논의',
      description:
        '신규 기능 우선순위를 정하고 UI 프로토타입 검토 범위를 확정합니다.',
      meetingRoomName: 'LiveKit Connect',
      creatorId: 2,
      creatorName: '기획팀',
      status: 'scheduled',
      startDateTime: setTime(today, 16, 30).toISOString(),
      endDateTime: setTime(today, 17, 30).toISOString(),
      participantCount: 4,
      participants: [
        { memberId: 4, name: '정승우', departmentName: '기획팀', positionName: '대리' },
        { memberId: 5, name: '오하린', departmentName: '개발팀', positionName: '사원' },
      ],
      joinAvailable: false,
      minutesStatus: '생성 중',
    },
    {
      meetingId: 1003,
      title: '월간 전사 회의',
      description:
        '월간 주요 성과와 다음 달 운영 계획을 전사 구성원에게 공유합니다.',
      meetingRoomName: '온라인 회의실',
      creatorId: 3,
      creatorName: '경영지원팀',
      status: 'scheduled',
      startDateTime: setTime(tomorrow, 10, 0).toISOString(),
      endDateTime: setTime(tomorrow, 11, 0).toISOString(),
      participantCount: 12,
      participants: [
        { memberId: 6, name: '김도윤', departmentName: '경영지원팀', positionName: '팀장' },
        { memberId: 7, name: '이서연', departmentName: '영업팀', positionName: '과장' },
      ],
      joinAvailable: false,
      minutesStatus: '생성 중',
    },
    {
      meetingId: 1004,
      title: '인사팀 면접 조율 미팅',
      description:
        '지원자 면접 일정을 조율하고 참석자별 인터뷰 역할을 배정합니다.',
      meetingRoomName: '온라인 회의실',
      creatorId: 4,
      creatorName: '인사팀',
      status: 'scheduled',
      startDateTime: setTime(tomorrow, 14, 0).toISOString(),
      endDateTime: setTime(tomorrow, 14, 30).toISOString(),
      participantCount: 3,
      participants: [
        { memberId: 8, name: '문하린', departmentName: '인사팀', positionName: '대리' },
        { memberId: 9, name: '강태오', departmentName: '개발팀', positionName: '사원' },
      ],
      joinAvailable: false,
      minutesStatus: '생성 중',
    },
    {
      meetingId: 1005,
      title: '온보딩 개선 회고',
      description:
        '신규 입사자 온보딩 과정에서 수집한 피드백을 검토하고 개선 항목을 정리합니다.',
      meetingRoomName: 'LiveKit Connect',
      creatorId: 5,
      creatorName: '교육팀',
      status: 'ended',
      startDateTime: setTime(yesterday, 11, 0).toISOString(),
      endDateTime: setTime(yesterday, 11, 50).toISOString(),
      participantCount: 5,
      participants: [
        { memberId: 10, name: '윤서아', departmentName: '교육팀', positionName: '과장' },
        { memberId: 11, name: '배지호', departmentName: '인사팀', positionName: '대리' },
      ],
      joinAvailable: false,
      transcriptStatus: '생성 완료',
      transcriptId: 701,
      transcriptDownloadUrl: '/meeting/1005/transcript/download',
      minutesStatus: '승인 됨',
      minutesId: 501,
    },
  ]
}

const groupMeetingsByDate = (meetings: MeetingSummaryResponse[]) =>
  meetings.reduce<Record<string, MeetingSummaryResponse[]>>((groups, meeting) => {
    const dateKey = getMeetingDateKey(meeting)
    return {
      ...groups,
      [dateKey]: [...(groups[dateKey] ?? []), meeting],
    }
  }, {})

const getTranscriptLabel = (meeting: MeetingSummaryResponse) => {
  // 진행 전 회의는 아직 음성 데이터가 없으므로 녹취록 대상이 아닙니다.
  if (meeting.status === 'scheduled') return '회의 종료 후 생성'

  return meeting.transcriptStatus ?? '생성 중'
}

const getInitial = (name: string) => name.trim().charAt(0) || '?'

const createMinutesDraft = (meeting: MeetingSummaryResponse) => `안건 1. ${meeting.title}
- 주요 논의 내용을 정리합니다.
- 담당자별 후속 작업을 확인합니다.
- 일정과 공유 범위를 확정합니다.

결정 사항
- 회의 종료 후 녹취록을 기반으로 회의록 초안을 보정합니다.
- 참석자 검토 후 결재 요청을 발송합니다.`

const createMinutesRevisions = (
  meeting: MeetingSummaryResponse,
  currentContent: string,
): MeetingMinutesRevisionResponse[] => {
  const minutesId = meeting.minutesId ?? meeting.meetingId

  // 백엔드 연동 전에는 화면 흐름을 확인하기 위한 샘플 이력을 만듭니다.
  // 실제 API에서는 revisionId, version, content, modifiedByName, modifiedAt을 그대로 내려주면 됩니다.
  return [
    {
      revisionId: minutesId * 10 + 3,
      minutesId,
      version: 3,
      content: currentContent,
      modifiedByName: meeting.creatorName,
      modifiedAt: new Date().toISOString(),
      changeMemo: '결정 사항과 액션 아이템을 보완했습니다.',
    },
    {
      revisionId: minutesId * 10 + 2,
      minutesId,
      version: 2,
      content: `${currentContent}\n\n수정 전 메모\n- 참석자 의견을 추가로 정리하기 전 버전입니다.`,
      modifiedByName: '김지수',
      modifiedAt: addDays(new Date(), -1).toISOString(),
      changeMemo: '참석자 발언 요약을 추가했습니다.',
    },
    {
      revisionId: minutesId * 10 + 1,
      minutesId,
      version: 1,
      content: `초안\n- ${meeting.title} 회의가 종료된 뒤 자동 생성된 최초 회의록입니다.\n- 검토 전 내용이므로 담당자 확인이 필요합니다.`,
      modifiedByName: 'AI 회의록',
      modifiedAt: addDays(new Date(), -2).toISOString(),
      changeMemo: 'AI가 생성한 최초 초안입니다.',
    },
  ]
}

const approvalSteps = [
  { id: 1, name: '박범준', role: '담당자', status: '완료' },
  { id: 2, name: '김지수', role: '개발팀', status: '대기중' },
  { id: 3, name: '이민호', role: '개발팀', status: '미열람' },
  { id: 4, name: '최수연', role: '개발팀', status: '미열람' },
]

const createDefaultScheduleForm = (): CreateScheduledMeetingRequest => {
  const tomorrow = addDays(new Date(), 1)

  return {
    title: '',
    description: '',
    meetingRoomName: 'LiveKit Connect',
    startDateTime: `${toDateKey(tomorrow)}T10:00`,
    endDateTime: `${toDateKey(tomorrow)}T11:00`,
    participantIds: [],
    minutesEnabled: true,
    transcriptEnabled: true,
  }
}

const MeetingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const fallbackMeetings = useMemo(() => createFallbackMeetings(), [])
  // 선택된 탭은 URL 경로에서 바로 계산합니다.
  // 예: /meeting/scheduled => 예약된 회의, /meeting/history => 지난 회의
  // 이렇게 하면 URL과 탭 상태가 따로 놀지 않고, effect에서 setState를 호출할 필요도 없습니다.
  const selectedFilter = useMemo(
    () => getFilterFromPath(location.pathname),
    [location.pathname],
  )
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingSummaryResponse | null>(null)
  const [selectedMinutesMeeting, setSelectedMinutesMeeting] =
    useState<MeetingSummaryResponse | null>(null)
  const [selectedMinutesRevision, setSelectedMinutesRevision] =
    useState<MeetingMinutesRevisionResponse | null>(null)
  const [meetingSearchKeyword, setMeetingSearchKeyword] = useState('')
  const [meetingDateFrom, setMeetingDateFrom] = useState('')
  const [meetingDateTo, setMeetingDateTo] = useState('')
  const [minutesContent, setMinutesContent] = useState('')
  const [minutesEditing, setMinutesEditing] = useState(false)
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState<CreateScheduledMeetingRequest>(
    createDefaultScheduleForm,
  )
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    Array<string | number>
  >([])

  const {
    data: meetings,
    execute: fetchMeetings,
  } = useApi<MeetingSummaryResponse[], [{ status: MeetingListFilter }]>(
    meetingApi.getMeetings,
    {
      immediate: false,
      initialData: fallbackMeetings,
    },
  )

  const { loading: instantMeetingLoading, execute: createInstantMeeting } =
    useApi(meetingApi.createInstantMeeting, { immediate: false })
  const { loading: scheduleMeetingLoading, execute: createScheduledMeeting } =
    useApi(meetingApi.createScheduledMeeting, { immediate: false })

  useEffect(() => {
    void fetchMeetings({ status: selectedFilter }).catch(() => {
      // 백엔드가 아직 없을 때도 포트폴리오 화면을 확인할 수 있도록 fallback 데이터를 유지합니다.
    })
  }, [fetchMeetings, selectedFilter])

  const meetingList = meetings ?? fallbackMeetings
  const normalizedMeetingSearchKeyword = meetingSearchKeyword
    .trim()
    .toLowerCase()
  const filteredMeetings = meetingList
    .filter((meeting) => meeting.status === selectedFilter)
    .filter((meeting) => {
      if (!normalizedMeetingSearchKeyword) return true

      // 제목, 생성자, 회의실 이름을 한 번에 검색합니다.
      // 백엔드 검색 API가 생기면 이 조건은 query parameter로 넘기는 방식으로 바꿀 수 있습니다.
      return [
        meeting.title,
        meeting.creatorName,
        meeting.meetingRoomName,
      ].some((value) =>
        value?.toLowerCase().includes(normalizedMeetingSearchKeyword),
      )
    })
    .filter((meeting) => {
      const meetingDateKey = getMeetingDateKey(meeting)

      if (meetingDateFrom && meetingDateKey < meetingDateFrom) return false
      if (meetingDateTo && meetingDateKey > meetingDateTo) return false

      return true
    })
    .sort(
      (first, second) =>
        new Date(first.startDateTime).getTime() -
        new Date(second.startDateTime).getTime(),
    )
  const groupedMeetings = groupMeetingsByDate(filteredMeetings)
  const dateKeys = Object.keys(groupedMeetings).sort()

  const tabsWithCount = filterTabs.map((tab) => ({
    ...tab,
    count: meetingList.filter((meeting) => meeting.status === tab.value).length,
  }))

  const hasMeetingFilter =
    Boolean(meetingSearchKeyword.trim()) || Boolean(meetingDateFrom) || Boolean(meetingDateTo)

  const resetMeetingFilters = () => {
    setMeetingSearchKeyword('')
    setMeetingDateFrom('')
    setMeetingDateTo('')
  }

  const handleStartInstantMeeting = useCallback(async () => {
    try {
      const response = await createInstantMeeting({
        title: '즉시 화상회의',
        participantIds: [],
      })

      // 백엔드에서 inviteUrl을 내려주면 생성 직후 바로 회의방으로 이동합니다.
      if (response.data?.inviteUrl) {
        window.location.assign(response.data.inviteUrl)
      }
    } catch {
      // API 구현 전에는 화면 동작을 막지 않습니다. 백엔드 연결 후에는 토스트로 바꾸면 좋습니다.
    }
  }, [createInstantMeeting])

  const handleReserveMeeting = () => {
    setSchedulePanelOpen(true)
  }

  const handleDownloadTranscript = (meeting: MeetingSummaryResponse) => {
    // 백엔드가 실제 다운로드 URL을 내려주면 그 주소를 우선 사용합니다.
    // 없을 때는 REST 규칙에 맞춘 기본 경로로 이동하게 두어 API 연결 지점을 명확히 합니다.
    window.location.assign(
      meeting.transcriptDownloadUrl ??
        `/api/v1/meetings/${meeting.meetingId}/transcript/download`,
    )
  }

  const handlePrimaryMeetingAction = (meeting: MeetingSummaryResponse) => {
    const canJoin = meeting.joinAvailable ?? meeting.status === 'live'

    if (meeting.inviteUrl && canJoin) {
      window.location.assign(meeting.inviteUrl)
      return
    }

    // 지금은 목록 DTO로 상세 모달을 열고,
    // 나중에 상세 API가 생기면 meetingApi.getMeeting(meeting.meetingId)로 교체하면 됩니다.
    setSelectedMeeting(meeting)
  }

  const openMinutesWorkspace = useCallback((meeting: MeetingSummaryResponse) => {
    // 현재는 목록 DTO로 회의록 작업 화면을 구성합니다.
    // 백엔드 상세 회의록 API가 준비되면 이 진입점에서 조회 API를 호출하면 됩니다.
    setSelectedMeeting(null)
    setSelectedMinutesMeeting(meeting)
    setSelectedMinutesRevision(null)
    setMinutesContent(createMinutesDraft(meeting))
    setMinutesEditing(false)
  }, [])

  const closeMinutesWorkspace = () => {
    setSelectedMinutesMeeting(null)
    setSelectedMinutesRevision(null)
    setMinutesEditing(false)
  }

  const closeSchedulePanel = () => {
    setSchedulePanelOpen(false)
  }

  const handleScheduleFormChange = (
    field: keyof CreateScheduledMeetingRequest,
    value: string | boolean,
  ) => {
    setScheduleForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmitScheduleMeeting = async () => {
    const participantIds = selectedEmployeeIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))

    await createScheduledMeeting({
      ...scheduleForm,
      participantIds,
    })

    setSchedulePanelOpen(false)
    setScheduleForm(createDefaultScheduleForm())
    setSelectedEmployeeIds([])
    navigate('/meeting/scheduled')
    await fetchMeetings({ status: 'scheduled' })
  }

  useEffect(() => {
    const action = new URLSearchParams(location.search).get('action')
    const detailMeetingId = Number(
      new URLSearchParams(location.search).get('detailMeetingId'),
    )
    const minutesMeetingId = Number(
      new URLSearchParams(location.search).get('minutesMeetingId'),
    )

    if (action === 'reserve') {
      queueMicrotask(() => {
        setSchedulePanelOpen(true)
        navigate(location.pathname, { replace: true })
      })
    }

    if (action === 'instant') {
      queueMicrotask(() => {
        void handleStartInstantMeeting()
        navigate(location.pathname, { replace: true })
      })
    }

    if (Number.isFinite(detailMeetingId)) {
      const targetMeeting = meetingList.find(
        (meeting) => meeting.meetingId === detailMeetingId,
      )

      if (targetMeeting) {
        queueMicrotask(() => {
          setSelectedMinutesMeeting(null)
          setSelectedMeeting(targetMeeting)
          navigate(location.pathname, { replace: true })
        })
      }
    }

    if (Number.isFinite(minutesMeetingId)) {
      const targetMeeting = meetingList.find(
        (meeting) => meeting.meetingId === minutesMeetingId,
      )

      if (targetMeeting) {
        queueMicrotask(() => {
          setSelectedMeeting(null)
          openMinutesWorkspace(targetMeeting)
          navigate(location.pathname, { replace: true })
        })
      }
    }
  }, [
    handleStartInstantMeeting,
    location.pathname,
    location.search,
    meetingList,
    navigate,
    openMinutesWorkspace,
  ])

  if (selectedMinutesMeeting) {
    // 결재가 시작되기 전에는 진행률보다 "요청 준비" 화면을 보여주는 편이 자연스럽습니다.
    // 백엔드에서 minutesStatus를 내려주면 이 값만 바뀌어도 결재 전/진행 중 UI가 자동으로 갈립니다.
    const approvalStarted =
      selectedMinutesMeeting.minutesStatus === '결재 중' ||
      selectedMinutesMeeting.minutesStatus === '승인 됨'
    // 회의록 결재자는 별도 결재선이 아니라 회의 참여자 전체입니다.
    // 상세 API에서 participants를 내려주면 그 값을 쓰고, 샘플 데이터가 부족한 경우만 임시 목록을 사용합니다.
    const approvalMembers = selectedMinutesMeeting.participants?.length
      ? selectedMinutesMeeting.participants.map((participant) => ({
          id: participant.memberId,
          name: participant.name,
          role: participant.departmentName ?? '회의 참여자',
          status: '미결재',
        }))
      : approvalSteps.map((step) => ({
          id: step.id,
          name: step.name,
          role: step.role,
          status: step.status,
        }))
    const completedApprovalCount = approvalMembers.filter(
      (member) => member.status === '완료',
    ).length
    const minutesRevisions = createMinutesRevisions(
      selectedMinutesMeeting,
      minutesContent,
    )

    return (
      <PageComponent
        title={selectedMinutesMeeting.title}
        description="AI 초안을 검토하고 수정한 뒤 참석자 결재를 요청합니다."
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={closeMinutesWorkspace}
          >
            목록으로
          </Button>
        }
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-blue-100 bg-blue-50/80 px-5 py-4">
              <p className="flex items-center gap-2 text-sm font-bold text-blue-800">
                <CheckCircle2 size={18} />
                AI 회의록이 생성되었습니다. 검토 후 결재 요청을 보낼 수 있습니다.
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                      <FileText size={17} />
                    </span>
                    <h2 className="text-base font-bold text-slate-950">
                      회의 정보
                    </h2>
                    <Badge variant="primary">AI 초안</Badge>
                  </div>
                  <dl className="mt-5 grid gap-2 text-sm font-semibold text-slate-600 md:grid-cols-4">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <dt>일시</dt>
                      <dd className="mt-1 text-slate-950">
                        {formatDateTime(selectedMinutesMeeting.startDateTime)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <dt>참여자</dt>
                      <dd className="mt-1 text-slate-950">
                        {selectedMinutesMeeting.participantCount}명
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <dt>담당자</dt>
                      <dd className="mt-1 text-slate-950">
                        {selectedMinutesMeeting.creatorName}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <dt>녹취록</dt>
                      <dd className="mt-1 text-emerald-700">
                        {getTranscriptLabel(selectedMinutesMeeting)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
                  <FileText size={18} />
                  회의 내용
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={minutesEditing ? <Save size={15} /> : <Pencil size={15} />}
                  onClick={() => setMinutesEditing((current) => !current)}
                >
                  {minutesEditing ? '저장' : '수정'}
                </Button>
              </div>

              {minutesEditing ? (
                <Textarea
                  value={minutesContent}
                  onChange={(event) => setMinutesContent(event.target.value)}
                  className="min-h-72"
                />
              ) : (
                <div className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50/80 px-5 py-4 text-sm font-semibold leading-7 text-slate-700">
                  {minutesContent}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
                <CheckCircle2 size={18} />
                액션 아이템
              </h3>
              <div className="mt-4 flex flex-col gap-2">
                {[
                  {
                    name: '박범준',
                    department: '개발팀',
                    position: '대리',
                    task: '결재 API 연동 마무리',
                    date: '6/7',
                  },
                  {
                    name: '김지수',
                    department: '개발팀',
                    position: '사원',
                    task: 'WebSocket 알림 설정 완료',
                    date: '6/7',
                  },
                  {
                    name: '이민호',
                    department: 'QA팀',
                    position: '과장',
                    task: '잔여 버그 우선순위 정리',
                    date: '6/5',
                  },
                ].map((actionItem) => (
                  <div
                    key={`${actionItem.name}-${actionItem.task}`}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {actionItem.name}
                        </span>
                        <Badge variant="outline">
                          {actionItem.department} · {actionItem.position}
                        </Badge>
                        <Badge variant="neutral">{actionItem.date}</Badge>
                      </div>
                      <p className="mt-1 truncate text-slate-700">
                        {actionItem.task}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<CalendarPlus size={15} />}
                      className="w-full sm:w-auto"
                    >
                      일정 추가
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex h-fit flex-col gap-4 xl:sticky xl:top-6">
            <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {approvalStarted ? (
              <>
            <h3 className="text-base font-bold text-slate-950">참여자 결재 현황</h3>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${approvalMembers.length ? (completedApprovalCount / approvalMembers.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm font-bold text-slate-500">
              {completedApprovalCount} / {approvalMembers.length}명 결재 완료
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {approvalMembers.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {getInitial(step.name)}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {step.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {step.role}
                      </span>
                    </span>
                  </div>
                  <Badge
                    variant={step.status === '완료' ? 'success' : 'neutral'}
                  >
                    {step.status}
                  </Badge>
                </div>
              ))}
            </div>

              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-950">
                    참여자 결재 준비
                  </h3>
                  <Badge variant="warning">요청 전</Badge>
                </div>

                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
                  <p className="text-sm font-bold text-blue-800">
                    회의록 검토가 끝나면 참여자에게 결재 요청을 보낼 수 있습니다.
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-blue-700">
                    요청 전에는 참여자에게 알림이 가지 않고, 요청 후에는 순서 없이 각자 결재할 수 있습니다.
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-500">
                    결재 요청 대상 참여자
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {approvalMembers.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {getInitial(step.name)}
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-slate-900">
                              {step.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {step.role}
                            </span>
                          </span>
                        </div>
                        <Badge variant="outline">참여자 결재</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5">
              <Button
                variant="outline"
                leftIcon={<Pencil size={16} />}
                onClick={() => setMinutesEditing(true)}
              >
                회의록 수정
              </Button>
              <Button leftIcon={<Send size={16} />}>
                결재 요청 발송
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download size={16} />}
                onClick={() => handleDownloadTranscript(selectedMinutesMeeting)}
              >
                녹취록 다운로드
              </Button>
            </div>
            </aside>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  <History size={16} />
                  수정 이력
                </h3>
                <Badge variant="outline">{minutesRevisions.length}개 버전</Badge>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {minutesRevisions.map((revision) => (
                  <div
                    key={revision.revisionId}
                    className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              revision.version === 3 ? 'primary' : 'outline'
                            }
                          >
                            v{revision.version}
                          </Badge>
                          <span className="truncate text-sm font-bold text-slate-900">
                            {revision.modifiedByName}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {formatDateTime(revision.modifiedAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={`v${revision.version} 내용 보기`}
                        onClick={() => setSelectedMinutesRevision(revision)}
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {selectedMinutesRevision && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
            <section className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <button
                type="button"
                aria-label="수정 이력 닫기"
                onClick={() => setSelectedMinutesRevision(null)}
                className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={20} />
              </button>

              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex flex-wrap items-center gap-2 pr-10">
                  <Badge variant="primary">
                    v{selectedMinutesRevision.version}
                  </Badge>
                  <h3 className="text-lg font-bold text-slate-950">
                    회의록 수정 이력
                  </h3>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {selectedMinutesRevision.modifiedByName} ·{' '}
                  {formatDateTime(selectedMinutesRevision.modifiedAt)}
                </p>
                {selectedMinutesRevision.changeMemo && (
                  <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-sm font-bold text-blue-800">
                    {selectedMinutesRevision.changeMemo}
                  </p>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                <div className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50/80 px-5 py-4 text-sm font-semibold leading-7 text-slate-700">
                  {selectedMinutesRevision.content}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMinutesRevision(null)}
                >
                  닫기
                </Button>
              </div>
            </section>
          </div>
        )}
      </PageComponent>
    )
  }

  return (
    <PageComponent
      title="화상회의"
      description="예정된 회의, 진행 중인 회의, 지난 회의 기록을 한 곳에서 확인합니다."
    >
    <div className="flex w-full flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-blue-100 bg-blue-50/70 p-6">
          <div className="flex h-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                <Sparkles size={22} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-950">
                  지금 바로 회의 시작
                </h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  링크를 생성하고 팀원을 즉시 초대하세요.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              loading={instantMeetingLoading}
              leftIcon={<Play size={16} />}
              onClick={handleStartInstantMeeting}
              className="w-full md:w-auto"
            >
              바로 시작
            </Button>
          </div>
        </article>

        <article className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
          <div className="flex h-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                <CalendarPlus size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-950">
                  회의 예약
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  시간과 참여자를 정해 미리 회의를 준비하세요.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              leftIcon={<CalendarClock size={16} />}
              onClick={handleReserveMeeting}
              className="w-full md:w-auto"
            >
              예약하기
            </Button>
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
          <Tabs
            items={tabsWithCount}
            value={selectedFilter}
            onChange={(value) => {
              const nextFilter = value as MeetingListFilter
              navigate(filterPathMap[nextFilter])
            }}
          />
          
          <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 lg:grid-cols-[minmax(260px,1fr)_170px_170px_auto] lg:items-end">
            <SearchInput
              placeholder="화상회의 검색"
              value={meetingSearchKeyword}
              onChange={(event) => setMeetingSearchKeyword(event.target.value)}
              wrapperClassName="w-full"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500">시작일</span>
              <input
                type="date"
                value={meetingDateFrom}
                onChange={(event) => setMeetingDateFrom(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-400"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500">종료일</span>
              <input
                type="date"
                value={meetingDateTo}
                onChange={(event) => setMeetingDateTo(event.target.value)}
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
        </div>

        {dateKeys.length === 0 ? (
          <EmptyState
            title="조회된 회의가 없습니다."
            description="백엔드에서 회의 데이터가 내려오면 이 영역에 날짜별 목록으로 표시됩니다."
          />
        ) : (
          dateKeys.map((dateKey) => (
            <section key={dateKey} className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-600">
                {formatDateTitle(dateKey)}
              </h2>

              {groupedMeetings[dateKey].map((meeting) => {
                const canJoin = meeting.joinAvailable ?? meeting.status === 'live'
                const actionLabel = canJoin ? '회의 입장' : '상세 보기'

                return (
                  <article
                    key={meeting.meetingId}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:border-blue-200 hover:bg-white"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-bold text-slate-950">
                              {meeting.title}
                            </h3>
                            <Badge variant={statusBadgeVariantMap[meeting.status]}>
                              {statusLabelMap[meeting.status]}
                            </Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={16} />
                              {formatTime(meeting.startDateTime)}
                              {meeting.endDateTime
                                ? ` - ${formatTime(meeting.endDateTime)}`
                                : ''}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={16} />
                              참여자 {meeting.participantCount}명
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock size={16} />
                              생성자 {meeting.creatorName}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant={canJoin ? 'primary' : 'outline'}
                          leftIcon={
                            canJoin ? (
                              <Video size={16} />
                            ) : (
                              <FileText size={16} />
                            )
                          }
                          className="w-full lg:w-32"
                          onClick={() => handlePrimaryMeetingAction(meeting)}
                        >
                          {actionLabel}
                        </Button>
                      </div>

                      <div className="grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <UserPlus size={14} />
                            참여 정보
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {meeting.participantCount}명 참여 예정
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openMinutesWorkspace(meeting)}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-100"
                        >
                          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <FileText size={14} />
                            회의록
                          </p>
                          <p className="mt-1 text-sm font-bold text-blue-700">
                            {meeting.minutesStatus ?? '생성 중'}
                          </p>
                        </button>

                        <div className="relative rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <FileVolume size={14} />
                            녹취록
                          </p>
                          <div className="mt-1 flex items-start justify-between gap-3 pr-9">
                            <p className="text-sm font-bold text-emerald-700">
                              {getTranscriptLabel(meeting)}
                            </p>

                            {meeting.transcriptStatus === '생성 완료' && (
                              <button
                                type="button"
                                aria-label="녹취록 다운로드"
                                onClick={() => handleDownloadTranscript(meeting)}
                                className="absolute right-4 top-3 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                              >
                                <Download size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>
          ))
        )}

        <Button
          variant="outline"
          size="icon"
          aria-label="더 보기"
          className="mx-auto"
          leftIcon={<ChevronDown size={16} />}
        />
      </section>
    </div>

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
            <Badge variant={statusBadgeVariantMap[selectedMeeting.status]}>
              {statusLabelMap[selectedMeeting.status]}
            </Badge>

            <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-950">
              {selectedMeeting.title}
            </h2>

            <div className="mt-6 flex flex-col gap-3 text-sm font-bold text-slate-600">
              <p className="flex items-center gap-3">
                <CalendarClock size={20} className="text-blue-700" />
                {formatDateTime(selectedMeeting.startDateTime)}
                {selectedMeeting.endDateTime
                  ? ` - ${formatTime(selectedMeeting.endDateTime)}`
                  : ''}
              </p>

              <p className="flex items-center gap-3">
                <Link2 size={20} className="text-blue-700" />
                {selectedMeeting.meetingRoomName ?? '온라인 회의실'}
                {selectedMeeting.inviteUrl && (
                  <span className="text-blue-700 underline underline-offset-2">
                    / LiveKit Connect
                  </span>
                )}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-500">안건 및 설명</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {selectedMeeting.description ??
                  '상세 API에서 회의 안건과 설명이 내려오면 이 영역에 표시됩니다.'}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold text-slate-500">
                참여자 ({selectedMeeting.participantCount}명)
              </h3>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {(selectedMeeting.participants ?? []).slice(0, 4).map((participant) => (
                    <div
                      key={participant.memberId}
                      title={participant.name}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-blue-100 text-sm font-bold text-blue-800 shadow-sm"
                    >
                      {getInitial(participant.name)}
                    </div>
                  ))}
                </div>

                <p className="text-sm font-bold text-slate-600">
                  {selectedMeeting.participants?.length
                    ? `${selectedMeeting.participants[0].name} 외 ${
                        selectedMeeting.participantCount - 1
                      }명`
                    : `${selectedMeeting.participantCount}명 참여 예정`}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openMinutesWorkspace(selectedMeeting)}
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100"
              >
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <FileText size={14} />
                  회의록
                </p>
                <p className="mt-1 text-sm font-bold text-blue-700">
                  {selectedMeeting.minutesStatus ?? '생성 중'}
                </p>
              </button>

              <div className="relative rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <FileVolume size={14} />
                  녹취록
                </p>
                <p className="mt-1 pr-9 text-sm font-bold text-emerald-700">
                  {getTranscriptLabel(selectedMeeting)}
                </p>

                {selectedMeeting.transcriptStatus === '생성 완료' && (
                  <button
                    type="button"
                    aria-label="녹취록 다운로드"
                    onClick={() => handleDownloadTranscript(selectedMeeting)}
                    className="absolute right-4 top-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-8 py-5">
            <div className="flex items-center gap-3 text-slate-500">
              <button
                type="button"
                aria-label="회의 수정"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Pencil size={19} />
              </button>
              <button
                type="button"
                aria-label="회의 삭제"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={19} />
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedMeeting(null)}>
                닫기
              </Button>
              <Button
                disabled={!selectedMeeting.joinAvailable}
                onClick={() => {
                  if (selectedMeeting.inviteUrl && selectedMeeting.joinAvailable) {
                    window.location.assign(selectedMeeting.inviteUrl)
                  }
                }}
              >
                입장하기
              </Button>
            </div>
          </div>
        </section>
      </div>
    )}

    {schedulePanelOpen && (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
        <button
          type="button"
          aria-label="예약 패널 닫기"
          className="hidden flex-1 cursor-default md:block"
          onClick={closeSchedulePanel}
        />

        <aside className="flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-xs font-bold text-blue-700">화상회의</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                회의 예약
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                회의 정보를 입력하면 예약된 회의 목록에 반영됩니다.
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
                    value={scheduleForm.title}
                    onChange={(event) =>
                      handleScheduleFormChange('title', event.target.value)
                    }
                  />

                  <Select
                    label="회의실"
                    options={meetingRoomOptions}
                    value={scheduleForm.meetingRoomName}
                    onChange={(event) =>
                      handleScheduleFormChange(
                        'meetingRoomName',
                        event.target.value,
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-sm font-bold text-slate-900">
                  일정
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="시작 일시"
                  type="datetime-local"
                  value={scheduleForm.startDateTime}
                  onChange={(event) =>
                    handleScheduleFormChange('startDateTime', event.target.value)
                  }
                />

                <FormField
                  label="종료 일시"
                  type="datetime-local"
                  value={scheduleForm.endDateTime}
                  onChange={(event) =>
                    handleScheduleFormChange('endDateTime', event.target.value)
                  }
                />
              </div>
              </section>

              <EmployeeSearchPicker
                variant="detailed"
                employees={employeeOptions}
                departments={['개발팀', '기획팀', '경영지원팀', '인사팀', '영업팀']}
                selectedEmployeeIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                emptyText="검색된 직원이 없습니다."
              />

              <Textarea
                label="안건 및 설명"
                placeholder="회의 목적, 논의할 내용, 준비 자료 등을 입력하세요."
                value={scheduleForm.description}
                onChange={(event) =>
                  handleScheduleFormChange('description', event.target.value)
                }
              />

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  자동 생성
                </h3>
                <div className="flex flex-col gap-3">
                  <Checkbox
                    label="회의록 자동 생성"
                    helperText="회의 종료 후 AI 회의록 초안을 생성합니다."
                    checked={Boolean(scheduleForm.minutesEnabled)}
                    onChange={(event) =>
                      handleScheduleFormChange(
                        'minutesEnabled',
                        event.target.checked,
                      )
                    }
                  />
                  <Checkbox
                    label="녹취록 자동 생성"
                    helperText="회의 종료 후 음성 기반 녹취록을 생성합니다."
                    checked={Boolean(scheduleForm.transcriptEnabled)}
                    onChange={(event) =>
                      handleScheduleFormChange(
                        'transcriptEnabled',
                        event.target.checked,
                      )
                    }
                  />
                </div>
              </section>
            </div>
          </div>

          <footer className="flex justify-end gap-2 border-t border-slate-100 px-6 py-5">
            <Button variant="outline" onClick={closeSchedulePanel}>
              취소
            </Button>
            <Button
              loading={scheduleMeetingLoading}
              disabled={!scheduleForm.title.trim()}
              onClick={() => {
                void handleSubmitScheduleMeeting()
              }}
            >
              예약 생성
            </Button>
          </footer>
        </aside>
      </div>
    )}
    </PageComponent>
  )
}

export default MeetingPage
