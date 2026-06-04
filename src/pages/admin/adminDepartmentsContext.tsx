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
  const [reloadKey, setReloadKey] = useState(0);

  const selectDepartment = useCallback(
    (deptCd: string) => {
      navigate(`/admin/departments?deptCd=${encodeURIComponent(deptCd)}`);
    },
    [navigate],
  );

  const reloadDepartments = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);

      try {
        const response = await adminApi.getDepartments();
        const nextDepartments = sortDepartments(response.data.data ?? []);

        if (!active) {
          return;
        }

        setDepartments(nextDepartments);

        const hasSelectedDepartment = nextDepartments.some(
          (department) => department.deptCd === selectedDeptCd,
        );

        if (nextDepartments.length > 0 && !hasSelectedDepartment) {
          navigate(
            `/admin/departments?deptCd=${encodeURIComponent(
              nextDepartments[0].deptCd,
            )}`,
            { replace: true },
          );
        }

        if (nextDepartments.length === 0 && selectedDeptCd) {
          navigate('/admin/departments', { replace: true });
        }
      } catch (err) {
        if (active) {
          setDepartments([]);
          setDepartmentsError(toApiError(err));
        }
      } finally {
        if (active) {
          setDepartmentsLoading(false);
        }
      }
    };

    void loadDepartments();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey, selectedDeptCd]);

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
