import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import Button from '../button/Button';
import { employeeFilterItems } from './adminLayoutConfig';
import { dispatchAdminEvent } from './adminEvents';
import AdminSelectionMark from './AdminSelectionMark';
import {
  adminSubSidebarActionButtonClass,
  getSubNavLinkClass,
  subSidebarSectionClass,
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

interface AdminEmployeesSubSidebarProps {
  selectedEmpStatCd: string;
}

export default function AdminEmployeesSubSidebar({
  selectedEmpStatCd,
}: AdminEmployeesSubSidebarProps) {
  return (
    <>
      <h2 className={subSidebarTitleClass}>사원</h2>

      <Button
        variant="primary"
        leftIcon={<PlusCircle size={16} />}
        onClick={() => dispatchAdminEvent('admin:open-employee-register')}
        className={adminSubSidebarActionButtonClass}
        fullWidth
      >
        사원 등록
      </Button>

      <div className={subSidebarSectionClass}>
        <p className={subSidebarSectionLabelClass}>사원 메뉴</p>

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
                className={getSubNavLinkClass(active)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AdminSelectionMark active={active} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.empStatCd ? (
                  <span
                    className={`ml-3 h-2 w-2 rounded-full ${
                      active ? 'bg-white' : 'bg-slate-300'
                    }`}
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
