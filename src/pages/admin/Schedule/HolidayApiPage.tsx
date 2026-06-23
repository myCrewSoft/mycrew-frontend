import { useEffect, useRef, useState } from 'react'
import type FullCalendarComponent from '@fullcalendar/react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { adminHolidayApi } from '../../../api/adminHolidayApi'
import type { HolidayManualRequest, HolidayResponse } from '../../../types'
import { ApiError } from '../../../api/axiosInstance'
import { formatMonthTitle } from '../../../utils/date'
import '../../../pages/calendar/calendar.css'
import type { EventContentArg } from '@fullcalendar/core/index.js'
import type { CSSProperties } from '@mui/material'
import '../../../pages/calendar/calendar.css'
import interactionPlugin from '@fullcalendar/interaction'


export default function HolidayApiPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const calendarRef = useRef<FullCalendarComponent>(null)
  const [calendarTitle, setCalendarTitle] = useState(() => formatMonthTitle(new Date()))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editData, setEditData] = useState<HolidayResponse | null>(null)

  const [holidayNm, setHolidayNm] = useState('')
  const [holidayDt, setHolidayDt] = useState('')
  const [isHolidayYn, setIsHolidayYn] = useState('Y')

  const {
    data: holidayList,
    loading: listLoading,
    execute: fetchList,
  } = useApi(adminHolidayApi.getHolidayList, { immediate: false })

  const { execute: syncHolidays, loading: syncLoading } = useApi(
    adminHolidayApi.syncHolidays,
    { immediate: false }
  )
  const { execute: createHoliday, loading: createLoading } = useApi(
    adminHolidayApi.createHoliday,
    { immediate: false }
  )
  const { execute: modifyHoliday, loading: modifyLoading } = useApi(
    adminHolidayApi.modifyHoliday,
    { immediate: false }
  )
  const { execute: deleteHoliday, loading: deleteLoading } = useApi(
    adminHolidayApi.deleteHoliday,
    { immediate: false }
  )

  useEffect(() => {
    void fetchList(year)
  }, [year, fetchList])

  const calendarEvents = (holidayList ?? []).map((h) => {
    const isHoliday = h.isHolidayYn === 'Y'
    return {
        id: String(h.holidayId),
        title: h.holidayNm ?? '',
        start: h.holidayDt ?? '',
        allDay: true,
        backgroundColor: isHoliday ? '#FFF0F0' : '#F5F5F5',
        borderColor:     isHoliday ? '#EA4335' : '#9AA0A6',
        textColor:       isHoliday ? '#C5221F' : '#5F6368',
        extendedProps: { isHolidayYn: h.isHolidayYn },
    }
    })

    const renderHolidayEvent = (info: EventContentArg) => {
        const isHoliday = info.event.extendedProps.isHolidayYn === 'Y'
        return (
            <div
            className="calendar-main-event calendar-main-event-all-day"
            style={
                {
                '--calendar-event-bg':     isHoliday ? '#FFF0F0' : '#F5F5F5',
                '--calendar-event-border': isHoliday ? '#EA4335' : '#9AA0A6',
                '--calendar-event-color':  isHoliday ? '#C5221F' : '#5F6368',
                width: '100%',
                } as CSSProperties
            }
            >
            <span className="calendar-main-event-dot" />
            <span className="calendar-main-event-title">{info.event.title}</span>
            </div>
        )
        }
  const handleSync = async () => {
    if (!window.confirm(`${year}년 공휴일을 API에서 동기화하시겠습니까?`)) return
    try {
      const res = await syncHolidays(year)
      alert(`${res.data ?? 0}건 동기화 완료`)
      void fetchList(year)
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
    }
  }

  const openCreateForm = () => {
    setEditData(null)
    setHolidayNm('')
    setHolidayDt('')
    setIsHolidayYn('Y')
    setIsFormOpen(true)
  }

  const openEditForm = (h: HolidayResponse) => {
    setEditData(h)
    setHolidayNm(h.holidayNm ?? '')
    setHolidayDt(h.holidayDt ?? '')
    setIsHolidayYn(h.isHolidayYn ?? 'Y')
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: HolidayManualRequest = {
      holidayNm,
      holidayDt,
      isHolidayYn,
    }
    try {
      if (editData?.holidayId) {
        await modifyHoliday(editData.holidayId, body)
      } else {
        await createHoliday(body)
      }
      setIsFormOpen(false)
      void fetchList(year)
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
    }
  }

  const handleDelete = async (holidayId: number) => {
    if (!window.confirm('이 공휴일을 삭제하시겠습니까?')) return
    try {
      await deleteHoliday(holidayId)
      void fetchList(year)
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
    }
  }

  const prevMonth = () => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    api.prev()
    setCalendarTitle(formatMonthTitle(api.getDate()))
  }

  const nextMonth = () => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    api.next()
    setCalendarTitle(formatMonthTitle(api.getDate()))
  }

  const focusHolidayDate = (holidayDt?: string) => {
    if (!holidayDt) return
    const targetDate = new Date(`${holidayDt}T00:00:00`)
    if (Number.isNaN(targetDate.getTime())) return

    const api = calendarRef.current?.getApi()
    if (!api) return

    api.gotoDate(targetDate)
    setCalendarTitle(formatMonthTitle(api.getDate()))

    const targetYear = targetDate.getFullYear()
    if (targetYear !== year) setYear(targetYear)
  }

  const loading = createLoading || modifyLoading

  const lastSyncDt = holidayList
    ?.filter((h) => h.genTypeCd === 'API' && h.syncDt)
    .sort((a, b) => (b.syncDt ?? '').localeCompare(a.syncDt ?? ''))
    .at(0)?.syncDt

  return (
    <section className="flex w-full flex-col gap-6 font-sans text-[#191c1e]">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs text-[#717785] mb-1">관리자 &gt; 일정 관리</p>
            <h1 className="text-2xl font-bold tracking-tight">공휴일/API 연동</h1>
            <p className="mt-1 text-sm text-[#414753]">
              한국천문연구원 API 기반 공휴일을 관리합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-[#c0c6d5] bg-white hover:bg-[#f2f4f6] text-[#414753] rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncLoading ? 'animate-spin' : ''} />
              공휴일 동기화
            </button>
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg transition-all"
            >
              <Plus size={15} />
              수동 공휴일 추가
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">전체 공휴일</p>
            <p className="text-2xl font-bold text-[#005cad] mt-1">
              {holidayList?.length ?? 0}건
            </p>
          </div>
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">API 동기화</p>
            <p className="text-2xl font-bold text-[#34A853] mt-1">
              {holidayList?.filter((h) => h.genTypeCd === 'API').length ?? 0}건
            </p>
          </div>
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">수동 등록</p>
            <p className="text-2xl font-bold text-[#565e74] mt-1">
              {holidayList?.filter((h) => h.genTypeCd === 'MANUAL').length ?? 0}건
            </p>
          </div>
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">API 연동 상태</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-bold text-green-600">연동중</span>
            </div>
            {lastSyncDt && (
              <p className="text-[10px] text-[#717785] mt-1">
                최종: {lastSyncDt.slice(0, 16).replace('T', ' ')}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="flex h-full min-h-0 flex-col bg-white border border-[#c0c6d5] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#c0c6d5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold min-w-24 text-center">{calendarTitle}</span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setYear((y) => y - 1)}
                  className="px-2 py-1 text-xs border border-[#c0c6d5] rounded-lg hover:bg-[#f2f4f6]"
                >
                  {year - 1}년
                </button>
                <span className="text-sm font-bold text-[#005cad]">{year}년</span>
                <button
                  onClick={() => setYear((y) => y + 1)}
                  className="px-2 py-1 text-xs border border-[#c0c6d5] rounded-lg hover:bg-[#f2f4f6]"
                >
                  {year + 1}년
                </button>
              </div>
            </div>
            <div className="p-0">
              <div className="calendar-main w-full">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="ko"
                    headerToolbar={false}
                    events={calendarEvents}
                    eventContent={renderHolidayEvent}
                    height="auto"
                    dayMaxEvents={2}
                    moreLinkContent={(args) => `+${args.num} 더보기`}
                    eventOrder="isHolidayYn,-title"
                    dayCellClassNames={(info) => {
                    const day = info.date.getDay()
                    if (day === 0) return ['fc-day-sun']
                    if (day === 6) return ['fc-day-sat']
                    return []
                    }}
                />
                </div>
            </div>
          </div>

          <div className="flex h-full min-h-0 flex-col bg-white border border-[#c0c6d5] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#c0c6d5]">
              <h3 className="text-sm font-bold text-[#191c1e]">{year}년 공휴일 목록</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {listLoading ? (
                <div className="p-10 text-center text-sm text-[#414753]">로딩 중...</div>
              ) : (holidayList ?? []).length === 0 ? (
                <div className="p-10 text-center text-sm text-[#414753]">
                  등록된 공휴일이 없습니다.
                </div>
              ) : (
                <table className="w-full min-w-[640px] text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-[#f2f4f6]">
                    <tr className="text-xs font-semibold text-[#717785] uppercase tracking-wider border-b border-[#c0c6d5]">
                      <th className="px-4 py-3">날짜</th>
                      <th className="px-4 py-3">공휴일명</th>
                      <th className="px-4 py-3">구분</th>
                      <th className="px-4 py-3">생성</th>
                      <th className="px-4 py-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c6d5]">
                    {(holidayList ?? []).map((h) => (
                      <tr key={h.holidayId} className="hover:bg-[#f7f9fb] transition-colors">
                        <td className="px-4 py-3 text-[#414753] font-medium">
                          {h.holidayDt}
                        </td>
                        <td className="px-4 py-3 text-[#191c1e] font-semibold">
                          <button
                            type="button"
                            onClick={() => focusHolidayDate(h.holidayDt)}
                            className="max-w-full truncate text-left font-semibold text-[#191c1e] transition-colors hover:text-[#005cad] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005cad]"
                          >
                            {h.holidayNm}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {h.isHolidayYn === 'Y' ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                              법정공휴일
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f1f3f4] text-[#3c4043]">
                              기념일
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {h.genTypeCd === 'API' ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                              API 자동
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f1f3f4] text-[#565e74]">
                              수동 생성
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {h.genTypeCd === 'MANUAL' ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditForm(h)}
                                className="p-1.5 hover:bg-[#f2f4f6] rounded-lg text-[#005cad] transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(h.holidayId!)}
                                disabled={deleteLoading}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#c0c6d5]">수정 불가</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#2d3133]/40 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-[#c0c6d5] overflow-hidden">
            <div className="p-5 border-b border-[#c0c6d5] flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {editData ? '공휴일 수정' : '수동 공휴일 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-[#f2f4f6] rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-[#414753]">날짜 *</label>
                <input
                  type="date"
                  required
                  value={holidayDt}
                  onChange={(e) => setHolidayDt(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[#414753]">공휴일명 *</label>
                <input
                  type="text"
                  required
                  value={holidayNm}
                  onChange={(e) => setHolidayNm(e.target.value)}
                  placeholder="예: 창립기념일"
                  className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[#414753]">구분</label>
                <select
                  value={isHolidayYn}
                  onChange={(e) => setIsHolidayYn(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                >
                  <option value="Y">법정공휴일</option>
                  <option value="N">기념일</option>
                </select>
              </div>
              <div className="pt-4 border-t border-[#c0c6d5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-[#414753] border border-[#c0c6d5] rounded-lg hover:bg-[#f2f4f6]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? '저장 중...' : editData ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
