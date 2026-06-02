import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  LogOut,
  Network,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Button from '../../common/button/Button';
import Badge from '../../common/dataDisplay/badge/Badge';
import { authApi } from '../../../api/authApi';
import { useAuth } from '../../../store/AuthContext';
import { adminEmployeeStatusOptions } from '../../../types/adminEmployee';
import type { AdminAccessResponse } from '../../../types/admin';
import { useOptionalAdminRoles } from '../../../pages/admin/adminRolesContext';

interface AdminLayoutProps {
  access: AdminAccessResponse;
  children: ReactNode;
}

interface AdminNavItem {
  label: string;
  path: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

interface EmployeeFilterItem {
  label: string;
  empStatCd?: string;
}

const adminNavItems: AdminNavItem[] = [
  { label: '사원', path: '/admin/users', icon: Users },
  { label: '권한', path: '/admin/roles', icon: ShieldCheck },
  { label: '게시판', path: '/admin/boards', icon: ClipboardList },
  { label: '프로젝트', path: '/admin/projects', icon: FolderKanban },
  { label: '조직도', path: '/admin/org', icon: Network },
  { label: '일정', path: '/admin/schedules', icon: CalendarDays },
];

const employeeFilterItems: EmployeeFilterItem[] = [
  { label: '전체 사원' },
  ...adminEmployeeStatusOptions.map((status) => ({
    label: status.label,
    empStatCd: status.code,
  })),
];

export default function AdminLayout({ access, children }: AdminLayoutProps) {
  const { clearAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmployeesPage = location.pathname.startsWith('/admin/users');
  const isRolesPage = location.pathname.startsWith('/admin/roles');
  const selectedEmpStatCd = searchParams.get('empStatCd') ?? '';
  const adminRoles = useOptionalAdminRoles();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const openEmployeeRegister = () => {
    window.dispatchEvent(new Event('admin:open-employee-register'));
  };

  const openRoleCreate = () => {
    window.dispatchEvent(new Event('admin:open-role-create'));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#edf3f8] text-slate-950">
      <aside className="flex h-screen w-24 flex-shrink-0 flex-col justify-between bg-[#0d1527] px-2 py-5 text-white">
        <div className="flex w-full flex-col items-center">
          <Link
            to="/admin/users"
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#5ac8fa] text-3xl font-black text-white no-underline shadow-md transition-transform hover:scale-105"
          >
            A
          </Link>

          <nav className="flex w-full flex-col gap-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
                    active
                      ? 'border border-white/80 bg-[#1e3155] font-bold text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[11px] font-bold leading-none tracking-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          to="/admin/settings"
          className={`flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
            location.pathname.startsWith('/admin/settings')
              ? 'border border-white/80 bg-[#1e3155] font-bold text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings size={22} />
          <span className="text-[11px] font-bold leading-none tracking-tight">
            설정
          </span>
        </Link>
      </aside>

      <aside className="flex h-screen w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-[#f8fafc] px-6 py-7">
        {isEmployeesPage ? (
          <>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              사원
            </h2>

            <Button
              variant="primary"
              leftIcon={<PlusCircle size={16} />}
              onClick={openEmployeeRegister}
              className="mt-5 h-11 rounded-lg text-base shadow-lg shadow-blue-200"
              fullWidth
            >
              사원 등록
            </Button>

            <div className="mt-9 flex flex-col gap-3">
              <p className="text-xs font-black text-slate-500">사원 메뉴</p>

              <div className="flex flex-col gap-1.5">
                {employeeFilterItems.map((item) => {
                  const active =
                    item.empStatCd === undefined
                      ? selectedEmpStatCd === ''
                      : selectedEmpStatCd === item.empStatCd;
                  const to = item.empStatCd
                    ? `/admin/users?empStatCd=${item.empStatCd}`
                    : '/admin/users';

                  return (
                    <Link
                      key={item.label}
                      to={to}
                      className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black no-underline transition ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-800 hover:bg-white'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {active ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-slate-800 bg-white" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.empStatCd && (
                        <span
                          className={`ml-3 h-2 w-2 rounded-full ${
                            active ? 'bg-white' : 'bg-slate-300'
                          }`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        ) : isRolesPage && adminRoles ? (
          <>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              권한
            </h2>

            <Button
              variant="primary"
              leftIcon={<PlusCircle size={16} />}
              onClick={openRoleCreate}
              className="mt-5 h-11 rounded-lg text-base shadow-lg shadow-blue-200"
              fullWidth
            >
              역할 생성
            </Button>

            <div className="mt-9 flex min-h-0 flex-1 flex-col gap-3">
              <p className="text-xs font-black text-slate-500">권한 메뉴</p>

              <div className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
                {adminRoles.rolesLoading ? (
                  <div className="rounded-xl bg-white px-3 py-4 text-sm font-bold text-slate-400">
                    역할을 불러오는 중
                  </div>
                ) : adminRoles.rolesError ? (
                  <div className="rounded-xl bg-red-50 px-3 py-4 text-sm font-bold text-red-600">
                    {adminRoles.rolesError.message}
                  </div>
                ) : adminRoles.roles.length > 0 ? (
                  adminRoles.roles.map((role) => {
                    const active = adminRoles.selectedRoleId === role.roleId;

                    return (
                      <button
                        key={role.roleId}
                        type="button"
                        onClick={() => adminRoles.selectRole(role.roleId)}
                        className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black transition ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-800 hover:bg-white'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {active ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <span className="h-4 w-4 rounded-full border border-slate-800 bg-white" />
                          )}
                          <span className="truncate">{role.roleName}</span>
                        </span>
                        <span
                          className={`ml-3 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {role.assignedEmployeeCount}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl bg-white px-3 py-4 text-sm font-bold text-slate-400">
                    등록된 역할이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              관리자
            </h2>

            <Link
              to="/admin/users"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white no-underline shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              <BriefcaseBusiness size={16} />
              사원 관리로 이동
            </Link>

            <div className="mt-9 flex flex-col gap-3">
              <p className="text-xs font-black text-slate-500">관리자 메뉴</p>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-black no-underline transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-800 hover:bg-white'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
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
            <Link
              to="/components"
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 no-underline transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              사용자 화면
            </Link>
            <Badge variant="success">ADMIN_CONSOLE_ACCESS</Badge>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={16} />}
              onClick={() => void handleLogout()}

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
