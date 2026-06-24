import { useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { authApi } from '../../../api/authApi';
import { useAuth } from '../../../store/AuthContext';
import type { AdminAccessResponse } from '../../../types/admin';
import AdminHeader from '../../common/admin/AdminHeader';
import AdminPrimarySidebar from '../../common/admin/AdminPrimarySidebar';
import AdminSubSidebar from '../../common/admin/AdminSubSidebar';
import { adminLayoutClass } from '../../common/admin/adminLayoutStyles';

interface AdminLayoutProps {
  access: AdminAccessResponse;
  children: ReactNode;
}

export default function AdminLayout({ access, children }: AdminLayoutProps) {
  const { clearAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className={adminLayoutClass}>
      <AdminPrimarySidebar pathname={location.pathname} />
      <AdminSubSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader access={access} onLogout={() => void handleLogout()} />

        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
