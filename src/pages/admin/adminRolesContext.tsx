import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import type { RoleListResponse } from '../../types/admin';

interface AdminRolesContextValue {
  roles: RoleListResponse[];
  rolesLoading: boolean;
  rolesError: ApiError | null;
  selectedRoleId: number | null;
  selectRole: (roleId: number) => void;
  reloadRoles: () => void;
}

const AdminRolesContext = createContext<AdminRolesContextValue | null>(null);

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const readRoleId = (value: string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function AdminRolesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedRoleId = readRoleId(searchParams.get('roleId'));
  const [roles, setRoles] = useState<RoleListResponse[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectRole = useCallback(
    (roleId: number) => {
      navigate(`/admin/roles?roleId=${roleId}`);
    },
    [navigate],
  );

  const reloadRoles = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError(null);

      try {
        const response = await adminApi.getRoles();
        const nextRoles = response.data.data ?? [];

        if (!active) {
          return;
        }

        setRoles(nextRoles);

        const hasSelectedRole = nextRoles.some(
          (role) => role.roleId === selectedRoleId,
        );

        if (nextRoles.length > 0 && !hasSelectedRole) {
          navigate(`/admin/roles?roleId=${nextRoles[0].roleId}`, {
            replace: true,
          });
        }

        if (nextRoles.length === 0 && selectedRoleId) {
          navigate('/admin/roles', { replace: true });
        }
      } catch (err) {
        if (active) {
          setRoles([]);
          setRolesError(toApiError(err));
        }
      } finally {
        if (active) {
          setRolesLoading(false);
        }
      }
    };

    void loadRoles();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey, selectedRoleId]);

  const value = useMemo(
    () => ({
      roles,
      rolesLoading,
      rolesError,
      selectedRoleId,
      selectRole,
      reloadRoles,
    }),
    [reloadRoles, roles, rolesError, rolesLoading, selectRole, selectedRoleId],
  );

  return (
    <AdminRolesContext.Provider value={value}>
      {children}
    </AdminRolesContext.Provider>
  );
}

export const useAdminRoles = () => {
  const context = useContext(AdminRolesContext);

  if (!context) {
    throw new Error('useAdminRoles must be used inside AdminRolesProvider.');
  }

  return context;
};

export const useOptionalAdminRoles = () => useContext(AdminRolesContext);
