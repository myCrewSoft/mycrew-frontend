import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  Gauge,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Button from '../../common/button/Button';
import Badge from '../../common/dataDisplay/badge/Badge';
import { useAuth } from '../../../store/AuthContext';
import type { AdminAccessResponse } from '../../../types/admin';

interface AdminLayoutProps {
  access: AdminAccessResponse;
  children: ReactNode;
}

const adminNavItems = [
  { label: '대시보드', path: '/admin', icon: Gauge },
  { label: '사원', path: '/admin/users', icon: Users },
  { label: '권한', path: '/admin/roles', icon: ShieldCheck },
  { label: '설정', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ access, children }: AdminLayoutProps) {
  const { clearAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEmployeesPage = location.pathname.startsWith('/admin/users');

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const openEmployeeRegister = () => {
    window.dispatchEvent(new Event('admin:open-employee-register'));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7fb] text-slate-950">
      <aside className="flex h-screen w-24 flex-shrink-0 flex-col justify-between bg-[#0d1527] px-2 py-5 text-white">
        <div className="flex w-full flex-col items-center">
          <Link
            to="/admin"
            className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#5ac8fa] text-3xl font-black text-white no-underline shadow-md transition-transform hover:scale-105"
          >
            A
          </Link>

          <nav className="flex w-full flex-col gap-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.path === '/admin'
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
                    active
                      ? 'border border-white/70 bg-slate-800 font-bold text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[11px] font-semibold leading-none tracking-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          to="/components"
          className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl text-slate-300 no-underline transition-all duration-200 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft size={18} />
          <span className="text-[11px] font-semibold leading-none tracking-tight">
            사용자
          </span>
        </Link>
      </aside>

      <aside className="flex h-screen w-72 flex-shrink-0 flex-col gap-6 border-r border-slate-200 bg-[#f8fafc] p-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            {isEmployeesPage ? '사원' : '관리자'}
          </h2>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle size={16} />}
          onClick={openEmployeeRegister}
          disabled={!isEmployeesPage}
          fullWidth
        >
          사원 등록
        </Button>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            관리자 메뉴
          </p>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === '/admin'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex h-11 items-center rounded-xl px-3 text-sm font-bold no-underline transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white hover:text-blue-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-950">
              관리자 콘솔
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              접속 사번 {access.empId}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="success">ADMIN_CONSOLE_ACCESS</Badge>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={16} />}
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
