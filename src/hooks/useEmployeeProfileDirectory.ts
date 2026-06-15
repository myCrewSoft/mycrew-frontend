import { useCallback, useEffect, useMemo } from 'react'
import { employeeApi, type EmployeeLookupParams } from '../api/employeeApi'
import type { EmployeeLookupResponse } from '../types'
import { useApi } from './useApi'

export interface EmployeeProfileSummary {
  employeeId: number
  name: string
  profileFileId: number | null
}

const extractProfileFileId = (profileImageUrl?: string | null) => {
  if (!profileImageUrl) return null

  const matched = profileImageUrl.match(/\/api\/files\/images\/(\d+)(?:[/?#]|$)/)
  const fileId = Number(matched?.[1])

  return Number.isFinite(fileId) && fileId > 0 ? fileId : null
}

export const useEmployeeProfileDirectory = (enabled = true) => {
  const {
    data: employees,
    execute: fetchEmployees,
  } = useApi<EmployeeLookupResponse[], [EmployeeLookupParams]>(
    employeeApi.lookupEmployees,
    { immediate: false },
  )

  useEffect(() => {
    if (!enabled) return

    void fetchEmployees({}).catch(() => undefined)
  }, [enabled, fetchEmployees])

  const profilesByEmployeeId = useMemo(() => {
    const profiles = new Map<number, EmployeeProfileSummary>()

    for (const employee of employees ?? []) {
      profiles.set(employee.id, {
        employeeId: employee.id,
        name: employee.name,
        profileFileId: extractProfileFileId(employee.profileImageUrl),
      })
    }

    return profiles
  }, [employees])

  const getEmployeeProfile = useCallback(
    (employeeId?: number | null) => {
      if (!employeeId) return undefined
      return profilesByEmployeeId.get(employeeId)
    },
    [profilesByEmployeeId],
  )

  return { getEmployeeProfile }
}
