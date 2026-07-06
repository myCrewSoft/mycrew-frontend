import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type FullCalendarComponent from '@fullcalendar/react'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { adminScheduleApi } from '../../../api/adminScheduleApi'
import { departmentApi } from '../../../api/departmentApi'
import { ApiError } from '../../../api/axiosInstance'
import type { DepartmentLookupResponse } from '../../../types'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import { formatMonthTitle } from '../../../utils/date'
import '../../../pages/calendar/calendar.css'
import OrgScheduleFormModal from './OrgScheduleFormModal'

const ORG_CLSF_CODES = ['C001', 'C003', 'C004']

const CLSF_COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  C001: { bg: '#E8EFFF', border: '#3377FF', text: '#0044CC' },
  C003: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
  C004: { bg: '#E6F4EA', border: '#34A853', text: '#137333' },
}

const CLSF_LABEL_MAP: Record<string, string> = {
  C001: '전사 일정',
  C003: '간부 일정',
  C004: '부서 일정',
}

type ViewMode = 'calendar' | 'list'

export default function OrgSchedulePage() {
  const calendarRef = useRef<FullCalendarComponent>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [calendarTitle, setCalendarTitle] = useState(() => formatMonthTitle(new Date()))
  const [keyword, setKeyword] = useState('')
  const [selectedClsfCds, setSelectedClsfCds] = useState<string[]>(ORG_CLSF_CODES)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const {
    data: pageData,
    loading: listLoading,
    execute: fetchList,
  } = useApi(adminScheduleApi.getSchdList, { immediate: false })

  const {
    data: detailData,
    execute: fetchDetail,
  } = useApi(adminScheduleApi.getSchd, { immediate: false })

  const { execute: deleteSchd, loading: deleteLoading } = useApi(
    adminScheduleApi.deleteSchd,
    { immediate: false }
  )

  const { data: departments } = useApi<DepartmentLookupResponse[]>(
    departmentApi.lookupDepartments,
    { initialData: [] },
  )
  const departmentNameMap = useMemo(
    () =>
      new Map(
        (departments ?? []).map((department) => [
          department.deptCd,
          department.deptNm,
        ]),
      ),
    [departments],
  )

  useEffect(() => {
    void fetchList({
      schdClsfCdList: selectedClsfCds,
      keyword: keyword || undefined,
      size: 100,
    })
  }, [selectedClsfCds, keyword, fetchList])

  const scheduleList = pageData?.content ?? []

  const calendarEvents = scheduleList.map((s) => {
    const color = CLSF_COLOR_MAP[s.schdClsfCd ?? ''] ?? { bg: '#f1f3f4', border: '#9aa0a6', text: '#3c4043' }
    return {
      id: String(s.schdId),
      title: s.schdNm ?? '',
      start: s.beginDt ?? '',
      end: s.endDt ?? '',
      allDay: s.allDayYn === 'Y',
      backgroundColor: color.bg,
      borderColor: color.border,
      textColor: color.text,
      extendedProps: { raw: s },
    }
  })

  const handleEventClick = async (info: EventClickArg) => {
    await fetchDetail(Number(info.event.id))
    setIsDetailOpen(true)
  }

  const handleDelete = async (schdId: number) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    try {
      await deleteSchd(schdId)
      setIsDetailOpen(false)
      void fetchList({ schdClsfCdList: selectedClsfCds, size: 100 })
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
    }
  }

  const toggleClsf = (cd: string) => {
    setSelectedClsfCds((prev) =>
      prev.includes(cd) ? prev.filter((c) => c !== cd) : [...prev, cd]
    )
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

  const renderEvent = (info: EventContentArg) => {
    const color = CLSF_COLOR_MAP[info.event.extendedProps.raw?.schdClsfCd ?? ''] ?? {
      bg: '#f1f3f4',
      border: '#9aa0a6',
      text: '#3c4043',
    }

    return (
      <div
        className={`calendar-main-event${info.event.allDay ? ' calendar-main-event-all-day' : ''}`}
        style={
          {
            '--calendar-event-bg': color.bg,
            '--calendar-event-border': color.border,
            '--calendar-event-color': color.text,
            width: '100%',
          } as CSSProperties
        }
      >
        <span className="calendar-main-event-dot" />
        <span className="calendar-main-event-title">{info.event.title}</span>
      </div>
    )
  }

  return (
    <section className="flex w-full flex-col gap-6 font-sans text-[#191c1e]">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs text-[#717785] mb-1">관리자 &gt; 일정 관리</p>
            <h1 className="text-2xl font-bold tracking-tight">조직 일정 관리</h1>
            <p className="mt-1 text-sm text-[#414753]">
              전사/간부/부서 일정을 등록하고 관리합니다.
            </p>
          </div>
          <button
            onClick={() => {
              setIsEdit(false)
              setIsFormOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg transition-all"
          >
            <Plus size={15} />
            일정 등록
          </button>
        </div>

        <div className="bg-white border border-[#c0c6d5] rounded-xl shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-[#c0c6d5] flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center gap-2">
              {viewMode === 'calendar' && (
                <>
                  <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-bold text-[#191c1e] min-w-24 text-center">
                    {calendarTitle}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-[#f2f4f6] rounded-lg transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717785]" />
                <input
                  type="text"
                  placeholder="일정명 / 등록자 검색"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-sm border border-[#c0c6d5] rounded-lg focus:ring-2 focus:ring-[#005cad] focus:border-[#005cad] outline-none"
                />
              </div>

              <div className="flex border border-[#c0c6d5] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 transition-all ${viewMode === 'calendar' ? 'bg-[#005cad] text-white' : 'bg-white text-[#414753] hover:bg-[#f2f4f6]'}`}
                >
                  <Calendar size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-all ${viewMode === 'list' ? 'bg-[#005cad] text-white' : 'bg-white text-[#414753] hover:bg-[#f2f4f6]'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-b border-[#c0c6d5] flex gap-2 flex-wrap">
            {ORG_CLSF_CODES.map((cd) => {
              const color = CLSF_COLOR_MAP[cd]
              const active = selectedClsfCds.includes(cd)
              return (
                <button
                  key={cd}
                  onClick={() => toggleClsf(cd)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'border-transparent text-white'
                      : 'border-[#c0c6d5] text-[#717785] bg-white'
                  }`}
                  style={active ? { backgroundColor: color.border } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? 'white' : color.border }}
                  />
                  {CLSF_LABEL_MAP[cd]}
                </button>
              )
            })}
          </div>

          <div className="p-0">
            {viewMode === 'calendar' ? (
              <div className="calendar-main w-full">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="ko"
                  headerToolbar={false}
                  events={calendarEvents}
                  eventContent={renderEvent}
                  eventClick={handleEventClick}
                  height="auto"
                  dayMaxEvents={3}
                  moreLinkContent={(args) => `+${args.num} 더보기`}
                  eventOrder="schdClsfCd,title"
                  dayCellClassNames={(info) => {
                    const day = info.date.getDay()
                    if (day === 0) return ['fc-day-sun']
                    if (day === 6) return ['fc-day-sat']
                    return []
                  }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto p-4">
                {listLoading ? (
                  <div className="p-10 text-center text-sm text-[#414753]">로딩 중...</div>
                ) : scheduleList.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#414753]">일정이 없습니다.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#f2f4f6] text-xs font-semibold text-[#717785] uppercase tracking-wider border-b border-[#c0c6d5]">
                        <th className="px-4 py-3">제목</th>
                        <th className="px-4 py-3">분류</th>
                        <th className="px-4 py-3">시작일</th>
                        <th className="px-4 py-3">종료일</th>
                        <th className="px-4 py-3">등록자</th>
                        <th className="px-4 py-3 text-right">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c0c6d5]">
                      {scheduleList.map((s) => {
                        const color = CLSF_COLOR_MAP[s.schdClsfCd ?? '']
                        return (
                          <tr key={s.schdId} className="hover:bg-[#f7f9fb] transition-colors">
                            <td className="px-4 py-3 font-medium text-[#191c1e]">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-1.5 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: color?.border ?? '#9aa0a6' }}
                                />
                                {s.schdNm}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{
                                  backgroundColor: color?.bg ?? '#f1f3f4',
                                  color: color?.text ?? '#3c4043',
                                }}
                              >
                                {CLSF_LABEL_MAP[s.schdClsfCd ?? ''] ?? s.schdClsfCd}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#414753]">
                              {s.beginDt?.slice(0, 16).replace('T', ' ')}
                            </td>
                            <td className="px-4 py-3 text-[#414753]">
                              {s.endDt?.slice(0, 16).replace('T', ' ')}
                            </td>
                            <td className="px-4 py-3 text-[#414753]">
                              <div className="flex flex-col">
                                <span className="font-medium text-[#191c1e]">{s.wrtrNm}</span>
                                <span className="text-xs text-[#717785]">{s.wrtrDeptNm}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={async () => {
                                    await fetchDetail(s.schdId!)
                                    setIsDetailOpen(true)
                                  }}
                                  className="p-1.5 hover:bg-[#f2f4f6] rounded-lg text-[#005cad] transition-all"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.schdId!)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
      </div>

      {isDetailOpen && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#2d3133]/40 backdrop-blur-sm"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#c0c6d5] overflow-hidden">
            <div className="p-5 border-b border-[#c0c6d5] flex justify-between items-center">
              <h3 className="text-lg font-bold">일정 상세</h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-[#f2f4f6] rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs text-[#717785] mb-1">일정명</p>
                <p className="font-semibold text-[#191c1e]">{detailData.schdNm}</p>
              </div>
              <div>
                <p className="text-xs text-[#717785] mb-1">분류</p>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: CLSF_COLOR_MAP[detailData.schdClsfCd ?? '']?.bg ?? '#f1f3f4',
                    color: CLSF_COLOR_MAP[detailData.schdClsfCd ?? '']?.text ?? '#3c4043',
                  }}
                >
                  {CLSF_LABEL_MAP[detailData.schdClsfCd ?? ''] ?? detailData.schdClsfCd}
                </span>
              </div>
              {detailData.schdDetailCn && (
                <div>
                  <p className="text-xs text-[#717785] mb-1">상세 내용</p>
                  <p className="text-sm text-[#414753] whitespace-pre-wrap">{detailData.schdDetailCn}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#717785] mb-1">시작일시</p>
                  <p className="text-sm text-[#191c1e]">{detailData.beginDt?.slice(0, 16).replace('T', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-[#717785] mb-1">종료일시</p>
                  <p className="text-sm text-[#191c1e]">{detailData.endDt?.slice(0, 16).replace('T', ' ')}</p>
                </div>
              </div>
              {detailData.schdClsfCd === 'C003' &&
                detailData.targets &&
                detailData.targets.length > 0 && (
                <div>
                  <p className="text-xs text-[#717785] mb-2">공유 대상</p>
                  <div className="flex flex-wrap gap-1">
                    {detailData.targets.map((t, i) => (
                      <Badge key={i} variant="neutral">
                        {t.deptNm ||
                          departmentNameMap.get(t.targetId) ||
                          t.targetNm ||
                          t.targetId}
                      </Badge>
                    ))}
                  </div>
                </div>
                )}
            </div>
            <div className="p-5 border-t border-[#c0c6d5] flex justify-end gap-2">
              <button
                onClick={() => handleDelete(detailData.schdId!)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setIsEdit(true)
                  setIsDetailOpen(false)
                  setIsFormOpen(true)
                }}
                className="px-4 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
      {isFormOpen && (
        <OrgScheduleFormModal
          editData={isEdit ? detailData : null}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            void fetchList({ schdClsfCdList: selectedClsfCds, size: 100 })
          }}
        />
      )}
    </section>
  )
}
