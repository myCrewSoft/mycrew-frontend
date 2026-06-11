import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  KeyRound,
  Pencil,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import type { PageInfo } from '../../api/axiosInstance';
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import Button from '../../components/common/button/Button';
import Checkbox from '../../components/common/form/checkbox/Checkbox';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import FormField from '../../components/common/form/formField/FormField';
import Modal from '../../components/common/overlay/modal/Modal';
import Pagination from '../../components/common/dataDisplay/pagination/Pagination';
import SearchInput from '../../components/common/form/searchInput/SearchInput';
import Select from '../../components/common/form/select/Select';
import Textarea from '../../components/common/form/textarea/Textarea';
import { useAdminRoles } from './adminRolesHooks';
import type {
  PermissionResponse,
  RoleDetailResponse,
  RoleEmployeeResponse,
  RoleScopeType,
  ScopeOptionResponse,
} from '../../types/admin';
import type { AdminEmployeeListItem } from '../../types/adminEmployee';

const pageSize = 10;

const protectedRoleCodes = ['ROLE_SUPER_ADMIN', 'ROLE_EMPLOYEE_SELF'];

const scopeOptions: Array<{ value: RoleScopeType; label: string }> = [
  { value: 'GLOBAL', label: '전체' },
  { value: 'DEPT', label: '부서' },
  { value: 'PROJECT', label: '프로젝트' },
  { value: 'TASK', label: '업무' },
  { value: 'SELF', label: '본인' },
];

type ScopedOptionType = Extract<RoleScopeType, 'DEPT' | 'PROJECT' | 'TASK'>;

type PermissionCategory =
  | 'ALL'
  | 'ADMIN'
  | 'DEPT'
  | 'BOARD'
  | 'PROJECT'
  | 'TASK'
  | 'OTHER';

const permissionCategoryOptions: Array<{
  value: PermissionCategory;
  label: string;
}> = [
  { value: 'ALL', label: '전체' },
  { value: 'ADMIN', label: '관리자' },
  { value: 'DEPT', label: '부서' },
  { value: 'BOARD', label: '게시판' },
  { value: 'PROJECT', label: '프로젝트' },
  { value: 'TASK', label: '업무' },
  { value: 'OTHER', label: '기타' },
];

const roleErrorMessages: Record<string, string> = {
  AUTH_002: '접근 권한이 없습니다.',
  COMMON_001: '입력값을 확인해 주세요.',
  ROLE_001: '역할을 찾을 수 없습니다.',
  PERM_001: '존재하지 않거나 비활성화된 권한이 포함되어 있습니다.',
  ROLE_002: '이미 사용 중인 역할 코드입니다.',
};

interface RoleFormState {
  roleCode: string;
  roleName: string;
  description: string;
  permissionIds: number[];
}

interface AssignFormState {
  empIds: number[];
  scopeTypeCd: RoleScopeType;
  scopeId: string;
}

interface ConfirmAction {
  title: string;
  description: string;
  confirmText: string;
  variant?: 'confirm' | 'danger';
  onConfirm: () => Promise<void> | void;
}

interface GroupedRoleEmployee {
  empId: number;
  prflImgFileId: number | null;
  employeeName: string;
  deptCd: string | null;
  deptName: string | null;
  enabled: 'Y' | 'N';
  assignments: RoleEmployeeResponse[];
}

const createEmptyRoleForm = (): RoleFormState => ({
  roleCode: '',
  roleName: '',
  description: '',
  permissionIds: [],
});

const createEmptyAssignForm = (): AssignFormState => ({
  empIds: [],
  scopeTypeCd: 'GLOBAL',
  scopeId: '',
});

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const getErrorMessage = (err: unknown) => {
  const apiError = toApiError(err);
  const fallback = roleErrorMessages[apiError.errorCode];

  return apiError.message || fallback || '요청 처리 중 오류가 발생했습니다.';
};

const formatCode = (value: string | null | undefined, fallback = '-') =>
  value && value.trim() ? value : fallback;

const getEmployeeDepartment = (employee: AdminEmployeeListItem) =>
  formatCode(employee.department?.deptNm ?? employee.deptCd);

const getEmployeePosition = (employee: AdminEmployeeListItem) =>
  formatCode(
    employee.jobPosition?.jobPstnNm ??
      employee.jobGrade?.jobGrdNm ??
      employee.jobPstnCd ??
      employee.jobGrdCd,
  );

const getEmployeeStatus = (employee: AdminEmployeeListItem) =>
  employee.empStat?.empStatNm ?? employee.empStatCd ?? '-';

const requiresScopeId = (scopeTypeCd: RoleScopeType) =>
  scopeTypeCd === 'DEPT' ||
  scopeTypeCd === 'PROJECT' ||
  scopeTypeCd === 'TASK';

const inferPermissionCategory = (
  permission: PermissionResponse,
): PermissionCategory => {
  const prefix = permission.permissionCode.split('_')[0]?.toUpperCase();

  return permissionCategoryOptions.some(
    (category) => category.value === prefix && category.value !== 'ALL',
  )
    ? (prefix as PermissionCategory)
    : 'OTHER';
};

const buildRoleForm = (role: RoleDetailResponse): RoleFormState => ({
  roleCode: role.roleCode,
  roleName: role.roleName,
  description: role.description ?? '',
  permissionIds: role.permissions.map((permission) => permission.permissionId),
});

const groupRoleEmployees = (
  employees: RoleEmployeeResponse[],
): GroupedRoleEmployee[] => {
  const grouped = new Map<number, GroupedRoleEmployee>();

  for (const employee of employees) {
    const current = grouped.get(employee.empId);

    if (current) {
      current.assignments.push(employee);
      current.enabled =
        current.enabled === 'Y' || employee.enabled === 'Y' ? 'Y' : 'N';
      current.deptCd = current.deptCd ?? employee.deptCd;
      current.deptName = current.deptName ?? employee.deptName;
      continue;
    }

    grouped.set(employee.empId, {
      empId: employee.empId,
      prflImgFileId: employee.prflImgFileId,
      employeeName: employee.employeeName,
      deptCd: employee.deptCd,
      deptName: employee.deptName,
      enabled: employee.enabled,
      assignments: [employee],
    });
  }

  return Array.from(grouped.values());
};

const formatAssignmentScope = (assignment: RoleEmployeeResponse) =>
  assignment.scopeId
    ? `${assignment.scopeTypeCd} ${assignment.scopeId}`
    : assignment.scopeTypeCd;

export default function AdminRolesPage() {
  const {
    roles,
    rolesLoading,
    rolesError,
    selectedRoleId,
    isPermissionsView,
    selectRole,
    reloadRoles,
  } = useAdminRoles();
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [permissionUpdatingId, setPermissionUpdatingId] = useState<
    number | null
  >(null);
  const [permissionStatusError, setPermissionStatusError] = useState<
    string | null
  >(null);
  const [permissionKeyword, setPermissionKeyword] = useState('');
  const [submittedPermissionKeyword, setSubmittedPermissionKeyword] =
    useState('');
  const [permissionListCategory, setPermissionListCategory] =
    useState<PermissionCategory>('ALL');
  const [rolePermissionCategory, setRolePermissionCategory] =
    useState<PermissionCategory>('ALL');
  const [scopeOptionMap, setScopeOptionMap] = useState<
    Record<ScopedOptionType, ScopeOptionResponse[]>
  >({
    DEPT: [],
    PROJECT: [],
    TASK: [],
  });
  const [scopeOptionsLoading, setScopeOptionsLoading] = useState(true);
  const [scopeOptionsError, setScopeOptionsError] = useState<string | null>(
    null,
  );
  const [roleDetail, setRoleDetail] = useState<RoleDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([]);
  const [employeesPagination, setEmployeesPagination] =
    useState<PageInfo | null>(null);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [employeeKeyword, setEmployeeKeyword] = useState('');
  const [submittedEmployeeKeyword, setSubmittedEmployeeKeyword] = useState('');
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [roleModalMode, setRoleModalMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [roleForm, setRoleForm] = useState<RoleFormState>(createEmptyRoleForm);
  const [roleSubmitError, setRoleSubmitError] = useState<string | null>(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replacementRoleId, setReplacementRoleId] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] =
    useState<AssignFormState>(createEmptyAssignForm);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>(
    [],
  );
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const selectedRoleSummary = useMemo(
    () => roles.find((role) => role.roleId === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const isProtectedRole = Boolean(
    roleDetail && protectedRoleCodes.includes(roleDetail.roleCode),
  );

  const selectedAssignments = useMemo(
    () =>
      roleDetail?.employees.filter((employee) =>
        selectedAssignmentIds.includes(employee.roleAssignmentId),
      ) ?? [],
    [roleDetail, selectedAssignmentIds],
  );

  const groupedRoleEmployees = useMemo(
    () => groupRoleEmployees(roleDetail?.employees ?? []),
    [roleDetail],
  );

  const filteredPermissions = useMemo(() => {
    const keyword = submittedPermissionKeyword.trim().toLowerCase();

    return permissions.filter((permission) => {
      const matchesCategory =
        permissionListCategory === 'ALL' ||
        inferPermissionCategory(permission) === permissionListCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [
        permission.permissionCode,
        permission.permissionName,
        permission.description ?? '',
        permission.enabled === 'Y' ? '사용' : '비활성',
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [permissionListCategory, permissions, submittedPermissionKeyword]);

  const filteredRoleFormPermissions = useMemo(() => {
    if (rolePermissionCategory === 'ALL') {
      return permissions;
    }

    return permissions.filter(
      (permission) =>
        inferPermissionCategory(permission) === rolePermissionCategory,
    );
  }, [permissions, rolePermissionCategory]);

  const currentScopeOptions = useMemo(() => {
    if (!requiresScopeId(assignForm.scopeTypeCd)) {
      return [];
    }

    return scopeOptionMap[assignForm.scopeTypeCd as ScopedOptionType];
  }, [assignForm.scopeTypeCd, scopeOptionMap]);

  const fetchSelectedRoleDetail = useCallback(async () => {
    if (!selectedRoleId) {
      setRoleDetail(null);
      setSelectedAssignmentIds([]);
      return null;
    }

    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await adminApi.getRoleDetail(selectedRoleId);
      const detail = response.data.data ?? null;
      setRoleDetail(detail);
      setSelectedAssignmentIds([]);

      if (!detail) {
        setDetailError('역할 상세 정보를 찾을 수 없습니다.');
      }

      return detail;
    } catch (err) {
      setRoleDetail(null);
      setSelectedAssignmentIds([]);
      setDetailError(getErrorMessage(err));
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, [selectedRoleId]);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError(null);

    try {
      const response = await adminApi.getPermissions();
      setPermissions(response.data.data ?? []);
    } catch (err) {
      setPermissions([]);
      setPermissionsError(getErrorMessage(err));
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchPermissions();
    });
  }, [fetchPermissions]);

  useEffect(() => {
    let active = true;

    const loadScopeOptions = async () => {
      setScopeOptionsLoading(true);
      setScopeOptionsError(null);

      try {
        const [departmentResponse, projectResponse, taskResponse] =
          await Promise.all([
            adminApi.getDepartmentScopeOptions(),
            adminApi.getProjectScopeOptions(),
            adminApi.getTaskScopeOptions(),
          ]);

        if (active) {
          setScopeOptionMap({
            DEPT: departmentResponse.data.data ?? [],
            PROJECT: projectResponse.data.data ?? [],
            TASK: taskResponse.data.data ?? [],
          });
        }
      } catch (err) {
        if (active) {
          setScopeOptionMap({
            DEPT: [],
            PROJECT: [],
            TASK: [],
          });
          setScopeOptionsError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setScopeOptionsLoading(false);
        }
      }
    };

    void loadScopeOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchSelectedRoleDetail();
    });
  }, [fetchSelectedRoleDetail]);

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      setEmployeesLoading(true);
      setEmployeesError(null);

      try {
        const response = await adminApi.getEmployees({
          page: employeesPage - 1,
          size: pageSize,
          keyword: submittedEmployeeKeyword || undefined,
        });

        if (active) {
          setEmployees(response.data.data ?? []);
          setEmployeesPagination(response.data.pagination ?? null);
        }
      } catch (err) {
        if (active) {
          setEmployees([]);
          setEmployeesPagination(null);
          setEmployeesError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setEmployeesLoading(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      active = false;
    };
  }, [employeesPage, submittedEmployeeKeyword]);

  useEffect(() => {
    const openCreate = () => {
      setRoleForm(createEmptyRoleForm());
      setRoleSubmitError(null);
      setRoleModalMode('create');
    };

    window.addEventListener('admin:open-role-create', openCreate);
    return () => {
      window.removeEventListener('admin:open-role-create', openCreate);
    };
  }, []);

  const reloadAll = () => {
    reloadRoles();
    void fetchSelectedRoleDetail();
  };

  const updateRoleForm = (
    key: keyof RoleFormState,
    value: string | number[],
  ) => {
    setRoleForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleRolePermission = (permissionId: number) => {
    setRoleForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  };

  const openEditModal = () => {
    if (!roleDetail) {
      return;
    }

    setRoleForm(buildRoleForm(roleDetail));
    setRoleSubmitError(null);
    setRoleModalMode('edit');
  };

  const closeRoleModal = () => {
    if (roleSubmitting) {
      return;
    }

    setRoleModalMode(null);
    setRoleSubmitError(null);
  };

  const handleRoleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roleForm.roleName.trim()) {
      setRoleSubmitError('역할명을 입력해 주세요.');
      return;
    }

    if (roleForm.permissionIds.length === 0) {
      setRoleSubmitError('권한을 하나 이상 선택해 주세요.');
      return;
    }

    if (roleModalMode === 'create' && !roleForm.roleCode.trim()) {
      setRoleSubmitError('역할 코드를 입력해 주세요.');
      return;
    }

    if (roleModalMode === 'edit') {
      setConfirmAction({
        title: '역할 수정을 저장할까요?',
        description: `${roleForm.roleName.trim()} 역할의 이름, 설명, 권한 구성이 변경됩니다.`,
        confirmText: '수정',
        onConfirm: submitRoleForm,
      });
      return;
    }

    await submitRoleForm();
  };

  const submitRoleForm = async () => {
    setRoleSubmitting(true);
    setRoleSubmitError(null);

    try {
      const description = roleForm.description.trim() || null;
      const response =
        roleModalMode === 'create'
          ? await adminApi.createRole({
              roleCode: roleForm.roleCode.trim(),
              roleName: roleForm.roleName.trim(),
              description,
              permissionIds: roleForm.permissionIds,
            })
          : selectedRoleId
            ? await adminApi.updateRole(selectedRoleId, {
                roleName: roleForm.roleName.trim(),
                description,
                permissionIds: roleForm.permissionIds,
              })
            : null;
      const nextDetail = response?.data.data ?? null;

      setRoleModalMode(null);
      reloadRoles();

      if (nextDetail) {
        setRoleDetail(nextDetail);
        selectRole(nextDetail.roleId);
      }
    } catch (err) {
      setRoleSubmitError(getErrorMessage(err));
    } finally {
      setRoleSubmitting(false);
    }
  };

  const openDeleteModal = () => {
    setReplacementRoleId('');
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) {
      return;
    }

    setDeleteOpen(false);
    setDeleteError(null);
  };

  const requestDeleteConfirmation = () => {
    if (!roleDetail) {
      return;
    }

    if (isProtectedRole) {
      setDeleteError('이 역할은 삭제할 수 없습니다.');
      return;
    }

    const hasAssignedEmployees = roleDetail.employees.length > 0;
    const replacement = replacementRoleId ? Number(replacementRoleId) : null;

    if (hasAssignedEmployees && !replacement) {
      setDeleteError('배정된 사원이 있으면 대체 역할을 선택해야 합니다.');
      return;
    }

    if (replacement === roleDetail.roleId) {
      setDeleteError('삭제 대상 역할은 대체 역할로 선택할 수 없습니다.');
      return;
    }

    setConfirmAction({
      title: '역할을 삭제할까요?',
      description: `${roleDetail.roleName} 역할이 삭제됩니다. 배정 사원이 있으면 선택한 대체 역할로 이관됩니다.`,
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: () => deleteRole(replacement),
    });
  };

  const deleteRole = async (replacement: number | null) => {
    if (!roleDetail) {
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await adminApi.deleteRole(roleDetail.roleId, {
        replacementRoleId: replacement,
      });
      setDeleteOpen(false);
      setRoleDetail(null);
      reloadRoles();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openAssignModal = () => {
    setAssignForm(createEmptyAssignForm());
    setAssignError(null);
    setAssignOpen(true);
  };

  const closeAssignModal = () => {
    if (assignSubmitting) {
      return;
    }

    setAssignOpen(false);
    setAssignError(null);
  };

  const toggleAssignEmployee = (empId: number) => {
    setAssignForm((current) => ({
      ...current,
      empIds: current.empIds.includes(empId)
        ? current.empIds.filter((id) => id !== empId)
        : [...current.empIds, empId],
    }));
  };

  const updateAssignScope = (scopeTypeCd: RoleScopeType) => {
    setAssignForm((current) => ({
      ...current,
      scopeTypeCd,
      scopeId: '',
    }));
  };

  const handleAssignRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRoleId) {
      return;
    }

    if (assignForm.empIds.length === 0) {
      setAssignError('역할을 배정할 사원을 선택해 주세요.');
      return;
    }

    const needsScopeId = requiresScopeId(assignForm.scopeTypeCd);
    const scopeId = assignForm.scopeId.trim();

    if (needsScopeId && !scopeId) {
      setAssignError('선택한 범위의 scopeId를 입력해 주세요.');
      return;
    }

    setConfirmAction({
      title: '역할을 배정할까요?',
      description: `${assignForm.empIds.length}명의 사원에게 ${roleDetail?.roleName ?? '선택한'} 역할을 배정합니다.`,
      confirmText: '배정',
      onConfirm: assignRole,
    });
  };

  const assignRole = async () => {
    if (!selectedRoleId) {
      return;
    }

    const needsScopeId = requiresScopeId(assignForm.scopeTypeCd);
    const scopeId = assignForm.scopeId.trim();

    setAssignSubmitting(true);
    setAssignError(null);

    try {
      const response = await adminApi.assignRole(selectedRoleId, {
        empIds: assignForm.empIds,
        scopeTypeCd: assignForm.scopeTypeCd,
        scopeId: needsScopeId ? scopeId : null,
      });

      setRoleDetail(response.data.data ?? null);
      setAssignOpen(false);
      reloadRoles();
    } catch (err) {
      setAssignError(getErrorMessage(err));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const toggleAssignmentSelection = (employee: GroupedRoleEmployee) => {
    const assignmentIds = employee.assignments.map(
      (assignment) => assignment.roleAssignmentId,
    );

    setSelectedAssignmentIds((current) => {
      const selected = assignmentIds.every((id) => current.includes(id));

      return selected
        ? current.filter((id) => !assignmentIds.includes(id))
        : Array.from(new Set([...current, ...assignmentIds]));
    });
  };

  const handleRevokeAssignments = async () => {
    if (!selectedRoleId || selectedAssignments.length === 0) {
      setRevokeError('해제할 배정 사원을 선택해 주세요.');
      return;
    }

    setRevokeSubmitting(true);
    setRevokeError(null);

    try {
      const groups = selectedAssignments.reduce<
        Record<string, RoleEmployeeResponse[]>
      >((acc, assignment) => {
        const key = `${assignment.scopeTypeCd}:${assignment.scopeId ?? ''}`;
        acc[key] = [...(acc[key] ?? []), assignment];
        return acc;
      }, {});

      let nextDetail: RoleDetailResponse | null = null;

      for (const group of Object.values(groups)) {
        const first = group[0];
        const response = await adminApi.revokeRole(selectedRoleId, {
          empIds: group.map((assignment) => assignment.empId),
          scopeTypeCd: first.scopeTypeCd,
          scopeId: first.scopeId,
        });
        nextDetail = response.data.data ?? nextDetail;
      }

      if (nextDetail) {
        setRoleDetail(nextDetail);
        setSelectedAssignmentIds([]);
      } else {
        await fetchSelectedRoleDetail();
      }

      reloadRoles();
    } catch (err) {
      setRevokeError(getErrorMessage(err));
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const handleEmployeeSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmployeesPage(1);
    setSubmittedEmployeeKeyword(employeeKeyword.trim());
  };

  const handlePermissionSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedPermissionKeyword(permissionKeyword.trim());
  };

  const updatePermissionStatus = async (
    permission: PermissionResponse,
    enabled: 'Y' | 'N',
  ) => {
    setPermissionUpdatingId(permission.permissionId);
    setPermissionStatusError(null);

    try {
      const response = await adminApi.updatePermissionStatus(
        permission.permissionId,
        { enabled },
      );
      const updatedPermission = response.data.data;

      if (updatedPermission) {
        setPermissions((current) =>
          current.map((item) =>
            item.permissionId === updatedPermission.permissionId
              ? updatedPermission
              : item,
          ),
        );
        setRoleDetail((current) =>
          current
            ? {
                ...current,
                permissions: current.permissions.map((item) =>
                  item.permissionId === updatedPermission.permissionId
                    ? updatedPermission
                    : item,
                ),
              }
            : current,
        );
      }
    } catch (err) {
      setPermissionStatusError(getErrorMessage(err));
    } finally {
      setPermissionUpdatingId(null);
    }
  };

  const requestPermissionStatusConfirmation = (
    permission: PermissionResponse,
    enabled: 'Y' | 'N',
  ) => {
    setConfirmAction({
      title:
        enabled === 'Y'
          ? '권한을 사용 상태로 변경할까요?'
          : '권한을 비활성화할까요?',
      description: `${permission.permissionName} 권한의 사용 여부가 변경됩니다.`,
      confirmText: enabled === 'Y' ? '사용' : '비활성화',
      variant: enabled === 'Y' ? 'confirm' : 'danger',
      onConfirm: () => updatePermissionStatus(permission, enabled),
    });
  };

  const runConfirmedAction = async () => {
    const action = confirmAction;

    if (!action) {
      return;
    }

    await action.onConfirm();
    setConfirmAction(null);
  };

  const replacementOptions = roles.filter(
    (role) => role.roleId !== roleDetail?.roleId,
  );

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            역할 권한 관리
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            역할, 권한, 사원 배정을 한 화면에서 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={17} />}
            loading={rolesLoading || detailLoading}
            onClick={reloadAll}
          >
            새로고침
          </Button>
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={17} />}
            onClick={() => {
              setRoleForm(createEmptyRoleForm());
              setRoleSubmitError(null);
              setRoleModalMode('create');
            }}
          >
            역할 생성
          </Button>
        </div>
      </div>

      {isPermissionsView ? (
        <ContentCard
          title="전체 권한"
          description="시스템에서 제공하는 모든 권한과 사용 여부를 관리합니다."
          actions={
            <div className="flex flex-wrap justify-end gap-2">
              <form onSubmit={handlePermissionSearch} className="flex gap-2">
                <SearchInput
                  value={permissionKeyword}
                  onChange={(event) => setPermissionKeyword(event.target.value)}
                  placeholder="권한명, 코드, 설명 검색"
                  aria-label="권한 검색"
                  wrapperClassName="min-w-72"
                />
                <Button type="submit" variant="outline" size="sm">
                  검색
                </Button>
              </form>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={15} />}
                loading={permissionsLoading}
                onClick={() => void fetchPermissions()}
              >
                새로고침
              </Button>
            </div>
          }
        >
          {permissionStatusError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {permissionStatusError}
            </p>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            {permissionCategoryOptions.map((category) => (
              <label
                key={category.value}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-bold transition ${
                  permissionListCategory === category.value
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="permission-list-category"
                  value={category.value}
                  checked={permissionListCategory === category.value}
                  onChange={() => setPermissionListCategory(category.value)}
                  className="sr-only"
                />
                {category.label}
              </label>
            ))}
          </div>
          {permissionsError ? (
            <EmptyState
              title="권한 목록을 불러오지 못했습니다."
              description={permissionsError}
              actions={
                <Button variant="outline" onClick={() => void fetchPermissions()}>
                  다시 시도
                </Button>
              }
            />
          ) : (
            <div className="max-h-[32rem] overflow-y-auto pr-1">
              <DataTable
                data={filteredPermissions}
                getRowKey={(permission) => String(permission.permissionId)}
                emptyText={
                  permissionsLoading
                    ? '권한 목록을 불러오는 중입니다.'
                    : submittedPermissionKeyword
                      ? '검색 결과가 없습니다.'
                      : '등록된 권한이 없습니다.'
                }
                columns={[
                  {
                    key: 'permission',
                    header: '권한',
                    render: (permission) => (
                      <div>
                        <div className="font-bold text-slate-950">
                          {permission.permissionName}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          {permission.permissionCode}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'description',
                    header: '설명',
                    render: (permission) =>
                      formatCode(permission.description, '-'),
                  },
                  {
                    key: 'enabled',
                    header: '사용 여부',
                    render: (permission) => (
                      <Badge
                        variant={
                          permission.enabled === 'Y' ? 'success' : 'neutral'
                        }
                      >
                        {permission.enabled === 'Y' ? '사용' : '비활성'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: '관리',
                    className: 'text-right',
                    render: (permission) => {
                      const nextEnabled =
                        permission.enabled === 'Y' ? 'N' : 'Y';

                      return (
                        <Button
                          variant={
                            permission.enabled === 'Y' ? 'outline' : 'primary'
                          }
                          size="sm"
                          loading={
                            permissionUpdatingId === permission.permissionId
                          }
                          onClick={() =>
                            requestPermissionStatusConfirmation(
                              permission,
                              nextEnabled,
                            )
                          }
                        >
                          {permission.enabled === 'Y' ? '비활성화' : '사용'}
                        </Button>
                      );
                    },
                  },
                ]}
              />
            </div>
          )}
        </ContentCard>
      ) : rolesError ? (
        <EmptyState
          title="역할 목록을 불러오지 못했습니다."
          description={rolesError.message}
          actions={
            <Button variant="outline" onClick={reloadRoles}>
              다시 시도
            </Button>
          }
        />
      ) : roles.length === 0 && !rolesLoading ? (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title="등록된 역할이 없습니다."
          description="역할 생성 버튼으로 새 역할과 권한을 등록할 수 있습니다."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ContentCard title="선택 역할">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-2xl font-bold tracking-tight text-slate-950">
                    {roleDetail?.roleName ?? selectedRoleSummary?.roleName ?? '-'}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                    {roleDetail?.roleCode ?? selectedRoleSummary?.roleCode ?? '-'}
                  </p>
                </div>
                <ShieldCheck size={26} className="shrink-0 text-blue-600" />
              </div>
            </ContentCard>

            <ContentCard title="연결 권한">
              <div className="flex items-end justify-between gap-4">
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {roleDetail?.permissions.length ??
                    selectedRoleSummary?.permissionCount ??
                    0}
                </div>
                <KeyRound size={26} className="text-violet-600" />
              </div>
            </ContentCard>

            <ContentCard title="배정 사원">
              <div className="flex items-end justify-between gap-4">
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {roleDetail
                    ? groupedRoleEmployees.length
                    : (selectedRoleSummary?.assignedEmployeeCount ?? 0)}
                </div>
                <Users size={26} className="text-emerald-600" />
              </div>
            </ContentCard>
          </div>

          <ContentCard
            title={roleDetail?.roleName ?? '역할 상세'}
            description={
              roleDetail?.description ??
              '선택한 역할의 권한과 배정 사원을 관리합니다.'
            }
            actions={
              roleDetail ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Pencil size={15} />}
                    onClick={openEditModal}
                  >
                    역할 수정
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={15} />}
                    onClick={openDeleteModal}
                    disabled={isProtectedRole}
                  >
                    역할 삭제
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus size={15} />}
                    onClick={openAssignModal}
                  >
                    역할 배정
                  </Button>
                </>
              ) : null
            }
          >
            {detailLoading ? (
              <div className="py-10 text-center text-sm font-semibold text-slate-500">
                역할 상세 정보를 불러오는 중입니다.
              </div>
            ) : detailError ? (
              <EmptyState
                title="역할 상세 정보를 불러오지 못했습니다."
                description={detailError}
                actions={
                  <Button variant="outline" onClick={fetchSelectedRoleDetail}>
                    다시 시도
                  </Button>
                }
              />
            ) : roleDetail ? (
              <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      연결 권한
                    </h3>
                    <Badge variant="outline">
                      {roleDetail.permissions.length}개
                    </Badge>
                  </div>
                  <div className="mt-4 flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                    {roleDetail.permissions.length > 0 ? (
                      roleDetail.permissions.map((permission) => (
                        <div
                          key={permission.permissionId}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {permission.permissionName}
                            </span>
                            <Badge
                              variant={
                                permission.enabled === 'Y'
                                  ? 'success'
                                  : 'neutral'
                              }
                            >
                              {permission.enabled === 'Y' ? '사용' : '비활성'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {permission.permissionCode}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm font-semibold text-slate-400">
                        연결된 권한이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        역할 배정 사원
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        선택한 배정 row 기준으로 역할을 해제합니다.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<UserMinus size={15} />}
                      disabled={
                        selectedAssignments.length === 0 || revokeSubmitting
                      }
                      loading={revokeSubmitting}
                      onClick={() => void handleRevokeAssignments()}
                    >
                      역할 회수
                    </Button>
                  </div>
                  {revokeError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                      {revokeError}
                    </p>
                  )}
                  <DataTable
                    data={groupedRoleEmployees}
                    getRowKey={(employee) => String(employee.empId)}
                    emptyText="이 역할에 배정된 사원이 없습니다."
                    columns={[
                      {
                        key: 'select',
                        header: '',
                        render: (employee) => (
                          <input
                            type="checkbox"
                            checked={employee.assignments.every((assignment) =>
                              selectedAssignmentIds.includes(
                                assignment.roleAssignmentId,
                              ),
                            )}
                            onChange={() => toggleAssignmentSelection(employee)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`${employee.employeeName} 배정 선택`}
                          />
                        ),
                      },
                      {
                        key: 'employee',
                        header: '사원',
                        render: (employee) => (
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              fileId={employee.prflImgFileId}
                              name={employee.employeeName}
                              size={36}
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-950">
                                {employee.employeeName}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-slate-400">
                                EMP-{employee.empId}
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'dept',
                        header: '부서',
                        render: (employee) =>
                          formatCode(employee.deptName ?? employee.deptCd),
                      },
                      {
                        key: 'scope',
                        header: '범위',
                        render: (employee) => (
                          <div className="flex max-w-md flex-wrap gap-1.5">
                            {employee.assignments.map((assignment) => (
                              <Badge
                                key={assignment.roleAssignmentId}
                                variant="outline"
                              >
                                {formatAssignmentScope(assignment)}
                              </Badge>
                            ))}
                          </div>
                        ),
                      },
                      {
                        key: 'enabled',
                        header: '상태',
                        render: (employee) => (
                          <Badge
                            variant={
                              employee.enabled === 'Y' ? 'success' : 'neutral'
                            }
                          >
                            {employee.enabled === 'Y' ? '사용' : '비활성'}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            ) : null}
          </ContentCard>

          <ContentCard
            title="전체 사원 목록"
            description="역할 배정 모달에서 선택 가능한 사원 목록입니다."
            actions={
              <form onSubmit={handleEmployeeSearch} className="flex gap-2">
                <SearchInput
                  value={employeeKeyword}
                  onChange={(event) => setEmployeeKeyword(event.target.value)}
                  placeholder="사원명, 사번, 부서 검색"
                  aria-label="사원 검색"
                  wrapperClassName="min-w-72"
                />
                <Button type="submit" variant="outline">
                  검색
                </Button>
              </form>
            }
          >
            {employeesError ? (
              <EmptyState
                title="사원 목록을 불러오지 못했습니다."
                description={employeesError}
              />
            ) : (
              <div className="flex flex-col gap-5">
                <DataTable
                  data={employees}
                  getRowKey={(employee) => String(employee.empId)}
                  emptyText={
                    employeesLoading
                      ? '사원 목록을 불러오는 중입니다.'
                      : '표시할 사원이 없습니다.'
                  }
                  columns={[
                    {
                      key: 'employee',
                      header: '사원',
                      render: (employee) => (
                        <div className="flex items-center gap-3">
                          <ProfileAvatar
                            fileId={employee.prflImgFileId}
                            name={employee.empNm}
                            size={36}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-950">
                              {employee.empNm}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              EMP-{employee.empId}
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'dept',
                      header: '부서',
                      render: (employee) => getEmployeeDepartment(employee),
                    },
                    {
                      key: 'position',
                      header: '직급',
                      render: (employee) => getEmployeePosition(employee),
                    },
                    {
                      key: 'status',
                      header: '상태',
                      render: (employee) => (
                        <Badge variant="outline">
                          {getEmployeeStatus(employee)}
                        </Badge>
                      ),
                    },
                    {
                      key: 'enabled',
                      header: '사용',
                      render: (employee) => (
                        <Badge
                          variant={
                            employee.enabled === 'Y' ? 'success' : 'danger'
                          }
                        >
                          {employee.enabled === 'Y' ? '사용' : '중지'}
                        </Badge>
                      ),
                    },
                  ]}
                />

                {employeesPagination && employeesPagination.totalPages > 1 && (
                  <Pagination
                    page={employeesPage}
                    totalPages={employeesPagination.totalPages}
                    onChange={setEmployeesPage}
                  />
                )}
              </div>
            )}
          </ContentCard>
        </>
      )}

      <Modal
        open={roleModalMode !== null}
        title={roleModalMode === 'create' ? '역할 생성' : '역할 수정'}
        description={
          roleModalMode === 'create'
            ? '역할 코드, 역할명, 권한 목록을 입력합니다.'
            : '역할 코드는 수정할 수 없습니다.'
        }
        size="lg"
        onClose={closeRoleModal}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeRoleModal}
              disabled={roleSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="admin-role-form"
              loading={roleSubmitting}
            >
              저장
            </Button>
          </>
        }
      >
        <form
          id="admin-role-form"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleRoleSubmit}
        >
          {roleModalMode === 'create' ? (
            <FormField
              label="역할 코드"
              required
              placeholder="ROLE_MANAGER"
              value={roleForm.roleCode}
              onChange={(event) =>
                updateRoleForm('roleCode', event.target.value)
              }
            />
          ) : (
            <FormField
              label="역할 코드"
              value={roleForm.roleCode}
              disabled
            />
          )}
          <FormField
            label="역할명"
            required
            value={roleForm.roleName}
            onChange={(event) =>
              updateRoleForm('roleName', event.target.value)
            }
          />
          <div className="md:col-span-2">
            <Textarea
              label="설명"
              value={roleForm.description}
              onChange={(event) =>
                updateRoleForm('description', event.target.value)
              }
              placeholder="역할 설명을 입력해 주세요."
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">권한 목록</h3>
              <Badge variant="outline">{roleForm.permissionIds.length}개 선택</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {permissionCategoryOptions.map((category) => (
                <label
                  key={category.value}
                  className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-bold transition ${
                    rolePermissionCategory === category.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role-permission-category"
                    value={category.value}
                    checked={rolePermissionCategory === category.value}
                    onChange={() => setRolePermissionCategory(category.value)}
                    className="sr-only"
                  />
                  {category.label}
                </label>
              ))}
            </div>
            {permissionsLoading ? (
              <div className="mt-3 rounded-xl border border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                권한 목록을 불러오는 중입니다.
              </div>
            ) : permissionsError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {permissionsError}
              </p>
            ) : (
              <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 md:grid-cols-2">
                {filteredRoleFormPermissions.map((permission) => {
                  const disabled = permission.enabled !== 'Y';

                  return (
                    <Checkbox
                      key={permission.permissionId}
                      label={permission.permissionName}
                      helperText={`${permission.permissionCode}${
                        disabled ? ' / 비활성' : ''
                      }`}
                      checked={roleForm.permissionIds.includes(
                        permission.permissionId,
                      )}
                      disabled={disabled}
                      onChange={() =>
                        toggleRolePermission(permission.permissionId)
                      }
                      className={`rounded-lg border border-slate-100 p-3 ${
                        disabled ? 'bg-slate-50 opacity-60' : 'bg-white'
                      }`}
                    />
                  );
                })}
                {filteredRoleFormPermissions.length === 0 && (
                  <div className="col-span-full py-8 text-center text-sm font-semibold text-slate-400">
                    해당 분류의 권한이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
          {roleSubmitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 md:col-span-2">
              {roleSubmitError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        title="역할 삭제"
        description="역할 삭제 시 배정된 사원은 대체 역할로 이관됩니다."
        variant="danger"
        onClose={closeDeleteModal}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleteSubmitting}
            >
              취소
            </Button>
            <Button
              variant="danger"
              loading={deleteSubmitting}
              disabled={isProtectedRole}
              onClick={requestDeleteConfirmation}
            >
              삭제
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {isProtectedRole ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              {roleDetail?.roleCode} 역할은 삭제할 수 없습니다.
            </p>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              {roleDetail?.roleName}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              배정 사원 {groupedRoleEmployees.length}명
            </p>
          </div>

          {roleDetail && roleDetail.employees.length > 0 && (
            <Select
              label="대체 역할"
              required
              value={replacementRoleId}
              onChange={(event) => setReplacementRoleId(event.target.value)}
              options={[
                { value: '', label: '대체 역할 선택' },
                ...replacementOptions.map((role) => ({
                  value: String(role.roleId),
                  label: role.roleName,
                })),
              ]}
            />
          )}

          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {deleteError}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        title="역할 배정"
        description="선택한 역할을 여러 사원에게 한 번에 배정합니다."
        size="xl"
        onClose={closeAssignModal}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeAssignModal}
              disabled={assignSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="admin-role-assign-form"
              loading={assignSubmitting}
            >
              배정
            </Button>
          </>
        }
      >
        <form
          id="admin-role-assign-form"
          className="flex flex-col gap-4"
          onSubmit={handleAssignRole}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="범위"
              value={assignForm.scopeTypeCd}
              onChange={(event) =>
                updateAssignScope(event.target.value as RoleScopeType)
              }
              options={scopeOptions}
            />
            {!requiresScopeId(assignForm.scopeTypeCd) && (
              <FormField
                label="scopeId"
                value=""
                disabled
                placeholder="전체/본인은 scopeId를 보내지 않습니다."
              />
            )}
          </div>

          {requiresScopeId(assignForm.scopeTypeCd) && (
            <div className="md:col-span-2">
              <Select
                label="scopeId"
                required
                value={assignForm.scopeId}
                onChange={(event) =>
                  setAssignForm((current) => ({
                    ...current,
                    scopeId: event.target.value,
                  }))
                }
                options={[
                  {
                    value: '',
                    label: scopeOptionsLoading
                      ? '옵션을 불러오는 중'
                      : '연결 대상 선택',
                  },
                  ...currentScopeOptions.map((option) => ({
                    value: option.scopeId,
                    label: option.label,
                  })),
                ]}
              />
              {scopeOptionsError && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {scopeOptionsError}
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">사원 선택</h3>
              <Badge variant="outline">{assignForm.empIds.length}명 선택</Badge>
            </div>
            <div className="mt-3 max-h-96 overflow-y-auto">
              <DataTable
                data={employees}
                getRowKey={(employee) => String(employee.empId)}
                emptyText={
                  employeesLoading
                    ? '사원 목록을 불러오는 중입니다.'
                    : '선택할 사원이 없습니다.'
                }
                columns={[
                  {
                    key: 'select',
                    header: '',
                    render: (employee) => (
                      <input
                        type="checkbox"
                        checked={assignForm.empIds.includes(employee.empId)}
                        onChange={() => toggleAssignEmployee(employee.empId)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`${employee.empNm} 선택`}
                      />
                    ),
                  },
                  {
                    key: 'employee',
                    header: '사원',
                    render: (employee) => (
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          fileId={employee.prflImgFileId}
                          name={employee.empNm}
                          size={36}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-950">
                            {employee.empNm}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            EMP-{employee.empId}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'dept',
                    header: '부서',
                    render: (employee) => getEmployeeDepartment(employee),
                  },
                  {
                    key: 'position',
                    header: '직위/직급',
                    render: (employee) => getEmployeePosition(employee),
                  },
                ]}
              />
            </div>
          </div>

          {assignError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {assignError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={confirmAction !== null}
        title={confirmAction?.title}
        description={confirmAction?.description}
        variant={confirmAction?.variant ?? 'confirm'}
        onClose={() => {
          if (
            roleSubmitting ||
            deleteSubmitting ||
            assignSubmitting ||
            permissionUpdatingId
          ) {
            return;
          }

          setConfirmAction(null);
        }}
        footer={
          <>
            <Button
              variant="outline"
              disabled={
                roleSubmitting ||
                deleteSubmitting ||
                assignSubmitting ||
                Boolean(permissionUpdatingId)
              }
              onClick={() => setConfirmAction(null)}
            >
              취소
            </Button>
            <Button
              variant={
                confirmAction?.variant === 'danger' ? 'danger' : 'primary'
              }
              loading={
                roleSubmitting ||
                deleteSubmitting ||
                assignSubmitting ||
                Boolean(permissionUpdatingId)
              }
              onClick={() => void runConfirmedAction()}
            >
              {confirmAction?.confirmText ?? '확인'}
            </Button>
          </>
        }
      />
    </section>
  );
}
