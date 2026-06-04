import type { ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import AdminDepartmentsSubSidebar from './AdminDepartmentsSubSidebar';
import AdminEmployeesSubSidebar from './AdminEmployeesSubSidebar';
import AdminGenericSubSidebar from './AdminGenericSubSidebar';
import AdminRanksSubSidebar from './AdminRanksSubSidebar';
import AdminRolesSubSidebar from './AdminRolesSubSidebar';
import { subSidebarClass } from './adminLayoutStyles';

export default function AdminSubSidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathname = location.pathname;
  const selectedEmpStatCd = searchParams.get('empStatCd') ?? '';

  if (pathname.startsWith('/admin/org')) {
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
  } else {
    content = <AdminGenericSubSidebar pathname={pathname} />;
  }

  return <aside className={subSidebarClass}>{content}</aside>;
}
