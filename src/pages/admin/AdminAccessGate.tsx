import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, ShieldX } from 'lucide-react';
import Button from '../../components/common/button/Button';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import AdminLayout from '../../components/layouts/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import DashboardPage from '../dashboard/DashboardPage';
import { ADMIN_DASHBOARD_LAYOUT } from '../dashboard/dashboard.config';
import ApprovalTemplatePage from '../approval/ApprovalTemplatePage';
import AdminEmployeesPage from './AdminEmployeesPage';
import AdminDepartmentsPage from './AdminDepartmentsPage';
import AdminOrgChartPage from './AdminOrgChartPage';
import AdminAttendancePage from './AdminAttendancePage';
import AdminPage from './AdminPage';
import AdminRanksPage from './AdminRanksPage';
import AdminRolesPage from './AdminRolesPage';
import AdminBoardsPage from './AdminBoardsPage';
import { AdminDepartmentsProvider } from './adminDepartmentsContext';
import { AdminRanksProvider } from './adminRanksContext';
import { AdminRolesProvider } from './adminRolesContext';
import type { AdminAccessResponse } from '../../types/admin';
import RoomManagementPage from './Reservation/RoomAdminPage';
import ReservationAdminPage from './Reservation/ReservationAdminPage';
import AdminMtngStatsPage from './Meeting/AdminMtngStatsPage';
import AdminMtngPage from './Meeting/AdminMtngPage';
import AutoSchedulePage from './Schedule/AutoSchedulePage';
import HolidayApiPage from './Schedule/HolidayApiPage';
import ScheduleCategoryPage from './Schedule/ScheduleCategoryPage';
import OrgSchedulePage from './Schedule/OrgSchedulePage';

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

  // 관리자 메인 화면 = 대시보드 (서브 사이드바 없음)
  const isAdminRoot =
    location.pathname === '/admin' || location.pathname === '/admin/';

  if (isAdminRoot || location.pathname.startsWith('/admin/dashboard')) {
    return (
      <AdminLayout access={access}>
        <DashboardPage
          variant="admin"
          title="관리자 대시보드"
          description="조직 전체 현황을 한 화면에서 확인합니다."
          storageKey="mycrew.admin.dashboard.layout"
          defaultLayout={ADMIN_DASHBOARD_LAYOUT}
        />
      </AdminLayout>
    );
  }

  // 결재 양식 관리 (전체 양식 조회 + 생성/수정/삭제, 기안 기능은 숨김)
  if (location.pathname.startsWith('/admin/templates')) {
    return (
      <AdminLayout access={access}>
        <ApprovalTemplatePage manageOnly />
      </AdminLayout>
    );
  }

  if (location.pathname.startsWith('/admin/roles')) {
    return (
      <AdminRolesProvider>
        <AdminLayout access={access}>
          <AdminRolesPage />
        </AdminLayout>
      </AdminRolesProvider>
    );
  }

  if (location.pathname.startsWith('/admin/ranks')) {
    return (
      <AdminRanksProvider>
        <AdminLayout access={access}>
          <AdminRanksPage />
        </AdminLayout>
      </AdminRanksProvider>
    );
  }

  if (location.pathname.startsWith('/admin/departments')) {
    return (
      <AdminDepartmentsProvider>
        <AdminLayout access={access}>
          <AdminDepartmentsPage />
        </AdminLayout>
      </AdminDepartmentsProvider>
    );
  }

  if (location.pathname.startsWith('/admin/org')) {
    return (
      <AdminLayout access={access}>
        <AdminOrgChartPage />
      </AdminLayout>
    );
  }

  if (location.pathname.startsWith('/admin/attendance')) {
    return (
      <AdminLayout access={access}>
        <AdminAttendancePage />
      </AdminLayout>
    );
  }

  if (location.pathname.startsWith('/admin/boards')) {
    return (
      <AdminLayout access={access}>
        <AdminBoardsPage />
      </AdminLayout>
    );
  }

  if (location.pathname.startsWith('/admin/schedule')) {
    const renderPage = () => {
      if (location.pathname.startsWith('/admin/schedule/auto'))     return <AutoSchedulePage />
      if (location.pathname.startsWith('/admin/schedule/holiday'))  return <HolidayApiPage />
      if (location.pathname.startsWith('/admin/schedule/category')) return <ScheduleCategoryPage />
      return <OrgSchedulePage />
    }

    return (
      <AdminLayout access={access}>
        {renderPage()}
      </AdminLayout>
    )
  }

  if (location.pathname.startsWith('/admin/meeting')) {
    return (
      <AdminLayout access={access}>
        {location.pathname === '/admin/meeting/stats' ? <AdminMtngStatsPage /> : <AdminMtngPage />}
      </AdminLayout>
    );
  }

  if (location.pathname.startsWith('/admin/reservations')) {
    const view = new URLSearchParams(location.search).get('view')
    return (
      <AdminLayout access={access}>
        {view === 'reservations' ? <ReservationAdminPage /> : <RoomManagementPage />}
      </AdminLayout>
    );
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
