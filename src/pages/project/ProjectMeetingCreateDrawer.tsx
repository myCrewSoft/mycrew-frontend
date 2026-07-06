import { useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, Video, X } from 'lucide-react'
import { meetingApi } from '../../api/meetingApi'
import Button from '../../components/common/button/Button'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'
import type { EmployeeSearchItem } from '../../components/common/employeeSearch/EmployeeSearchPicker'
import FormField from '../../components/common/form/formField/FormField'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../store/AuthContext'

interface ProjectMeetingCreateDrawerProps {
  open: boolean
  projectName: string
  projectMembers: EmployeeSearchItem[]
  onClose: () => void
  onCreated: () => void
}

const toDateTimeInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const createInitialDateRange = () => {
  const now = new Date()
  return {
    beginDt: toDateTimeInputValue(now),
    endDt: toDateTimeInputValue(new Date(now.getTime() + 60 * 60 * 1000)),
  }
}

export default function ProjectMeetingCreateDrawer({
  open,
  projectName,
  projectMembers,
  onClose,
  onCreated,
}: ProjectMeetingCreateDrawerProps) {
  const { auth } = useAuth()
  const [initialDateRange] = useState(createInitialDateRange)
  const [meetingTitle, setMeetingTitle] = useState(projectName)
  const [beginDt, setBeginDt] = useState(initialDateRange.beginDt)
  const [endDt, setEndDt] = useState(initialDateRange.endDt)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    Array<string | number>
  >([])
  const [errorMessage, setErrorMessage] = useState('')
  const { loading, execute: createMeeting } = useApi(meetingApi.createMeeting, {
    immediate: false,
  })
  const authEmployeeId = Number(auth.payload?.sub)
  const storedEmployeeId = Number(localStorage.getItem('empId'))
  const currentEmployeeId = Number.isFinite(authEmployeeId)
    ? authEmployeeId
    : storedEmployeeId
  const availableProjectMembers = useMemo(
    () =>
      projectMembers.filter(
        (employee) => Number(employee.id) !== currentEmployeeId,
      ),
    [currentEmployeeId, projectMembers],
  )

  const departments = useMemo(
    () => [
      ...new Set(
        availableProjectMembers
          .map((employee) => employee.department)
          .filter(Boolean),
      ),
    ],
    [availableProjectMembers],
  )

  if (!open) return null

  const handleSubmit = async () => {
    if (!meetingTitle.trim()) {
      setErrorMessage('회의 제목을 입력해주세요.')
      return
    }

    if (!beginDt || !endDt || new Date(beginDt) >= new Date(endDt)) {
      setErrorMessage('종료 일시는 시작 일시보다 늦어야 합니다.')
      return
    }

    setErrorMessage('')

    try {
      await createMeeting({
        mtngNm: meetingTitle.trim(),
        mtngTypeCd: '01',
        beginDt,
        endDt,
        confRmId: null,
        ptcptEmpIds: selectedEmployeeIds
          .map(Number)
          .filter((employeeId) => Number.isFinite(employeeId)),
      })
      onCreated()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '회의를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <button
        type="button"
        aria-label="회의 생성 닫기"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold text-blue-700">프로젝트 회의</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">회의 예약</h2>
            <p className="mt-1 text-sm text-slate-500">
              프로젝트 참여자와 진행할 화상회의를 예약합니다.
            </p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-800">
                <Video size={17} />
                화상회의
              </div>
              <FormField
                label="회의 제목"
                required
                value={meetingTitle}
                onChange={(event) => setMeetingTitle(event.target.value)}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <CalendarClock size={17} className="text-blue-600" />
                회의 일정
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="시작 일시"
                  type="datetime-local"
                  required
                  value={beginDt}
                  onChange={(event) => setBeginDt(event.target.value)}
                />
                <FormField
                  label="종료 일시"
                  type="datetime-local"
                  required
                  value={endDt}
                  onChange={(event) => setEndDt(event.target.value)}
                />
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-900">회의 참여자</h3>
                <p className="mt-1 text-xs text-slate-500">
                  이 프로젝트에 참여 중인 구성원만 검색할 수 있습니다.
                </p>
              </div>
              <EmployeeSearchPicker
                variant="detailed"
                employees={availableProjectMembers}
                departments={departments}
                showDepartmentFilter
                showAllOnEmpty
                selectedEmployeeIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                emptyText="일치하는 프로젝트 참여자가 없습니다."
              />
            </section>

            {errorMessage && (
              <p className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertCircle size={16} />
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 px-6 py-5">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button loading={loading} onClick={() => void handleSubmit()}>
            회의 생성
          </Button>
        </footer>
      </aside>
    </div>
  )
}
