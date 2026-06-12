import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '../../components/common/button/Button'
import DatePickerField from '../../components/common/form/datePicker/DatePickerField'
import FormField from '../../components/common/form/formField/FormField'
import Textarea from '../../components/common/form/textarea/Textarea'
import type { ProjectDetailResponseDto, ProjectUpdateRequestDto } from '../../types/project'
import { projectApi } from '../../api/projectApi'

type ProjectEditDrawerProps = {
  open: boolean
  onClose: () => void
  project: ProjectDetailResponseDto
  onSuccess?: () => void
}

// ✅ "20240115" 또는 "2024-01-15" → Date 객체로 변환
const parseDate = (ymd: string): Date | null => {
  if (!ymd) return null
  // YYYYMMDD 형식 처리
  const normalized = ymd.length === 8
    ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
    : ymd
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

// ✅ Date → "2024-01-15" string으로 변환
const formatDate = (date: Date | null): string | undefined => {
  if (!date) return undefined
  return date.toISOString().slice(0, 10)
}

export default function ProjectEditDrawer({
  open,
  onClose,
  project,
  onSuccess,
}: ProjectEditDrawerProps) {

  const [projNm, setProjNm] = useState(project.projNm)
  const [projCn, setProjCn] = useState(project.projCn ?? '')
  const [startDate, setStartDate] = useState<Date | null>(parseDate(project.projBgngYmd))
  const [endDate, setEndDate] = useState<Date | null>(parseDate(project.projEndYmd))
  const [projStatCd, setProjStatCd] = useState(project.projStatCd)
  const [updating, setUpdating] = useState(false)

  const currentStat = project.projStatCd
  const isStartDateDisabled = ['02', '03', '04'].includes(currentStat)
  const isEndDateDisabled = ['03', '04'].includes(currentStat)
  const isStatDisabled = ['03', '04'].includes(currentStat)

  const getStatOptions = () => {
    switch (currentStat) {
      case '01':
        return [
          { value: '01', label: '예정' },
          { value: '02', label: '진행 중' },
          { value: '03', label: '중단' },
          { value: '04', label: '완료' },
        ]
      case '02':
        return [
          { value: '02', label: '진행 중' },
          { value: '03', label: '중단' },
          { value: '04', label: '완료' },
        ]
      case '03':
        return [{ value: '03', label: '중단' }]
      case '04':
        return [{ value: '04', label: '완료' }]
      default:
        return []
    }
  }

  const handleSubmit = async () => {
    if (!projNm.trim()) {
      alert('프로젝트명을 입력해주세요')
      return
    }
    if (!isStartDateDisabled && !isEndDateDisabled) {
      if (!startDate || !endDate) {
        alert('시작일과 마감일을 입력해주세요')
        return
      }
      if (startDate.getTime() >= endDate.getTime()) {
        alert('마감일은 시작일 이후여야 해요')
        return
      }
    }

    try {
      setUpdating(true)

      const body: ProjectUpdateRequestDto = {
        projNm,
        projCn,
        projBgngYmd: isStartDateDisabled ? undefined : formatDate(startDate),
        projEndYmd: isEndDateDisabled ? undefined : formatDate(endDate),
        projStatCd: isStatDisabled ? undefined : projStatCd,
      }

      await projectApi.updateProject(project.projId, body)
      onSuccess?.()
      onClose()
    } catch {
      alert('수정 중 오류가 발생했어요')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <aside
        className={`absolute right-0 top-0 z-50 flex h-full w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <h2 className="text-lg font-bold text-slate-900">프로젝트 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">

            <FormField
              label="프로젝트명"
              placeholder="프로젝트 이름을 입력하세요"
              required
              value={projNm}
              onChange={(e) => setProjNm(e.target.value)}
            />

            <Textarea
              label="프로젝트 설명"
              placeholder="프로젝트 목표와 범위를 간략히 설명해주세요"
              rows={3}
              value={projCn}
              onChange={(e) => setProjCn(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                label="시작일"
                mode="date"
                value={startDate}
                onChange={setStartDate}
                disabled={isStartDateDisabled}
              />
              <DatePickerField
                label="마감 예정일"
                mode="date"
                value={endDate}
                onChange={setEndDate}
                disabled={isEndDateDisabled}
              />
            </div>

            {currentStat === '02' && (
              <p className="text-xs text-slate-400">
                진행 중인 프로젝트는 시작일을 변경할 수 없어요
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                프로젝트 상태
              </label>
              <select
                value={projStatCd}
                onChange={(e) => setProjStatCd(e.target.value)}
                disabled={isStatDisabled}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {getStatOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {isStatDisabled && (
                <p className="mt-1 text-xs text-slate-400">
                  {currentStat === '04' ? '완료된' : '중단된'} 프로젝트는 상태를 변경할 수 없어요
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={updating}>
            수정하기
          </Button>
        </div>
      </aside>
    </>
  )
}