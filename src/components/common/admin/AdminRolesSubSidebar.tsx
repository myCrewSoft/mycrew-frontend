import { PlusCircle } from 'lucide-react';
import Button from '../button/Button';
import { useOptionalAdminRoles } from '../../../pages/admin/adminRolesHooks';
import { dispatchAdminEvent } from './adminEvents';
import AdminSelectionMark from './AdminSelectionMark';
import {
  getSubNavBadgeClass,
  getSubNavButtonClass,
  subSidebarErrorClass,
  subSidebarListClass,
  subSidebarMessageClass,
  subSidebarSectionClass,
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

export default function AdminRolesSubSidebar() {
  const adminRoles = useOptionalAdminRoles();

  if (!adminRoles) {
    return null;
  }

  return (
    <>
      <h2 className={subSidebarTitleClass}>권한</h2>

      <Button
        variant="primary"
        leftIcon={<PlusCircle size={16} />}
        onClick={() => dispatchAdminEvent('admin:open-role-create')}
        className="mt-5 h-11 rounded-lg text-base shadow-lg shadow-blue-200"
        fullWidth
      >
        역할 생성
      </Button>

      <div className={subSidebarSectionClass}>
        <p className={subSidebarSectionLabelClass}>권한 메뉴</p>

        <div className={subSidebarListClass}>
          <button
            type="button"
            onClick={adminRoles.selectPermissionsView}
            className={getSubNavButtonClass(adminRoles.isPermissionsView)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <AdminSelectionMark active={adminRoles.isPermissionsView} />
              <span className="truncate">전체 권한</span>
            </span>
          </button>

          {adminRoles.rolesLoading ? (
            <div className={subSidebarMessageClass}>역할을 불러오는 중</div>
          ) : adminRoles.rolesError ? (
            <div className={subSidebarErrorClass}>
              {adminRoles.rolesError.message}
            </div>
          ) : adminRoles.roles.length > 0 ? (
            adminRoles.roles.map((role) => {
              const active =
                !adminRoles.isPermissionsView &&
                adminRoles.selectedRoleId === role.roleId;

              return (
                <button
                  key={role.roleId}
                  type="button"
                  onClick={() => adminRoles.selectRole(role.roleId)}
                  className={getSubNavButtonClass(active)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <AdminSelectionMark active={active} />
                    <span className="truncate">{role.roleName}</span>
                  </span>
                  <span className={getSubNavBadgeClass(active)}>
                    {role.assignedEmployeeCount}
                  </span>
                </button>
              );
            })
          ) : (
            <div className={subSidebarMessageClass}>
              등록된 역할이 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
