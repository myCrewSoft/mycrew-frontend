import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

export type EmployeeSearchVariant = 'detailed' | 'compact'

export interface EmployeeSearchItem {
  id: string | number
  name: string
  department: string
  position: string
  avatarColor?: string
}

interface EmployeeSearchPickerProps {
  variant: EmployeeSearchVariant
  employees: EmployeeSearchItem[]
  selectedEmployeeIds: Array<string | number>
  onChange: (nextEmployeeIds: Array<string | number>) => void
  keyword?: string
  onKeywordChange?: (keyword: string) => void
  departments?: string[]
  emptyText?: string
}

const avatarColors = [
  '#14b8a6',
  '#0ea5e9',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#22c55e',
]

const getAvatarColor = (employee: EmployeeSearchItem, index: number) =>
  employee.avatarColor ?? avatarColors[index % avatarColors.length]

const EmployeeSearchPicker = ({
  variant,
  employees,
  selectedEmployeeIds,
  onChange,
  keyword,
  onKeywordChange,
  departments = [],
  emptyText = '검색 결과가 없습니다.',
}: EmployeeSearchPickerProps) => {
  // keyword를 props로 받으면 부모가 검색어를 관리하고, 없으면 이 컴포넌트가 직접 관리합니다.
  const [internalKeyword, setInternalKeyword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  const currentKeyword = keyword ?? internalKeyword
  const isDetailed = variant === 'detailed'

  const departmentOptions = useMemo(
    () => ['all', ...departments.filter(Boolean)],
    [departments],
  )

  const selectedEmployees = useMemo(
    () =>
      employees.filter((employee) => selectedEmployeeIds.includes(employee.id)),
    [employees, selectedEmployeeIds],
  )

  const visibleEmployees = useMemo(() => {
    const trimmedKeyword = currentKeyword.trim().toLowerCase()

    if (!trimmedKeyword && (!isDetailed || selectedDepartment === 'all')) {
      return []
    }

    return employees.filter((employee) => {
      const searchText =
        `${employee.name} ${employee.department} ${employee.position}`.toLowerCase()
      const matchesKeyword =
        !trimmedKeyword || searchText.includes(trimmedKeyword)
      const matchesDepartment =
        !isDetailed ||
        selectedDepartment === 'all' ||
        employee.department === selectedDepartment

      return matchesKeyword && matchesDepartment
    })
  }, [currentKeyword, employees, isDetailed, selectedDepartment])

  const handleKeywordChange = (nextKeyword: string) => {
    setInternalKeyword(nextKeyword)
    onKeywordChange?.(nextKeyword)
  }

  const handleToggleEmployee = (employeeId: string | number) => {
    const nextEmployeeIds = selectedEmployeeIds.includes(employeeId)
      ? selectedEmployeeIds.filter((id) => id !== employeeId)
      : [...selectedEmployeeIds, employeeId]

    onChange(nextEmployeeIds)
  }

  const handleClearSelectedEmployees = () => {
    onChange([])
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-slate-700">
        {isDetailed ? '참석자 검색' : '참여자 검색'}
      </span>

      <div
        className={
          isDetailed
            ? 'rounded-2xl border border-slate-200 bg-white p-4'
            : 'flex flex-col gap-3'
        }
      >
        <div className="flex flex-col gap-3">
          <input
            value={currentKeyword}
            onChange={(event) => handleKeywordChange(event.target.value)}
            placeholder={
              isDetailed ? '이름으로 검색' : '이름, 부서, 직급으로 검색'
            }
            className={
              isDetailed
                ? 'h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400'
                : 'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400'
            }
          />

          {isDetailed && (
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-blue-400"
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department === 'all' ? '전체 부서' : department}
                </option>
              ))}
            </select>
          )}
        </div>

        {!isDetailed && (
          <div className="mt-3 flex items-center justify-between border-b border-slate-200 pb-2">
            <p className="text-xs font-bold text-slate-700">참여자</p>
            <span className="text-[11px] text-slate-400">
              {selectedEmployeeIds.length}명 선택
            </span>
          </div>
        )}

        {(currentKeyword.trim() || (isDetailed && selectedDepartment !== 'all')) && (
          <div
            className={
              isDetailed
                ? 'mt-4 max-h-[224px] overflow-y-auto rounded-xl border border-slate-200'
                : 'mt-3 max-h-44 overflow-y-auto rounded-lg border border-slate-200'
            }
          >
            {visibleEmployees.map((employee, index) => {
              const selected = selectedEmployeeIds.includes(employee.id)

              if (!isDetailed) {
                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => handleToggleEmployee(employee.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                      selected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {employee.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {employee.position} · {employee.department}
                      </span>
                    </span>

                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </button>
                )
              }

              return (
                <label
                  key={employee.id}
                  className="flex h-14 cursor-pointer items-center gap-3 border-b border-slate-200 px-3 last:border-b-0 hover:bg-slate-50"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: getAvatarColor(employee, index) }}
                  >
                    {employee.name.slice(0, 1)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {employee.name}
                    </span>
                    <span className="block truncate text-xs font-medium text-slate-500">
                      {employee.department} · {employee.position}
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleToggleEmployee(employee.id)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              )
            })}

            {visibleEmployees.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                {emptyText}
              </div>
            )}
          </div>
        )}
      </div>

      {isDetailed ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-slate-900">
                선택된 참석자
              </span>
              <p className="mt-1 text-xs font-medium text-slate-500">
                총 {selectedEmployeeIds.length}명이 일정에 초대됩니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearSelectedEmployees}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              전체 삭제
            </button>
          </div>

          <div className="mt-4 min-h-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3">
            {selectedEmployees.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedEmployees.map((employee, index) => (
                  <span
                    key={employee.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none text-white"
                      style={{ backgroundColor: getAvatarColor(employee, index) }}
                    >
                      {employee.name.slice(0, 1)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900">
                        {employee.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400">
                        {employee.department} · {employee.position}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleEmployee(employee.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`${employee.name} 참석자 제거`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex h-10 items-center text-sm text-slate-400">
                선택된 참석자가 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default EmployeeSearchPicker
