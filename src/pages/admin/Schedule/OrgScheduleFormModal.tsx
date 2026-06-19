import { useState } from 'react'
import { X } from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { adminScheduleApi } from '../../../api/adminScheduleApi'
import type { AdminSchdRequest, AdminSchdResponse } from '../../../types'
import { ApiError } from '../../../api/axiosInstance'
import EmployeeSearchPicker from '../../../components/common/employeeSearch/EmployeeSearchPicker'

const CLSF_OPTIONS = [
  { value: 'C001', label: '전사 일정' },
  { value: 'C003', label: '부서 일정' },
  { value: 'C004', label: '간부 일정' },
]

const REPT_TYPE_OPTIONS = [
  { value: '01', label: '매일' },
  { value: '02', label: '매주' },
  { value: '03', label: '매월' },
]

interface Props {
  editData?: AdminSchdResponse | null
  onClose: () => void
  onSuccess: () => void
}

interface TargetItem {
  targetTypeCd: string
  targetId: string
}

const toDateTimeLocal = (dt?: string | null) => {
  if (!dt) return ''
  return dt.slice(0, 16)
}

const toApiDateTime = (dt: string) => {
  if (!dt) return ''
  return dt.length === 16 ? `${dt}:00` : dt
}

export default function OrgScheduleFormModal({ editData, onClose, onSuccess }: Props) {
  const isEdit = !!editData

  const [schdClsfCd, setSchdClsfCd] = useState(editData?.schdClsfCd ?? 'C001')
  const [schdNm, setSchdNm] = useState(editData?.schdNm ?? '')
  const [schdDetailCn, setSchdDetailCn] = useState(editData?.schdDetailCn ?? '')
  const [beginDt, setBeginDt] = useState(toDateTimeLocal(editData?.beginDt))
  const [endDt, setEndDt] = useState(toDateTimeLocal(editData?.endDt))
  const [allDayYn, setAllDayYn] = useState(editData?.allDayYn ?? 'N')
  const [reptYn, setReptYn] = useState(editData?.reptYn ?? 'N')
  const [reptTypeCd, setReptTypeCd] = useState(editData?.reptTypeCd ?? '01')
  const [reptEndDt, setReptEndDt] = useState(toDateTimeLocal(editData?.reptEndDt))
  const [targetEmpIds, setTargetEmpIds] = useState<Array<string | number>>(() => {
    if (!editData?.targets) return []
    return editData.targets
      .filter((t) => t.targetTypeCd === '02')
      .map((t) => t.targetId ?? '')
      .filter(Boolean)
  })

  const { execute: createSchd, loading: createLoading } = useApi(
    adminScheduleApi.createSchd,
    { immediate: false }
  )
  const { execute: modifySchd, loading: modifyLoading } = useApi(
    adminScheduleApi.modifySchd,
    { immediate: false }
  )

  const loading = createLoading || modifyLoading

  const buildTargets = (): TargetItem[] => {
    if (schdClsfCd === 'C001') {
      return [{ targetTypeCd: '01', targetId: '0' }]
    }
    return targetEmpIds.map((id) => ({
      targetTypeCd: '02',
      targetId: String(id),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!beginDt || !endDt) {
      alert('시작일시와 종료일시를 입력해주세요.')
      return
    }

    const body: AdminSchdRequest = {
      schdClsfCd,
      schdNm,
      schdDetailCn: schdDetailCn || '',
      beginDt: toApiDateTime(beginDt),
      endDt: toApiDateTime(endDt),
      allDayYn,
      reptYn,
      reptTypeCd: reptYn === 'Y' ? reptTypeCd : '',
      reptEndDt: reptYn === 'Y' ? toApiDateTime(reptEndDt) : '',
      targets: buildTargets(),
    }

    try {
      if (isEdit && editData?.schdId) {
        await modifySchd(editData.schdId, body)
      } else {
        await createSchd(body)
      }
      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof ApiError) alert(err.message)
    }
  }

  const needsTargetPicker = schdClsfCd === 'C003' || schdClsfCd === 'C004'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#2d3133]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#c0c6d5] overflow-hidden max-h-[90vh] flex flex-col">

        <div className="p-5 border-b border-[#c0c6d5] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#191c1e]">
            {isEdit ? '일정 수정' : '일정 등록'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#f2f4f6] rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">

          <div>
            <label className="block text-xs font-bold mb-1 text-[#414753]">일정 분류</label>
            <select
              value={schdClsfCd}
              onChange={(e) => setSchdClsfCd(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
            >
              {CLSF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-[#414753]">일정명 *</label>
            <input
              type="text"
              required
              value={schdNm}
              onChange={(e) => setSchdNm(e.target.value)}
              placeholder="일정명을 입력하세요"
              className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-[#414753]">상세 내용</label>
            <textarea
              value={schdDetailCn}
              onChange={(e) => setSchdDetailCn(e.target.value)}
              placeholder="상세 내용을 입력하세요"
              rows={3}
              className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDayYn"
              checked={allDayYn === 'Y'}
              onChange={(e) => setAllDayYn(e.target.checked ? 'Y' : 'N')}
              className="w-4 h-4 accent-[#005cad]"
            />
            <label htmlFor="allDayYn" className="text-sm text-[#414753] font-medium">종일</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-[#414753]">시작일시 *</label>
              <input
                type={allDayYn === 'Y' ? 'date' : 'datetime-local'}
                required
                value={allDayYn === 'Y' ? beginDt.slice(0, 10) : beginDt}
                onChange={(e) => setBeginDt(allDayYn === 'Y' ? `${e.target.value}T00:00` : e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-[#414753]">종료일시 *</label>
              <input
                type={allDayYn === 'Y' ? 'date' : 'datetime-local'}
                required
                value={allDayYn === 'Y' ? endDt.slice(0, 10) : endDt}
                onChange={(e) => setEndDt(allDayYn === 'Y' ? `${e.target.value}T23:59` : e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#f7f9fb] rounded-lg border border-[#c0c6d5]">
            <div>
              <p className="text-sm font-semibold text-[#191c1e]">반복 일정</p>
              <p className="text-xs text-[#717785]">이 일정을 반복 설정합니다</p>
            </div>
            <button
              type="button"
              onClick={() => setReptYn((prev) => (prev === 'Y' ? 'N' : 'Y'))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                reptYn === 'Y' ? 'bg-[#005cad]' : 'bg-[#c0c6d5]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  reptYn === 'Y' ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {reptYn === 'Y' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-[#414753]">반복 유형</label>
                <select
                  value={reptTypeCd}
                  onChange={(e) => setReptTypeCd(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                >
                  {REPT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-[#414753]">반복 종료일</label>
                <input
                  type="date"
                  value={reptEndDt.slice(0, 10)}
                  onChange={(e) => setReptEndDt(`${e.target.value}T23:59`)}
                  className="w-full px-3 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                />
              </div>
            </div>
          )}

          {schdClsfCd === 'C001' && (
            <div className="p-3 bg-[#E8EFFF] rounded-lg border border-[#3377FF]/30">
              <p className="text-xs font-semibold text-[#0044CC]">
                전사 일정은 전체 직원에게 자동 공유됩니다.
              </p>
            </div>
          )}

          {needsTargetPicker && (
            <div>
              <label className="block text-xs font-bold mb-1 text-[#414753]">
                공유 대상 *
              </label>
              <EmployeeSearchPicker
                variant="compact"
                remoteSearch
                selectedEmployeeIds={targetEmpIds}
                onChange={setTargetEmpIds}
                emptyText="이름을 검색하세요."
              />
            </div>
          )}

        </form>

        <div className="p-5 border-t border-[#c0c6d5] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-[#414753] border border-[#c0c6d5] rounded-lg hover:bg-[#f2f4f6] transition-all"
          >
            취소
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg disabled:opacity-50 transition-all"
          >
            {loading ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>

      </div>
    </div>
  )
}