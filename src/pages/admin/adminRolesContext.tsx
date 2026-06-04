import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import type { RoleListResponse } from '../../types/admin';
import { AdminRolesContext } from './adminRolesHooks';

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
  const isPermissionsView = searchParams.get('view') === 'permissions';
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

  const selectPermissionsView = useCallback(() => {
    navigate('/admin/roles?view=permissions');
  }, [navigate]);

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

        if (nextRoles.length > 0 && !hasSelectedRole && !isPermissionsView) {
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
  }, [isPermissionsView, navigate, reloadKey, selectedRoleId]);

  const value = useMemo(
    () => ({
      roles,
      rolesLoading,
      rolesError,
      selectedRoleId,
      isPermissionsView,
      selectRole,
      selectPermissionsView,
      reloadRoles,
    }),
    [
      isPermissionsView,
      reloadRoles,
      roles,
      rolesError,
      rolesLoading,
      selectPermissionsView,
      selectRole,
      selectedRoleId,
    ],
  );

  return (
    <AdminRolesContext.Provider value={value}>
      {children}
    </AdminRolesContext.Provider>
  );
}
