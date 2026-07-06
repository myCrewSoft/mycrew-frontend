import { useMemo } from 'react';
import { PlusCircle } from 'lucide-react';
import Button from '../button/Button';
import { useOptionalAdminDepartments } from '../../../pages/admin/adminDepartmentsHooks';
import { buildDepartmentTree } from './adminDepartmentTree';
import type { DepartmentTreeNode } from './adminDepartmentTree';
import { dispatchAdminEvent } from './adminEvents';
import AdminSelectionMark from './AdminSelectionMark';
import {
  adminSubSidebarActionButtonClass,
  getSubNavBadgeClass,
  getSubNavButtonClass,
  subSidebarErrorClass,
  subSidebarListClass,
  subSidebarMessageClass,
  subSidebarSectionClass,
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

const EMPTY_DEPARTMENTS = [];

function DepartmentTreeList({
  nodes,
  selectedDeptCd,
  selectDepartment,
  depth = 0,
}: {
  nodes: DepartmentTreeNode[];
  selectedDeptCd: string | null;
  selectDepartment: (deptCd: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        const { department } = node;
        const active = selectedDeptCd === department.deptCd;

        return (
          <div key={department.deptCd} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => selectDepartment(department.deptCd)}
              className={getSubNavButtonClass(active)}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <AdminSelectionMark active={active} />
                <span className="truncate">{department.deptNm}</span>
              </span>
              <span className={getSubNavBadgeClass(active)}>
                {department.memberCount}
              </span>
            </button>
            {node.children.length > 0 ? (
              <DepartmentTreeList
                nodes={node.children}
                selectedDeptCd={selectedDeptCd}
                selectDepartment={selectDepartment}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export default function AdminDepartmentsSubSidebar() {
  const adminDepartments = useOptionalAdminDepartments();
  const departments = adminDepartments?.departments ?? EMPTY_DEPARTMENTS;
  const departmentTree = useMemo(
    () => buildDepartmentTree(departments),
    [departments],
  );

  if (!adminDepartments) {
    return null;
  }

  return (
    <>
      <h2 className={subSidebarTitleClass}>부서</h2>

      <Button
        variant="primary"
        leftIcon={<PlusCircle size={16} />}
        onClick={() => dispatchAdminEvent('admin:open-department-create')}
        className={adminSubSidebarActionButtonClass}
        fullWidth
      >
        부서 생성
      </Button>

      <div className={subSidebarSectionClass}>
        <p className={subSidebarSectionLabelClass}>부서 목록</p>

        <div className={subSidebarListClass}>
          {adminDepartments.departmentsLoading ? (
            <div className={subSidebarMessageClass}>부서를 불러오는 중</div>
          ) : adminDepartments.departmentsError ? (
            <div className={subSidebarErrorClass}>
              {adminDepartments.departmentsError.message}
            </div>
          ) : departmentTree.length > 0 ? (
            <DepartmentTreeList
              nodes={departmentTree}
              selectedDeptCd={adminDepartments.selectedDeptCd}
              selectDepartment={adminDepartments.selectDepartment}
            />
          ) : (
            <div className={subSidebarMessageClass}>
              등록된 부서가 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
