import { createContext, useContext } from 'react';
import type { ApiError } from '../../api/axiosInstance';
import type { AdminDepartmentResponseDTO } from '../../types/admin';

export interface AdminDepartmentsContextValue {
  departments: AdminDepartmentResponseDTO[];
  departmentsLoading: boolean;
  departmentsError: ApiError | null;
  selectedDeptCd: string | null;
  selectDepartment: (deptCd: string) => void;
  reloadDepartments: (
    preferredDeptCd?: string | null,
  ) => Promise<AdminDepartmentResponseDTO[]>;
}

export const AdminDepartmentsContext =
  createContext<AdminDepartmentsContextValue | null>(null);

export const useAdminDepartments = () => {
  const context = useContext(AdminDepartmentsContext);

  if (!context) {
    throw new Error(
      'useAdminDepartments must be used inside AdminDepartmentsProvider.',
    );
  }

  return context;
};

export const useOptionalAdminDepartments = () =>
  useContext(AdminDepartmentsContext);
