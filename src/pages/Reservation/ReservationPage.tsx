import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import Modal from '../../components/common/overlay/modal/Modal'
import PageComponent from '../../components/layouts/PageComponent'
import { meetingRoomReservationApi } from '../../api/ReservationApi'
import { useApi } from '../../hooks/useApi'
import type { ReservationCreateRequest, ReservationResponse } from '../../types'
import { formatDateKey } from '../../utils/date'
import {
  SLOT_WIDTH,
  getClickedStartDateTime,
  getReservationLeftPercent,
  getReservationWidthPercent,
  timelineHours,
} from '../../utils/reservationTimeline'
import { useReservation } from './ReservationContext'
import ReservationCreateModal from './ReservationCreateModal'
import ReservationLegend from './reservationLegend'

const RESERVATION_RANGE_DAYS = 15

const addMinutesToDateTime = (dateTime: string, minutes: number) => {
  const date = new Date(dateTime)
  date.setMinutes(date.getMinutes() + minutes)

  return `${formatDateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}:00`
}

const getReservationRange = (dateKey: string) => {
  const begin = new Date(dateKey)
  begin.setDate(begin.getDate() - RESERVATION_RANGE_DAYS)

  const end = new Date(dateKey)
  end.setDate(end.getDate() + RESERVATION_RANGE_DAYS)

  return {
    begin: formatDateKey(begin),
    end: formatDateKey(end),
  }
}

const isReservationVisibleOnDate = (
  reservation: ReservationResponse,
  dateKey: string,
) => {
  const startDateKey = reservation.startDateTime.slice(0, 10)
  const endDateKey = reservation.endDateTime.slice(0, 10)

  return startDateKey <= dateKey && endDateKey >= dateKey
}

const getReservationBlockStyle = (
  reservation: ReservationResponse,
): CSSProperties => {
  if (reservation.intgRsrvYn === 'Y') {
    return { left: '0%', width: '100%' }
  }

  return {
    left: `${getReservationLeftPercent(reservation.startDateTime)}%`,
    width: `${getReservationWidthPercent(
      reservation.startDateTime,
      reservation.endDateTime,
    )}%`,
  }
}

const formatReservationDateTime = (dateTime: string) => {
  const date = new Date(dateTime)

  if (Number.isNaN(date.getTime())) {
    return dateTime.replace('T', ' ').slice(0, 16)
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const ReservationPage = () => {
  const {
    selectedDate,
    setSelectedDate,
    rooms,
    checkedRoomIds,
    roomsLoading,
    roomsErrorMessage,
  } = useReservation()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationResponse | null>(null)

  const [formValues, setFormValues] = useState<ReservationCreateRequest>({
    roomId: 0,
    title: '',
    intgRsrvYn: 'N',
    startDateTime: '',
    endDateTime: '',
  })

  const {
    data: reservations,
    loading: reservationsLoading,
    error: reservationsError,
    execute: fetchReservations,
  } = useApi<ReservationResponse[], [string, string]>(
    meetingRoomReservationApi.getReservations,
    {
      immediate: false,
      initialData: [],
    },
  )

  const { loading: createLoading, execute: createReservation } = useApi<
    ReservationResponse,
    [ReservationCreateRequest]
  >(meetingRoomReservationApi.createReservation, {
    immediate: false,
  })

  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          checkedRoomIds.length === 0 || checkedRoomIds.includes(room.roomId),
      ),
    [checkedRoomIds, rooms],
  )

  const reservationList = useMemo(
    () =>
      (reservations ?? []).filter((reservation) =>
        isReservationVisibleOnDate(reservation, selectedDate),
      ),
    [reservations, selectedDate],
  )

  const loading = roomsLoading || reservationsLoading
  const errorMessage = roomsErrorMessage ?? reservationsError?.message ?? null
  const timelineGridColumn = `span ${timelineHours.length} / span ${timelineHours.length}`

  const refreshReservations = useCallback(async () => {
    const { begin, end } = getReservationRange(selectedDate)
    await fetchReservations(begin, end)
  }, [fetchReservations, selectedDate])

  useEffect(() => {
    void refreshReservations()
  }, [refreshReservations])

  const openCreateModal = (roomId?: number, startDateTime?: string) => {
    const resolvedStartDateTime = startDateTime || `${selectedDate}T09:00:00`

    setFormValues({
      roomId: roomId ?? filteredRooms[0]?.roomId ?? rooms[0]?.roomId ?? 0,
      title: '',
      intgRsrvYn: 'N',
      startDateTime: resolvedStartDateTime,
      endDateTime: addMinutesToDateTime(resolvedStartDateTime, 30),
    })

    setModalOpen(true)
  }

  const handleTimelineClick = (
    roomId: number,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clickedX = event.clientX - rect.left
    const startDateTime = getClickedStartDateTime(selectedDate, clickedX)

    openCreateModal(roomId, startDateTime)
  }

  const movePrevDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)

    setSelectedDate(formatDateKey(date))
  }

  const moveNextDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)

    setSelectedDate(formatDateKey(date))
  }

  const handleCreateReservation = async (values: ReservationCreateRequest) => {
    await createReservation(values)

    setModalOpen(false)
    await refreshReservations()
  }

  const selectedReservationRoom = selectedReservation
    ? rooms.find((room) => room.roomId === selectedReservation.roomId)
    : null

  return (
    <PageComponent
      actions={
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ReservationLegend />
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => openCreateModal()}
          >
            예약 생성
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          <IconButton aria-label="이전 날짜" onClick={movePrevDate}>
            <ChevronLeft size={16} />
          </IconButton>

          <strong className="text-base text-slate-950">{selectedDate}</strong>

          <IconButton aria-label="다음 날짜" onClick={moveNextDate}>
            <ChevronRight size={16} />
          </IconButton>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            회의실 예약 정보를 불러오는 중입니다.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div
              className="grid w-full min-w-[1080px]"
              style={{
                gridTemplateColumns: `120px repeat(${timelineHours.length}, minmax(${SLOT_WIDTH}px, 1fr))`,
              }}
            >
              <div className="border-b border-r border-slate-200 bg-slate-50" />

              {timelineHours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-r border-slate-200 bg-slate-50 py-3 text-center text-xs font-semibold text-slate-600"
                >
                  {hour}:00
                </div>
              ))}

              {errorMessage && (
                <div className="contents">
                  <div className="border-r border-t border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-900">조회 실패</p>
                  </div>

                  <div
                    className="flex h-16 items-center justify-center border-t border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500"
                    style={{ gridColumn: timelineGridColumn }}
                  >
                    서버에 연결되면 회의실 예약 현황이 이 타임라인에 표시됩니다.
                  </div>
                </div>
              )}

              {!errorMessage && rooms.length === 0 && (
                <div className="contents">
                  <div className="border-r border-t border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-900">회의실 없음</p>
                  </div>

                  <div
                    className="flex h-16 items-center justify-center border-t border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500"
                    style={{ gridColumn: timelineGridColumn }}
                  >
                    백엔드에 회의실 데이터가 추가되면 이 영역에 회의실별 행이 표시됩니다.
                  </div>
                </div>
              )}

              {!errorMessage && rooms.length > 0 && filteredRooms.length === 0 && (
                <div className="contents">
                  <div className="border-r border-t border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-900">필터 없음</p>
                  </div>

                  <div
                    className="flex h-16 items-center justify-center border-t border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500"
                    style={{ gridColumn: timelineGridColumn }}
                  >
                    서브사이드바에서 표시할 회의실을 선택해주세요.
                  </div>
                </div>
              )}

              {!errorMessage &&
                filteredRooms.map((room) => {
                  const roomReservations = reservationList.filter(
                    (reservation) => reservation.roomId === room.roomId,
                  )

                  return (
                    <div key={room.roomId} className="contents">
                      <div className="border-r border-t border-slate-200 p-3">
                        <p className="text-sm font-bold text-slate-900">
                          {room.roomName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {room.floor}층{room.ho ? ` · ${room.ho}` : ''}
                        </p>
                      </div>

                      <div
                        className="relative h-16 border-t border-slate-200 bg-white"
                        style={{ gridColumn: timelineGridColumn }}
                        onClick={(event) => handleTimelineClick(room.roomId, event)}
                      >
                        {timelineHours.map((hour, index) => (
                          <div
                            key={hour}
                            className="absolute top-0 h-full border-r border-dashed border-slate-200"
                            style={{
                              left: `${((index + 1) / timelineHours.length) * 100}%`,
                            }}
                          />
                        ))}

                        {roomReservations.map((reservation) => (
                          <button
                            key={reservation.reservationId}
                            type="button"
                            className={`absolute top-2 h-12 overflow-hidden rounded-lg border px-3 text-left text-xs font-semibold ${
                              reservation.mine
                                ? 'border-blue-300 bg-blue-100 text-blue-700'
                                : 'border-slate-300 bg-stone-50 text-slate-700'
                            }`}
                            style={getReservationBlockStyle(reservation)}
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedReservation(reservation)
                            }}
                            title="예약 정보 보기"
                          >
                            {reservation.title || reservation.reserverName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      <ReservationCreateModal
        open={modalOpen}
        rooms={rooms}
        reservations={reservations ?? []}
        formValues={formValues}
        loading={createLoading}
        onChange={setFormValues}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateReservation}
      />

      <Modal
        open={selectedReservation !== null}
        title={selectedReservation?.title || '회의실 예약'}
        description="예약된 회의실 정보를 확인합니다."
        onClose={() => setSelectedReservation(null)}
        footer={
          <Button onClick={() => setSelectedReservation(null)}>
            확인
          </Button>
        }
      >
        {selectedReservation && (
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-bold text-slate-500">회의실</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {selectedReservationRoom
                  ? `${selectedReservationRoom.floor}층 ${selectedReservationRoom.roomName}${
                      selectedReservationRoom.ho ? ` · ${selectedReservationRoom.ho}` : ''
                    }`
                  : `회의실 ID ${selectedReservation.roomId}`}
              </dd>
            </div>

            <div>
              <dt className="font-bold text-slate-500">예약자</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {selectedReservation.reserverName}
              </dd>
            </div>

            <div>
              <dt className="font-bold text-slate-500">예약 시간</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {formatReservationDateTime(selectedReservation.startDateTime)}
                {' - '}
                {formatReservationDateTime(selectedReservation.endDateTime)}
              </dd>
            </div>

            <div>
              <dt className="font-bold text-slate-500">예약 유형</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {selectedReservation.intgRsrvYn === 'Y' ? '종일 예약' : '시간 예약'}
              </dd>
            </div>

            <div>
              <dt className="font-bold text-slate-500">연결된 회의</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {selectedReservation.mtngId
                  ? `회의 ID ${selectedReservation.mtngId}`
                  : '없음'}
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </PageComponent>
  )
}

export default ReservationPage
