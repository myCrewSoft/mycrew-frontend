import type { ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import AdminDepartmentsSubSidebar from './AdminDepartmentsSubSidebar';
import AdminEmployeesSubSidebar from './AdminEmployeesSubSidebar';
import AdminGenericSubSidebar from './AdminGenericSubSidebar';
import AdminRanksSubSidebar from './AdminRanksSubSidebar';
import AdminRolesSubSidebar from './AdminRolesSubSidebar';
import AdminAttendanceSubSidebar from './AdminAttendanceSubSidebar';
import { subSidebarClass } from './adminLayoutStyles';

export default function AdminSubSidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathname = location.pathname;
  const selectedEmpStatCd = searchParams.get('empStatCd') ?? '';

  // 대시보드(관리자 메인)·조직도·결재 양식 관리는 자체 레이아웃을 써서 별도 서브 사이드바 없음
  if (
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/admin/org') ||
    pathname.startsWith('/admin/templates')
  ) {
    return null;
  }

  let content: ReactNode;

  if (pathname.startsWith('/admin/users')) {
    content = <AdminEmployeesSubSidebar selectedEmpStatCd={selectedEmpStatCd} />;
  } else if (pathname.startsWith('/admin/roles')) {
    content = <AdminRolesSubSidebar />;
  } else if (pathname.startsWith('/admin/ranks')) {
    content = <AdminRanksSubSidebar />;
  } else if (pathname.startsWith('/admin/departments')) {
    content = <AdminDepartmentsSubSidebar />;
  } else if (pathname.startsWith('/admin/attendance')) {
    content = <AdminAttendanceSubSidebar />;
  } else {
    content = <AdminGenericSubSidebar pathname={pathname} />;
  }

  return <aside className={subSidebarClass}>{content}</aside>;
}
