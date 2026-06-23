import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { departmentApi } from '../../../api/departmentApi'
import { employeeApi } from '../../../api/employeeApi'
import type { EmployeeLookupParams } from '../../../api/employeeApi'
import { useApi } from '../../../hooks/useApi'
import ProfileAvatar from '../avatar/ProfileAvatar'
import SearchInput from '../form/searchInput/SearchInput'
import Select from '../form/select/Select'

export type EmployeeSearchVariant = 'detailed' | 'compact'

export interface EmployeeSearchItem {
  id: string | number
  name: string
  department: string
  position: string
  profileImageUrl?: string | null
  profileImageFileId?: number | null
  genderCd?: string | null
  avatarColor?: string
}

export interface EmployeeSearchDepartmentOption {
  value: string
  label: string
}

interface EmployeeSearchPickerProps {
  variant: EmployeeSearchVariant
  employees?: EmployeeSearchItem[]
  selectedEmployeeIds: Array<string | number>
  selectedEmployeeItems?: EmployeeSearchItem[]
  onChange: (nextEmployeeIds: Array<string | number>) => void
  keyword?: string
  onKeywordChange?: (keyword: string) => void
  departments?: string[]
  departmentOptions?: EmployeeSearchDepartmentOption[]
  showDepartmentFilter?: boolean
  showAllOnEmpty?: boolean
  remoteSearch?: boolean
  emptyText?: string
  fixedParams?: Partial<EmployeeLookupParams>
  onSelectedItemsChange?: (items: EmployeeSearchItem[]) => void 
  renderSelectedEmployeeAction?: (employee: EmployeeSearchItem) => ReactNode
}

const containsKorean = (keyword: string) =>
  /[\u3131-\u318e\uac00-\ud7a3]/.test(keyword)

const canSearchByKeyword = (keyword: string) =>
  Boolean(keyword) && (containsKorean(keyword) || keyword.length >= 2)

const getEmployeeIdKey = (id: string | number) => String(id)

const hasUsableProfileImageUrl = (profileImageUrl?: string | null) => {
  if (!profileImageUrl) return false
  const normalizedUrl = profileImageUrl.trim().toLowerCase()
  return normalizedUrl !== 'null' && normalizedUrl !== 'undefined'
}

const EmployeeAvatar = ({
  employee,
  size = 'md',
}: {
  employee: EmployeeSearchItem
  index?: number
  size?: 'sm' | 'md'
}) => {
  const [imageFailed, setImageFailed] = useState(false)
  const sizeClassName = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const avatarSize = size === 'sm' ? 32 : 40
  const src =
    hasUsableProfileImageUrl(employee.profileImageUrl) && !imageFailed && employee.profileImageUrl
      ? employee.profileImageUrl
      : '/avatar-default.svg'

  if (employee.profileImageFileId) {
    return (
      <ProfileAvatar
        fileId={employee.profileImageFileId}
        name={employee.name}
        size={avatarSize}
      />
    )
  }

  return (
    <img
      src={src}
      alt={employee.name}
      className={`${sizeClassName} shrink-0 rounded-full object-cover`}
      onError={() => setImageFailed(true)}
    />
  )
}

const EmployeeResultRow = ({
  employee,
  selected,
  onToggle,
}: {
  employee: EmployeeSearchItem
  selected: boolean
  onToggle: () => void
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
    >
      <EmployeeAvatar employee={employee} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">
          {employee.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {employee.position}
        </span>
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? 'border-blue-500 bg-blue-500'
            : 'border-slate-300 bg-white'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

const EmployeeSearchPicker = ({
  variant,
  employees = [],
  selectedEmployeeIds,
  selectedEmployeeItems = [],
  onChange,
  keyword,
  onKeywordChange,
  departments = [],
  departmentOptions = [],
  showDepartmentFilter = false,
  showAllOnEmpty = false,
  remoteSearch = false,
  emptyText = '검색 결과가 없습니다.',
  fixedParams,
  onSelectedItemsChange,
  renderSelectedEmployeeAction,
}: EmployeeSearchPickerProps) => {
  const [internalKeyword, setInternalKeyword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedEmployeeCache, setSelectedEmployeeCache] = useState<
    EmployeeSearchItem[]
  >([])

  const currentKeyword = keyword ?? internalKeyword
  const trimmedKeyword = currentKeyword.trim()
  const canSearchCurrentKeyword = canSearchByKeyword(trimmedKeyword)
  const remoteDeptCd =
    remoteSearch && selectedDepartment !== 'all' ? selectedDepartment : undefined
  const targetLabel = variant === 'detailed' ? '참석자' : '참여자'

  const {
    data: remoteEmployees,
    loading: remoteLoading,
    error: remoteError,
    execute: lookupEmployees,
    reset: resetLookupEmployees,
  } = useApi<EmployeeSearchItem[], [EmployeeLookupParams]>(
    employeeApi.lookupEmployees,
    { immediate: false },
  )

  const {
    data: remoteDepartments,
    loading: departmentsLoading,
    execute: lookupDepartments,
  } = useApi(departmentApi.lookupDepartments, { immediate: false })

  useEffect(() => {
    if (!remoteSearch || !showDepartmentFilter) return
    void lookupDepartments()
  }, [lookupDepartments, remoteSearch, showDepartmentFilter])

  useEffect(() => {
    if (!remoteSearch) return

    if (!showAllOnEmpty && !canSearchCurrentKeyword && !remoteDeptCd) {
      resetLookupEmployees()
      return
    }

    const timer = window.setTimeout(() => {
      void lookupEmployees({
        keyword: canSearchCurrentKeyword ? trimmedKeyword : undefined,
        deptCd: remoteDeptCd,
        ...fixedParams,
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [
    canSearchCurrentKeyword,
    fixedParams,
    lookupEmployees,
    remoteDeptCd,
    remoteSearch,
    resetLookupEmployees,
    showAllOnEmpty,
    trimmedKeyword,
  ])

  const uniqueDepartmentOptions = useMemo(() => {
    const options = [
      ...departmentOptions,
      ...departments.filter(Boolean).map((department) => ({
        value: department,
        label: department,
      })),
      ...(remoteDepartments ?? []).map((department) => ({
        value: department.deptCd,
        label: department.deptNm,
      })),
    ]

    return options.filter(
      (department, index) =>
        options.findIndex((option) => option.value === department.value) ===
        index,
    )
  }, [departmentOptions, departments, remoteDepartments])

  const employeeOptions = useMemo(
    () => (remoteSearch ? (remoteEmployees ?? []) : employees),
    [employees, remoteEmployees, remoteSearch],
  )

  const selectedEmployees = useMemo(() => {
    const cache = new Map<string, EmployeeSearchItem>()
    selectedEmployeeItems.forEach((employee) =>
      cache.set(getEmployeeIdKey(employee.id), employee),
    )
    selectedEmployeeCache.forEach((employee) =>
      cache.set(getEmployeeIdKey(employee.id), employee),
    )
    employeeOptions.forEach((employee) =>
      cache.set(getEmployeeIdKey(employee.id), employee),
    )

    return selectedEmployeeIds
      .map((id) => cache.get(getEmployeeIdKey(id)))
      .filter((employee): employee is EmployeeSearchItem => Boolean(employee))
  }, [
    employeeOptions,
    selectedEmployeeCache,
    selectedEmployeeIds,
    selectedEmployeeItems,
  ])

  const visibleEmployees = useMemo(() => {
    const selectedDepartmentLabel =
      uniqueDepartmentOptions.find(
        (department) => department.value === selectedDepartment,
      )?.label ?? selectedDepartment

    if (remoteSearch) return employeeOptions

    if (
      !trimmedKeyword &&
      (!showDepartmentFilter || selectedDepartment === 'all')
    ) {
      return []
    }

    return employeeOptions.filter((employee) => {
      const searchText =
        `${employee.name} ${employee.department} ${employee.position}`.toLowerCase()
      const matchesKeyword =
        !trimmedKeyword || searchText.includes(trimmedKeyword.toLowerCase())
      const matchesDepartment =
        !showDepartmentFilter ||
        selectedDepartment === 'all' ||
        employee.department === selectedDepartmentLabel

      return matchesKeyword && matchesDepartment
    })
  }, [
    employeeOptions,
    remoteSearch,
    selectedDepartment,
    showDepartmentFilter,
    trimmedKeyword,
    uniqueDepartmentOptions,
  ])

  const shouldShowResults =
    (remoteSearch ? showAllOnEmpty || canSearchCurrentKeyword : trimmedKeyword) ||
    (showDepartmentFilter && selectedDepartment !== 'all')

  const groupedVisibleEmployees = useMemo(() => {
    const groupMap = new Map<string, EmployeeSearchItem[]>()

    visibleEmployees.forEach((employee) => {
      const departmentName = employee.department || '미지정'
      const departmentEmployees = groupMap.get(departmentName) ?? []
      departmentEmployees.push(employee)
      groupMap.set(departmentName, departmentEmployees)
    })

    return Array.from(groupMap.entries()).map(([departmentName, groupEmployees]) => ({
      departmentName,
      employees: groupEmployees,
    }))
  }, [visibleEmployees])

  const isEmployeeSelected = (employeeId: string | number) =>
    selectedEmployeeIds.some(
      (id) => getEmployeeIdKey(id) === getEmployeeIdKey(employeeId),
    )

  const handleKeywordChange = (nextKeyword: string) => {
    setInternalKeyword(nextKeyword)
    onKeywordChange?.(nextKeyword)
  }

  const handleToggleEmployee = (employeeId: string | number) => {
    const employeeIdKey = getEmployeeIdKey(employeeId)
    const selected = isEmployeeSelected(employeeId)
    const nextEmployeeIds = selected
      ? selectedEmployeeIds.filter((id) => getEmployeeIdKey(id) !== employeeIdKey)
      : [...selectedEmployeeIds, employeeId]

    if (!selected) {
      const selectedEmployee = employeeOptions.find(
        (employee) => getEmployeeIdKey(employee.id) === employeeIdKey,
      )

      if (selectedEmployee) {
        setSelectedEmployeeCache((current) => {
          const cache = new Map<string, EmployeeSearchItem>()
          current.forEach((employee) =>
            cache.set(getEmployeeIdKey(employee.id), employee),
          )
          cache.set(getEmployeeIdKey(selectedEmployee.id), selectedEmployee)
          return Array.from(cache.values())
        })
      }
    }

    onChange(nextEmployeeIds)

    if (onSelectedItemsChange) {
      const nextItems = nextEmployeeIds
        .map((id) => {
          const key = getEmployeeIdKey(id)
          return (
            employeeOptions.find((e) => getEmployeeIdKey(e.id) === key) ??
            selectedEmployeeCache.find((e) => getEmployeeIdKey(e.id) === key) ??
            selectedEmployeeItems.find((e) => getEmployeeIdKey(e.id) === key)
          )
        })
        .filter((e): e is EmployeeSearchItem => Boolean(e))
      onSelectedItemsChange(nextItems)
    }
  }

  const handleClearSelectedEmployees = () => {
    onChange([])
    onSelectedItemsChange?.([])
  }

  const renderStatus = () => {
    if (remoteLoading) {
      return (
        <div className="px-3 py-6 text-center text-sm text-slate-400">
          검색 중입니다.
        </div>
      )
    }

    if (remoteError) {
      return (
        <div className="px-3 py-6 text-center text-sm text-red-400">
          사원 검색 중 오류가 발생했습니다.
        </div>
      )
    }

    if (visibleEmployees.length === 0) {
      return (
        <div className="px-3 py-6 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      )
    }

    return null
  }

  const renderGroupedEmployeeRows = () => {
    if (remoteLoading || remoteError || visibleEmployees.length === 0) {
      return renderStatus()
    }

    return groupedVisibleEmployees.map((group) => (
      <div key={group.departmentName} className="border-b border-slate-100 last:border-b-0">
        <div className="px-4 pb-1 pt-4 text-xs font-bold text-slate-500">
          {group.departmentName}
        </div>
        <div className="pb-2">
          {group.employees.map((employee) => (
            <EmployeeResultRow
              key={employee.id}
              employee={employee}
              selected={isEmployeeSelected(employee.id)}
              onToggle={() => handleToggleEmployee(employee.id)}
            />
          ))}
        </div>
      </div>
    ))
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-3">
        {selectedEmployees.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedEmployees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => handleToggleEmployee(employee.id)}
                className="inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
              >
                <span className="max-w-24 truncate">{employee.name}</span>
                <X size={14} />
              </button>
            ))}
          </div>
        )}

        <SearchInput
          value={currentKeyword}
          onChange={(event) => handleKeywordChange(event.target.value)}
          placeholder="이름 검색"
          wrapperClassName="rounded-full"
          className="h-10 rounded-full border-0 bg-slate-100 focus:border-0"
        />

        {shouldShowResults && (
          <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-bold text-slate-800">검색 결과</span>
              <span className="text-xs text-slate-400">
                {visibleEmployees.length}명
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {renderGroupedEmployeeRows()}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <SearchInput
            value={currentKeyword}
            onChange={(event) => handleKeywordChange(event.target.value)}
            placeholder="검색어를 입력하세요..."
            aria-label="이름 또는 이메일 검색"
          />

          {showDepartmentFilter && (
            <Select
              label="부서 필터"
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              options={[
                {
                  value: 'all',
                  label: departmentsLoading ? '부서 불러오는 중' : '전체 부서',
                },
                ...uniqueDepartmentOptions,
              ]}
            />
          )}
        </div>
      </section>

      {shouldShowResults && (
        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-bold text-slate-800">검색 결과</span>
            <span className="text-xs text-slate-400">
              {visibleEmployees.length}명
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {renderGroupedEmployeeRows()}
          </div>
        </section>
      )}

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            선택된 {targetLabel}
          </span>
          {selectedEmployees.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelectedEmployees}
              className="text-xs font-bold text-red-500 transition-colors hover:text-red-600"
            >
              전체 해제
            </button>
          )}
        </div>

        {selectedEmployees.length > 0 ? (
          <div className="flex flex-col gap-2">
            {selectedEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-3 rounded-md bg-indigo-50 px-3 py-2.5"
              >
                <EmployeeAvatar employee={employee} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {employee.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {employee.department} / {employee.position}
                  </span>
                </span>
                {renderSelectedEmployeeAction?.(employee)}
                <button
                  type="button"
                  onClick={() => handleToggleEmployee(employee.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                  aria-label={`${employee.name} ${targetLabel} 제거`}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-400">
            선택된 {targetLabel}가 없습니다.
          </div>
        )}
      </section>
    </div>
  )
}

export default EmployeeSearchPicker
