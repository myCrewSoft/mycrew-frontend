import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, ShieldX } from 'lucide-react';
import Button from '../../components/common/button/Button';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import AdminLayout from '../../components/layouts/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import AdminEmployeesPage from './AdminEmployeesPage';
import AdminPage from './AdminPage';
import type { AdminAccessResponse } from '../../types/admin';

export default function AdminAccessGate() {
  const location = useLocation();
  const [access, setAccess] = useState<AdminAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminApi.getAccess();
        const data = response.data.data;

        if (!data?.adminAccessible) {
          throw new ApiError(
            '관리자 콘솔 접근 권한이 없습니다.',
            'ADMIN_ACCESS_DENIED',
            403,
          );
        }

        if (active) {
          setAccess(data);
        }
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError((err as Error).message, 'UNKNOWN', 0);

        if (active) {
          setError(apiError);
          setAccess(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void verifyAccess();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f6f7fb]">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          관리자 접근 권한 확인 중
        </div>
      </div>
    );
  }

  if (error) {
    const isDenied = error.httpStatus === 403;

    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f6f7fb] p-6">
        <div className="w-full max-w-xl">
          <EmptyState
            icon={
              isDenied ? (
                <ShieldX size={24} />
              ) : (
                <AlertTriangle size={24} />
              )
            }
            title={
              isDenied
                ? '관리자 접근 권한이 없습니다.'
                : '관리자 콘솔을 열 수 없습니다.'
            }
            description={error.message}
            actions={
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = '/components';
                }}
              >
                사용자 화면으로 이동
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (!access) {
    return null;
  }

  return (
    <AdminLayout access={access}>
      {location.pathname.startsWith('/admin/users') ? (
        <AdminEmployeesPage key={location.search} />
      ) : (
        <AdminPage access={access} />
      )}
    </AdminLayout>
  );
}
