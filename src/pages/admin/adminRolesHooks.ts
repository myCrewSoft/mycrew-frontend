import { createContext, useContext } from 'react';
import { ApiError } from '../../api/axiosInstance';
import type { RoleListResponse } from '../../types/admin';

export interface AdminRolesContextValue {
  roles: RoleListResponse[];
  rolesLoading: boolean;
  rolesError: ApiError | null;
  selectedRoleId: number | null;
  isPermissionsView: boolean;
  selectRole: (roleId: number) => void;
  selectPermissionsView: () => void;
  reloadRoles: () => void;
}

export const AdminRolesContext =
  createContext<AdminRolesContextValue | null>(null);

export const useAdminRoles = () => {
  const context = useContext(AdminRolesContext);

  if (!context) {
    throw new Error('useAdminRoles must be used inside AdminRolesProvider.');
  }

  return context;
};

export const useOptionalAdminRoles = () => useContext(AdminRolesContext);
