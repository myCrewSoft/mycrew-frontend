import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import type { AdminDepartmentResponseDTO } from '../../types/admin';
import { AdminDepartmentsContext } from './adminDepartmentsHooks';

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const sortDepartments = (departments: AdminDepartmentResponseDTO[]) =>
  [...departments].sort((left, right) =>
    left.deptNm.localeCompare(right.deptNm, 'ko'),
  );

export function AdminDepartmentsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedDeptCd = searchParams.get('deptCd');
  const [departments, setDepartments] = useState<
    AdminDepartmentResponseDTO[]
  >([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<ApiError | null>(
    null,
  );

  const selectDepartment = useCallback(
    (deptCd: string) => {
      navigate(`/admin/departments?deptCd=${encodeURIComponent(deptCd)}`);
    },
    [navigate],
  );

  const reloadDepartments = useCallback(
    async (preferredDeptCd?: string | null) => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);

      try {
        const response = await adminApi.getDepartments();
        const nextDepartments = sortDepartments(response.data.data ?? []);
        const nextSelectedDeptCd = preferredDeptCd ?? selectedDeptCd;

        setDepartments(nextDepartments);

        const hasSelectedDepartment = nextDepartments.some(
          (department) => department.deptCd === nextSelectedDeptCd,
        );

        if (nextDepartments.length > 0 && !hasSelectedDepartment) {
          navigate(
            `/admin/departments?deptCd=${encodeURIComponent(
              nextDepartments[0].deptCd,
            )}`,
            { replace: true },
          );
        }

        if (nextDepartments.length > 0 && hasSelectedDepartment) {
          navigate(
            `/admin/departments?deptCd=${encodeURIComponent(
              nextSelectedDeptCd ?? nextDepartments[0].deptCd,
            )}`,
            { replace: true },
          );
        }

        if (nextDepartments.length === 0 && selectedDeptCd) {
          navigate('/admin/departments', { replace: true });
        }

        return nextDepartments;
      } catch (err) {
        const apiError = toApiError(err);

        setDepartments([]);
        setDepartmentsError(apiError);
        throw apiError;
      } finally {
        setDepartmentsLoading(false);
      }
    },
    [navigate, selectedDeptCd],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void reloadDepartments().catch(() => undefined);
    });
  }, [reloadDepartments]);

  const value = useMemo(
    () => ({
      departments,
      departmentsLoading,
      departmentsError,
      selectedDeptCd,
      selectDepartment,
      reloadDepartments,
    }),
    [
      departments,
      departmentsError,
      departmentsLoading,
      reloadDepartments,
      selectDepartment,
      selectedDeptCd,
    ],
  );

  return (
    <AdminDepartmentsContext.Provider value={value}>
      {children}
    </AdminDepartmentsContext.Provider>
  );
}
