import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import PageComponent from '../../components/layouts/PageComponent'
import { meetingRoomReservationApi } from '../../api/ReservationApi'
import { useApi } from '../../hooks/useApi'
import type {
  CreateReservationRequest,
  MeetingRoomReservation,
} from '../../types/Reservation'
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

const addMinutesToDateTime = (dateTime: string, minutes: number) => {
  const date = new Date(dateTime)
  date.setMinutes(date.getMinutes() + minutes)

  return `${formatDateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}:00`
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

  // 예약 등록 모달을 열고 닫기 위한 상태입니다.
  const [modalOpen, setModalOpen] = useState(false)

  // 예약 등록 폼에서 사용할 입력값입니다.
  const [formValues, setFormValues] = useState<CreateReservationRequest>({
    roomId: 0,
    title: '',
    startDateTime: '',
    endDateTime: '',
  })

  // 선택한 날짜의 예약 목록 조회 API입니다.
  const {
    data: reservations,
    loading: reservationsLoading,
    error: reservationsError,
    execute: fetchReservations,
  } = useApi<MeetingRoomReservation[], [string]>(
    meetingRoomReservationApi.getReservations,
    {
      immediate: false,
      initialData: [],
    },
  )

  // 예약 등록 API입니다. 등록 버튼을 눌렀을 때만 호출합니다.
  const { loading: createLoading, execute: createReservation } = useApi<
    MeetingRoomReservation,
    [CreateReservationRequest]
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

  const reservationList = reservations ?? []
  const loading = roomsLoading || reservationsLoading
  const errorMessage = roomsErrorMessage ?? reservationsError?.message ?? null

  // 왼쪽 회의실 칸을 제외하고 시간 칸 전체를 차지하도록 gridColumn을 계산합니다.
  const timelineGridColumn = `span ${timelineHours.length} / span ${timelineHours.length}`

  // 선택 날짜가 바뀌면 예약 목록을 다시 불러옵니다.
  useEffect(() => {
    void fetchReservations(selectedDate)
  }, [fetchReservations, selectedDate])

  // 예약 등록 모달을 열면서 기본 회의실과 기본 시간을 세팅합니다.
  const openCreateModal = (roomId?: number, startDateTime?: string) => {
    const resolvedStartDateTime = startDateTime || `${selectedDate}T09:00:00`

    setFormValues({
      roomId: roomId ?? filteredRooms[0]?.roomId ?? rooms[0]?.roomId ?? 0,
      title: '',
      startDateTime: resolvedStartDateTime,
      endDateTime: addMinutesToDateTime(resolvedStartDateTime, 30),
    })

    setModalOpen(true)
  }

  // 빈 타임라인 영역을 클릭하면 클릭한 x좌표를 예약 시작 시간으로 바꿉니다.
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

  // 예약을 등록한 뒤 현재 날짜의 예약 목록을 다시 조회해서 화면을 갱신합니다.
  const handleCreateReservation = async (values: CreateReservationRequest) => {
    await createReservation(values)

    setModalOpen(false)
    await fetchReservations(selectedDate)
  }

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
                          {room.roomName} ({room.capacity}인)
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {room.floor}
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
                            style={
                              {
                                left: `${getReservationLeftPercent(
                                  reservation.startDateTime,
                                )}%`,
                                width: `${getReservationWidthPercent(
                                  reservation.startDateTime,
                                  reservation.endDateTime,
                                )}%`,
                              } as CSSProperties
                            }
                            onClick={(event) => {
                              // 예약 블록 클릭 시 빈 영역 클릭 이벤트가 같이 실행되지 않도록 막습니다.
                              event.stopPropagation()
                            }}
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
        formValues={formValues}
        loading={createLoading}
        onChange={setFormValues}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateReservation}
      />
    </PageComponent>
  )
}

export default ReservationPage
