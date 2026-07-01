import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Eye,
  IdCard,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ShieldMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useDaumPostcode } from '../../hooks/useDaumPostcode';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable';
import DatePickerField from '../../components/common/form/datePicker/DatePickerField';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import FormField from '../../components/common/form/formField/FormField';
import Modal from '../../components/common/overlay/modal/Modal';
import Pagination from '../../components/common/dataDisplay/pagination/Pagination';
import SearchInput from '../../components/common/form/searchInput/SearchInput';
import Select from '../../components/common/form/select/Select';
import { adminEmployeeStatusOptions } from '../../types/adminEmployee';
import type { PageInfo } from '../../api/axiosInstance';
import type {
  AdminDepartmentResponseDTO,
  RankResponse,
  RoleListResponse,
  RoleScopeType,
  ScopeOptionResponse,
} from '../../types/admin';
import type {
  AdminEmployeeDetail,
  AdminEmployeeListItem,
  AdminEmployeeRegisterRequest,
  AdminEmployeeStatusCode,
  AdminMailAccount,
  AdminRoleAssignment,
} from '../../types/adminEmployee';

const pageSize = 10;

type EmployeeAssignmentAction =
  | 'department'
  | 'rank'
  | 'rank-revoke'
  | 'role'
  | `role-revoke-${number | string}`;

type ScopedOptionType = Extract<RoleScopeType, 'DEPT' | 'PROJECT' | 'TASK'>;

interface RoleAssignFormState {
  roleId: string;
  scopeTypeCd: RoleScopeType;
  scopeId: string;
}

const roleScopeTypeOptions: Array<{ value: RoleScopeType; label: string }> = [
  { value: 'GLOBAL', label: '전체' },
  { value: 'DEPT', label: '부서' },
  { value: 'PROJECT', label: '프로젝트' },
  { value: 'TASK', label: '업무' },
  { value: 'SELF', label: '본인' },
];

const createRoleAssignForm = (): RoleAssignFormState => ({
  roleId: '',
  scopeTypeCd: 'GLOBAL',
  scopeId: '',
});

/**
 * 범위가 고정된 역할 코드 → 강제 범위 매핑.
 * 백엔드에서 이 역할들은 항상 아래 범위로 저장되므로(기본 사원=SELF, 최고 관리자=GLOBAL),
 * UI에서도 범위 선택 창을 숨기고 강제 범위를 그대로 전송한다.
 */
const FIXED_SCOPE_ROLE_CODES: Record<string, RoleScopeType> = {
  ROLE_SUPER_ADMIN: 'GLOBAL', // 최고 관리자 → 전체
  ROLE_EMPLOYEE_SELF: 'SELF', // 기본 사원 → 본인
};

const getFixedScopeType = (roleCode?: string | null): RoleScopeType | null =>
  roleCode ? FIXED_SCOPE_ROLE_CODES[roleCode] ?? null : null;

const employeeStatusLabels = Object.fromEntries(
  adminEmployeeStatusOptions.map((status) => [status.code, status.label]),
) as Record<AdminEmployeeStatusCode, string>;

const employeeStatusVariants: Record<
  AdminEmployeeStatusCode,
  'success' | 'warning' | 'neutral' | 'outline'
> = {
  EMP_INITIAL: 'outline',
  EMP_ACTIVE: 'success',
  EMP_INACTIVE: 'neutral',
  EMP_RETIRED: 'neutral',
  EMP_VACATION: 'warning',
};

const isAdminEmployeeStatusCode = (
  value: string | null | undefined,
): value is AdminEmployeeStatusCode =>
  adminEmployeeStatusOptions.some((status) => status.code === value);

const getStatusLabel = (value: string | null | undefined) =>
  isAdminEmployeeStatusCode(value) ? employeeStatusLabels[value] : undefined;

const getStatusVariant = (value: string | null | undefined) =>
  isAdminEmployeeStatusCode(value)
    ? employeeStatusVariants[value]
    : 'neutral';

const formatCode = (value: string | null | undefined, fallback = '-') =>
  value && value.trim() ? value : fallback;

const formatEmployeeId = (empId: number) => `EMP-${empId}`;

const requiresScopeId = (scopeTypeCd: RoleScopeType) =>
  scopeTypeCd === 'DEPT' ||
  scopeTypeCd === 'PROJECT' ||
  scopeTypeCd === 'TASK';

const isRoleScopeType = (
  value: string | null | undefined,
): value is RoleScopeType =>
  roleScopeTypeOptions.some((option) => option.value === value);

const getDepartmentName = (employee: AdminEmployeeListItem) =>
  formatCode(employee.department?.deptNm ?? employee.deptCd);

const getPositionName = (employee: AdminEmployeeListItem) =>
  formatCode(
    employee.jobPosition?.jobPstnNm ??
      employee.jobGrade?.jobGrdNm ??
      employee.jobPstnCd ??
      employee.jobGrdCd,
  );

const getStatusName = (employee: AdminEmployeeListItem) =>
  employee.empStat?.empStatNm ??
  getStatusLabel(employee.empStatCd) ??
  employee.empStatCd ??
  '알 수 없음';

const getDetailStatusName = (employee: AdminEmployeeDetail) =>
  employee.empStat?.empStatNm ??
  getStatusLabel(employee.empStat?.empStatCd) ??
  '알 수 없음';

const getRoleName = (role: AdminRoleAssignment) =>
  role.role?.roleNm ??
  role.roleName ??
  role.role?.roleCd ??
  role.roleCd ??
  String(role.roleId ?? '-');

const getRoleAssignmentKey = (role: AdminRoleAssignment) =>
  role.roleAssignId ??
  `${role.roleId ?? role.role?.roleId ?? 'role'}-${role.scopeTypeCd ?? 'scope'}-${role.scopeId ?? 'none'}`;

const getRoleRevokeAction = (
  role: AdminRoleAssignment,
): EmployeeAssignmentAction => `role-revoke-${getRoleAssignmentKey(role)}`;

const getRoleScopeLabel = (role: AdminRoleAssignment) => {
  const scopeLabel = isRoleScopeType(role.scopeTypeCd)
    ? roleScopeTypeOptions.find((option) => option.value === role.scopeTypeCd)
        ?.label
    : role.scopeTypeCd;

  if (!scopeLabel && !role.scopeId) {
    return '전체';
  }

  return [scopeLabel, role.scopeId].filter(Boolean).join(' ');
};

const getMailAddress = (mail: AdminMailAccount) =>
  mail.mailAddr ?? mail.emlAddr ?? mail.email ?? '-';

const createInitialRegisterForm = (): AdminEmployeeRegisterRequest => ({
  empId: 0,
  empNm: '',
  rrno: '',
  genderCd: 'M',
  mblTelno: '',
  zip: '',
  addr: '',
  entcoYmd: '',
});

const formatDate = (date: Date | null) => {
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
    <dt className="text-xs font-bold text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
      {formatCode(value == null ? null : String(value))}
    </dd>
  </div>
);

export default function AdminEmployeesPage() {
  const [searchParams] = useSearchParams();
  const selectedEmpStatCd = searchParams.get('empStatCd') ?? '';
  const { open: openPostcode } = useDaumPostcode();
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([]);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState<AdminEmployeeRegisterRequest>(
    createInitialRegisterForm,
  );
  const [registerDate, setRegisterDate] = useState<Date | null>(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<AdminEmployeeDetail | null>(null);
  const [statusUpdatingCode, setStatusUpdatingCode] =
    useState<AdminEmployeeStatusCode | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null,
  );
  const [departments, setDepartments] = useState<AdminDepartmentResponseDTO[]>(
    [],
  );
  const [ranks, setRanks] = useState<RankResponse[]>([]);
  const [roles, setRoles] = useState<RoleListResponse[]>([]);
  const [scopeOptionMap, setScopeOptionMap] = useState<
    Record<ScopedOptionType, ScopeOptionResponse[]>
  >({
    DEPT: [],
    PROJECT: [],
    TASK: [],
  });
  const [assignmentOptionsLoading, setAssignmentOptionsLoading] =
    useState(true);
  const [assignmentOptionsError, setAssignmentOptionsError] = useState<
    string | null
  >(null);
  const [targetDeptCd, setTargetDeptCd] = useState('');
  const [targetRankId, setTargetRankId] = useState('');
  const [roleAssignForm, setRoleAssignForm] =
    useState<RoleAssignFormState>(createRoleAssignForm);
  const [assignmentSubmitting, setAssignmentSubmitting] =
    useState<EmployeeAssignmentAction | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await adminApi.getEmployees({
          page: page - 1,
          size: pageSize,
          keyword: submittedKeyword || undefined,
          empStatCd: selectedEmpStatCd || undefined,
        });

        if (active) {
          setEmployees(response.data.data ?? []);
          setPagination(response.data.pagination ?? null);
        }
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError((err as Error).message, 'UNKNOWN', 0);

        if (active) {
          setEmployees([]);
          setPagination(null);
          setError(apiError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEmployees();

    return () => {
      active = false;
    };
  }, [page, submittedKeyword, reloadKey, selectedEmpStatCd]);

  useEffect(() => {
    const openRegister = () => {
      setRegisterOpen(true);
    };

    window.addEventListener('admin:open-employee-register', openRegister);
    return () => {
      window.removeEventListener('admin:open-employee-register', openRegister);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAssignmentOptions = async () => {
      setAssignmentOptionsLoading(true);
      setAssignmentOptionsError(null);

      try {
        const [
          departmentsResponse,
          ranksResponse,
          rolesResponse,
          departmentScopeResponse,
          projectScopeResponse,
          taskScopeResponse,
        ] = await Promise.all([
          adminApi.getDepartments(),
          adminApi.getRanks(),
          adminApi.getRoles(),
          adminApi.getDepartmentScopeOptions(),
          adminApi.getProjectScopeOptions(),
          adminApi.getTaskScopeOptions(),
        ]);

        if (!active) {
          return;
        }

        setDepartments(
          [...(departmentsResponse.data.data ?? [])].sort((left, right) =>
            left.deptNm.localeCompare(right.deptNm, 'ko'),
          ),
        );
        setRanks(
          [...(ranksResponse.data.data ?? [])].sort(
            (left, right) =>
              left.sortOrder - right.sortOrder ||
              left.rankName.localeCompare(right.rankName, 'ko'),
          ),
        );
        setRoles(rolesResponse.data.data ?? []);
        setScopeOptionMap({
          DEPT: departmentScopeResponse.data.data ?? [],
          PROJECT: projectScopeResponse.data.data ?? [],
          TASK: taskScopeResponse.data.data ?? [],
        });
      } catch (err) {
        if (active) {
          setAssignmentOptionsError(
            err instanceof ApiError
              ? err.message
              : '부서, 직급, 역할 옵션을 불러오는 중 오류가 발생했습니다.',
          );
        }
      } finally {
        if (active) {
          setAssignmentOptionsLoading(false);
        }
      }
    };

    void loadAssignmentOptions();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const total = pagination?.totalElements ?? employees.length;
    const active = employees.filter(
      (employee) => employee.empStatCd === 'EMP_ACTIVE',
    ).length;
    const inactive = employees.filter(
      (employee) => employee.empStatCd === 'EMP_INACTIVE',
    ).length;
    const vacation = employees.filter(
      (employee) => employee.empStatCd === 'EMP_VACATION',
    ).length;

    return [
      { label: '전체 사원', value: total, caption: '조회된 구성원' },
      { label: '정상 재직', value: active, caption: '활성 재직자' },
      { label: '비활성', value: inactive, caption: '비활성 계정' },
      { label: '휴가', value: vacation, caption: '휴가 상태' },
    ];
  }, [employees, pagination]);

  const currentScopeOptions = useMemo(() => {
    if (!requiresScopeId(roleAssignForm.scopeTypeCd)) {
      return [];
    }

    return scopeOptionMap[roleAssignForm.scopeTypeCd as ScopedOptionType];
  }, [roleAssignForm.scopeTypeCd, scopeOptionMap]);

  // 선택된 역할이 범위 고정 역할(기본 사원·최고 관리자)이면 강제 범위를 구한다.
  const selectedAssignRoleCode = useMemo(
    () =>
      roles.find((role) => String(role.roleId) === roleAssignForm.roleId)
        ?.roleCode ?? null,
    [roles, roleAssignForm.roleId],
  );
  const fixedScopeType = getFixedScopeType(selectedAssignRoleCode);
  const fixedScopeLabel = fixedScopeType
    ? roleScopeTypeOptions.find((option) => option.value === fixedScopeType)?.label
    : null;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSubmittedKeyword(keyword.trim());
  };

  const reload = () => {
    setPage(1);
    setReloadKey((current) => current + 1);
  };

  const syncEmployeeFromDetail = (detail: AdminEmployeeDetail) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.empId === detail.empId
          ? {
              ...employee,
              deptCd: detail.department?.deptCd ?? null,
              jobPstnCd: detail.jobPosition?.jobPstnCd ?? null,
              jobGrdCd: detail.jobGrade?.jobGrdCd ?? null,
              empStatCd: detail.empStat?.empStatCd ?? employee.empStatCd,
              jobDutyCn: detail.jobDutyCn,
              empNm: detail.empNm,
              genderCd: detail.genderCd,
              mblTelno: detail.mblTelno,
              zip: detail.zip,
              addr: detail.addr,
              prflImgFileId: detail.prflImgFileId,
              execYn: detail.execYn,
              entcoYmd: detail.entcoYmd,
              retcoYmd: detail.retcoYmd,
              frstRegDt: detail.frstRegDt,
              lastMdfcnDt: detail.lastMdfcnDt,
              enabled: detail.enabled,
              department: detail.department,
              jobPosition: detail.jobPosition,
              jobGrade: detail.jobGrade,
              empStat: detail.empStat,
              roleAssignmentList: detail.roleAssignmentList,
            }
          : employee,
      ),
    );
  };

  const syncAssignmentTargetsFromDetail = (
    detail: AdminEmployeeDetail | null,
  ) => {
    setTargetDeptCd(detail?.department?.deptCd ?? '');
    setTargetRankId(detail?.jobGrade?.jobGrdCd ?? '');
  };

  const refreshEmployeeDetail = async (empId: number) => {
    const response = await adminApi.getEmployeeDetail(empId);
    const detail = response.data.data ?? null;

    setSelectedDetail(detail);
    syncAssignmentTargetsFromDetail(detail);

    if (detail) {
      syncEmployeeFromDetail(detail);
    }

    setReloadKey((current) => current + 1);
    return detail;
  };

  const openEmployeeDetail = async (empId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setStatusUpdateError(null);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    syncAssignmentTargetsFromDetail(null);
    setRoleAssignForm(createRoleAssignForm());
    setSelectedDetail(null);

    try {
      const response = await adminApi.getEmployeeDetail(empId);
      const detail = response.data.data ?? null;
      setSelectedDetail(detail);
      syncAssignmentTargetsFromDetail(detail);

      if (detail) {
        syncEmployeeFromDetail(detail);
      }

      if (!detail) {
        setDetailError('사원 상세 정보가 없습니다.');
      }
    } catch (err) {
      setDetailError(
        err instanceof ApiError
          ? err.message
          : '사원 상세 조회 중 오류가 발생했습니다.',
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (detailLoading || statusUpdatingCode || assignmentSubmitting) {
      return;
    }

    setDetailOpen(false);
  };

  const updateEmployeeStatus = async (empStatCd: AdminEmployeeStatusCode) => {
    if (!selectedDetail || statusUpdatingCode) {
      return;
    }

    setStatusUpdatingCode(empStatCd);
    setStatusUpdateError(null);

    try {
      await adminApi.updateEmployeeStatus(selectedDetail.empId, { empStatCd });

      setSelectedDetail((current) =>
        current
          ? {
              ...current,
              empStat: {
                empStatCd,
                empStatNm: employeeStatusLabels[empStatCd],
              },
            }
          : current,
      );
      setEmployees((current) =>
        current.map((employee) =>
          employee.empId === selectedDetail.empId
            ? {
                ...employee,
                empStatCd,
                empStat: {
                  empStatCd,
                  empStatNm: employeeStatusLabels[empStatCd],
                },
              }
            : employee,
        ),
      );
      setReloadKey((current) => current + 1);
    } catch (err) {
      setStatusUpdateError(
        err instanceof ApiError
          ? err.message
          : '사원 상태 변경 중 오류가 발생했습니다.',
      );
    } finally {
      setStatusUpdatingCode(null);
    }
  };

  const updateRoleAssignForm = (
    key: keyof RoleAssignFormState,
    value: string,
  ) => {
    if (key === 'scopeTypeCd') {
      setRoleAssignForm((current) => ({
        ...current,
        scopeTypeCd: value as RoleScopeType,
        scopeId: '',
      }));
      return;
    }

    if (key === 'roleId') {
      // 범위 고정 역할을 고르면 강제 범위로 맞추고 범위 대상은 비운다.
      const nextRoleCode = roles.find(
        (role) => String(role.roleId) === value,
      )?.roleCode;
      const forcedScope = getFixedScopeType(nextRoleCode);
      setRoleAssignForm((current) => ({
        ...current,
        roleId: value,
        ...(forcedScope
          ? { scopeTypeCd: forcedScope, scopeId: '' }
          : {}),
      }));
      return;
    }

    setRoleAssignForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const assignDepartmentToEmployee = async () => {
    if (!selectedDetail || assignmentSubmitting) {
      return;
    }

    const nextDeptCd = targetDeptCd.trim();
    const currentDeptCd = selectedDetail.department?.deptCd ?? '';

    if (!nextDeptCd) {
      setAssignmentError('배치할 부서를 선택해 주세요.');
      setAssignmentSuccess(null);
      return;
    }

    if (nextDeptCd === currentDeptCd) {
      setAssignmentError('이미 선택한 부서에 배치되어 있습니다.');
      setAssignmentSuccess(null);
      return;
    }

    setAssignmentSubmitting('department');
    setAssignmentError(null);
    setAssignmentSuccess(null);

    try {
      if (currentDeptCd) {
        await adminApi.transferDepartmentMembers(currentDeptCd, {
          targetDeptCd: nextDeptCd,
          empIds: [selectedDetail.empId],
        });
      } else {
        await adminApi.assignDepartmentMembers(nextDeptCd, {
          empIds: [selectedDetail.empId],
        });
      }

      await refreshEmployeeDetail(selectedDetail.empId);
      setAssignmentSuccess('부서 배치를 완료했습니다.');
    } catch (err) {
      setAssignmentError(
        err instanceof ApiError
          ? err.message
          : '부서 배치 중 오류가 발생했습니다.',
      );
    } finally {
      setAssignmentSubmitting(null);
    }
  };

  const assignRankToEmployee = async () => {
    if (!selectedDetail || assignmentSubmitting) {
      return;
    }

    const nextRankId = targetRankId.trim();
    const currentRankId = selectedDetail.jobGrade?.jobGrdCd ?? '';

    if (!nextRankId) {
      setAssignmentError('부여할 직급을 선택해 주세요.');
      setAssignmentSuccess(null);
      return;
    }

    if (nextRankId === currentRankId) {
      setAssignmentError('이미 선택한 직급이 부여되어 있습니다.');
      setAssignmentSuccess(null);
      return;
    }

    setAssignmentSubmitting('rank');
    setAssignmentError(null);
    setAssignmentSuccess(null);

    try {
      await adminApi.assignRank(nextRankId, {
        empIds: [selectedDetail.empId],
      });
      await refreshEmployeeDetail(selectedDetail.empId);
      setAssignmentSuccess('직급 부여를 완료했습니다.');
    } catch (err) {
      setAssignmentError(
        err instanceof ApiError
          ? err.message
          : '직급 부여 중 오류가 발생했습니다.',
      );
    } finally {
      setAssignmentSubmitting(null);
    }
  };

  const revokeRankFromEmployee = async () => {
    if (!selectedDetail || assignmentSubmitting) {
      return;
    }

    const currentRankId = selectedDetail.jobGrade?.jobGrdCd ?? '';

    if (!currentRankId) {
      setAssignmentError('해제할 직급이 없습니다.');
      setAssignmentSuccess(null);
      return;
    }

    setAssignmentSubmitting('rank-revoke');
    setAssignmentError(null);
    setAssignmentSuccess(null);

    try {
      await adminApi.revokeRank(currentRankId, {
        empIds: [selectedDetail.empId],
      });
      await refreshEmployeeDetail(selectedDetail.empId);
      setAssignmentSuccess('직급을 해제했습니다.');
    } catch (err) {
      setAssignmentError(
        err instanceof ApiError
          ? err.message
          : '직급 해제 중 오류가 발생했습니다.',
      );
    } finally {
      setAssignmentSubmitting(null);
    }
  };

  const assignRoleToEmployee = async () => {
    if (!selectedDetail || assignmentSubmitting) {
      return;
    }

    const roleId = Number(roleAssignForm.roleId);

    if (!Number.isFinite(roleId) || roleId <= 0) {
      setAssignmentError('부여할 역할을 선택해 주세요.');
      setAssignmentSuccess(null);
      return;
    }

    const needsScopeId = requiresScopeId(roleAssignForm.scopeTypeCd);
    const scopeId = roleAssignForm.scopeId.trim();

    if (needsScopeId && !scopeId) {
      setAssignmentError('선택한 역할 범위의 대상을 선택해 주세요.');
      setAssignmentSuccess(null);
      return;
    }

    setAssignmentSubmitting('role');
    setAssignmentError(null);
    setAssignmentSuccess(null);

    try {
      await adminApi.assignRole(roleId, {
        empIds: [selectedDetail.empId],
        scopeTypeCd: roleAssignForm.scopeTypeCd,
        scopeId: needsScopeId ? scopeId : null,
      });
      await refreshEmployeeDetail(selectedDetail.empId);
      setRoleAssignForm(createRoleAssignForm());
      setAssignmentSuccess('역할 부여를 완료했습니다.');
    } catch (err) {
      setAssignmentError(
        err instanceof ApiError
          ? err.message
          : '역할 부여 중 오류가 발생했습니다.',
      );
    } finally {
      setAssignmentSubmitting(null);
    }
  };

  const revokeRoleFromEmployee = async (role: AdminRoleAssignment) => {
    if (!selectedDetail || assignmentSubmitting) {
      return;
    }

    const roleId = role.roleId ?? role.role?.roleId;

    if (!roleId) {
      setAssignmentError('해제할 역할 ID를 확인할 수 없습니다.');
      setAssignmentSuccess(null);
      return;
    }

    const scopeTypeCd = isRoleScopeType(role.scopeTypeCd)
      ? role.scopeTypeCd
      : null;
    const scopeId = role.scopeId ?? null;

    setAssignmentSubmitting(getRoleRevokeAction(role));
    setAssignmentError(null);
    setAssignmentSuccess(null);

    try {
      await adminApi.revokeRole(roleId, {
        empIds: [selectedDetail.empId],
        scopeTypeCd,
        scopeId,
      });
      await refreshEmployeeDetail(selectedDetail.empId);
      setAssignmentSuccess('역할을 해제했습니다.');
    } catch (err) {
      setAssignmentError(
        err instanceof ApiError
          ? err.message
          : '역할 해제 중 오류가 발생했습니다.',
      );
    } finally {
      setAssignmentSubmitting(null);
    }
  };

  const closeRegister = () => {
    if (registerSubmitting) {
      return;
    }

    setRegisterOpen(false);
    setRegisterError(null);
  };

  const updateRegisterForm = (
    key: keyof AdminEmployeeRegisterRequest,
    value: string | number,
  ) => {
    setRegisterForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSearchRegisterAddress = () => {
    void openPostcode((data) => {
      setRegisterForm((current) => ({
        ...current,
        zip: data.zonecode,
        addr: data.address,
      }));
    }).catch(() => {
      setRegisterError('우편번호 서비스를 불러오지 못했습니다.');
    });
  };

  const resetRegisterForm = () => {
    setRegisterForm(createInitialRegisterForm());
    setRegisterDate(null);
    setRegisterError(null);
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterSubmitting(true);
    setRegisterError(null);

    try {
      const request = {
        ...registerForm,
        entcoYmd: formatDate(registerDate),
      };

      await adminApi.registerEmployee(request);
      resetRegisterForm();
      setRegisterOpen(false);
      reload();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : '사원 등록 중 오류가 발생했습니다.';
      setRegisterError(message);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            사원 관리
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            사원 상태, 소속, 직급 정보를 검색하고 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={17} />}
            loading={loading}
            onClick={reload}
          >
            새로고침
          </Button>
          <Button
            variant="primary"
            leftIcon={<UserPlus size={17} />}
            onClick={() => setRegisterOpen(true)}
          >
            사원 등록
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <ContentCard key={item.label} title={item.label}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {item.value}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.caption}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Users size={21} />
              </div>
            </div>
          </ContentCard>
        ))}
      </div>

      <ContentCard
        title="사원 목록"
        actions={
          <form onSubmit={handleSearch} className="flex min-w-80 gap-2">
            <SearchInput
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="사원명, 사번, 부서 검색"
              aria-label="사원 검색"
              wrapperClassName="min-w-72"
            />
            <Button type="submit" variant="outline" className="shrink-0 whitespace-nowrap">
              검색
            </Button>
          </form>
        }
      >
        {error ? (
          <EmptyState
            title="사원 목록을 불러오지 못했습니다."
            description={error.message}
            actions={
              <Button variant="outline" onClick={reload}>
                다시 시도
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-5">
            <DataTable
              data={employees}
              getRowKey={(employee) => String(employee.empId)}
              emptyText={
                loading
                  ? '사원 목록을 불러오는 중입니다.'
                  : '표시할 사원이 없습니다.'
              }
              columns={[
                {
                  key: 'employee',
                  header: '사원명',
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
                          {formatEmployeeId(employee.empId)}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'dept',
                  header: '부서',
                  render: (employee) => getDepartmentName(employee),
                },
                {
                  key: 'position',
                  header: '직급',
                  render: (employee) => getPositionName(employee),
                },
                {
                  key: 'status',
                  header: '상태',
                  render: (employee) => {
                    const status = employee.empStatCd ?? 'UNKNOWN';
                    return (
                      <Badge
                        variant={getStatusVariant(status)}
                      >
                        {getStatusName(employee)}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'mobile',
                  header: '연락처',
                  render: (employee) => formatCode(employee.mblTelno),
                },
                {
                  key: 'enabled',
                  header: '사용',
                  render: (employee) => (
                    <Badge
                      variant={employee.enabled === 'Y' ? 'success' : 'danger'}
                    >
                      {employee.enabled === 'Y' ? '사용' : '중지'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: '관리',
                  className: 'text-right',
                  render: (employee) => (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye size={15} />}
                      onClick={() => void openEmployeeDetail(employee.empId)}
                    >
                      상세
                    </Button>
                  ),
                },
              ]}
            />

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onChange={setPage}
              />
            )}
          </div>
        )}
      </ContentCard>

      <Modal
        open={detailOpen}
        title="사원 상세"
        size="lg"
        description={
          selectedDetail
            ? `${selectedDetail.empNm} / ${formatEmployeeId(selectedDetail.empId)}`
            : '사원 상세 정보를 조회합니다.'
        }
        onClose={closeDetail}
        footer={
          <Button
            variant="outline"
            onClick={closeDetail}
            disabled={
              detailLoading ||
              Boolean(statusUpdatingCode) ||
              Boolean(assignmentSubmitting)
            }
          >
            닫기
          </Button>
        }
      >
        {detailLoading ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">
            상세 정보를 불러오는 중입니다.
          </div>
        ) : detailError ? (
          <EmptyState
            title="상세 정보를 불러오지 못했습니다."
            description={detailError}
          />
        ) : selectedDetail ? (
          <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
            <aside className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ProfileAvatar
                  fileId={selectedDetail.prflImgFileId}
                  name={selectedDetail.empNm}
                  size={208}
                  rounded="xl"
                  className="aspect-square !h-auto !w-full border border-slate-200"
                />
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-950">
                    {selectedDetail.empNm}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatEmployeeId(selectedDetail.empId)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    variant={getStatusVariant(selectedDetail.empStat?.empStatCd)}
                  >
                    {getDetailStatusName(selectedDetail)}
                  </Badge>
                  <Badge
                    variant={
                      selectedDetail.enabled === 'Y' ? 'success' : 'danger'
                    }
                  >
                    {selectedDetail.enabled === 'Y' ? '사용' : '중지'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900">상태 변경</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {adminEmployeeStatusOptions.map((status) => {
                    const active =
                      selectedDetail.empStat?.empStatCd === status.code;

                    return (
                      <Button
                        key={status.code}
                        variant={active ? 'primary' : 'outline'}
                        size="sm"
                        disabled={active || Boolean(statusUpdatingCode)}
                        loading={statusUpdatingCode === status.code}
                        onClick={() => void updateEmployeeStatus(status.code)}
                      >
                        {status.label}
                      </Button>
                    );
                  })}
                </div>
                {statusUpdateError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {statusUpdateError}
                  </p>
                )}
              </div>
            </aside>

            <div className="flex flex-col gap-5">
              <dl className="grid gap-3 md:grid-cols-2">
                <DetailRow
                  label="사번"
                  value={formatEmployeeId(selectedDetail.empId)}
                />
                <DetailRow label="이름" value={selectedDetail.empNm} />
                <DetailRow
                  label="상태"
                  value={getDetailStatusName(selectedDetail)}
                />
                <DetailRow
                  label="사용 여부"
                  value={selectedDetail.enabled === 'Y' ? '사용' : '중지'}
                />
                <DetailRow
                  label="부서"
                  value={selectedDetail.department?.deptNm}
                />
                <DetailRow
                  label="직위"
                  value={selectedDetail.jobPosition?.jobPstnNm}
                />
                <DetailRow
                  label="직급"
                  value={selectedDetail.jobGrade?.jobGrdNm}
                />
                <DetailRow label="연락처" value={selectedDetail.mblTelno} />
                <DetailRow label="입사일" value={selectedDetail.entcoYmd} />
                <DetailRow label="퇴사일" value={selectedDetail.retcoYmd} />
                <DetailRow
                  label="주소"
                  value={[selectedDetail.zip, selectedDetail.addr]
                    .filter(Boolean)
                    .join(' ')}
                />
                <DetailRow label="직무" value={selectedDetail.jobDutyCn} />
              </dl>

              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">
                      사원 배치/권한 관리
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      부서 배치, 직급 부여, 역할 부여를 이 사원 상세에서 바로 처리합니다.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {assignmentOptionsLoading ? '옵션 로딩 중' : '관리 가능'}
                  </Badge>
                </div>

                {assignmentOptionsError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {assignmentOptionsError}
                  </p>
                )}
                {assignmentError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                    {assignmentError}
                  </p>
                )}
                {assignmentSuccess && (
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    {assignmentSuccess}
                  </p>
                )}

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Building2 size={16} className="text-blue-600" />
                      부서 배치
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      현재 부서: {formatCode(selectedDetail.department?.deptNm)}
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      <Select
                        label="배치 부서"
                        value={targetDeptCd}
                        disabled={
                          assignmentOptionsLoading ||
                          Boolean(assignmentSubmitting)
                        }
                        onChange={(event) => setTargetDeptCd(event.target.value)}
                        options={[
                          {
                            value: '',
                            label: assignmentOptionsLoading
                              ? '부서 불러오는 중'
                              : '부서 선택',
                          },
                          ...departments.map((department) => ({
                            value: department.deptCd,
                            label: department.deptNm,
                          })),
                        ]}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        loading={assignmentSubmitting === 'department'}
                        disabled={
                          assignmentOptionsLoading ||
                          Boolean(assignmentSubmitting) ||
                          !targetDeptCd ||
                          targetDeptCd === selectedDetail.department?.deptCd
                        }
                        onClick={() => void assignDepartmentToEmployee()}
                      >
                        부서 적용
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <IdCard size={16} className="text-indigo-600" />
                      직급 부여
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      현재 직급: {formatCode(selectedDetail.jobGrade?.jobGrdNm)}
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      <Select
                        label="부여 직급"
                        value={targetRankId}
                        disabled={
                          assignmentOptionsLoading ||
                          Boolean(assignmentSubmitting)
                        }
                        onChange={(event) => setTargetRankId(event.target.value)}
                        options={[
                          {
                            value: '',
                            label: assignmentOptionsLoading
                              ? '직급 불러오는 중'
                              : '직급 선택',
                          },
                          ...ranks.map((rank) => ({
                            value: rank.rankId,
                            label: rank.rankName,
                          })),
                        ]}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={assignmentSubmitting === 'rank'}
                          disabled={
                            assignmentOptionsLoading ||
                            Boolean(assignmentSubmitting) ||
                            !targetRankId ||
                            targetRankId === selectedDetail.jobGrade?.jobGrdCd
                          }
                          onClick={() => void assignRankToEmployee()}
                        >
                          직급 적용
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={assignmentSubmitting === 'rank-revoke'}
                          disabled={
                            assignmentOptionsLoading ||
                            Boolean(assignmentSubmitting) ||
                            !selectedDetail.jobGrade?.jobGrdCd
                          }
                          onClick={() => void revokeRankFromEmployee()}
                        >
                          직급 해제
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      역할 부여
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      현재 역할: {selectedDetail.roleAssignmentList?.length ?? 0}개
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      <Select
                        label="역할"
                        value={roleAssignForm.roleId}
                        disabled={
                          assignmentOptionsLoading ||
                          Boolean(assignmentSubmitting)
                        }
                        onChange={(event) =>
                          updateRoleAssignForm('roleId', event.target.value)
                        }
                        options={[
                          {
                            value: '',
                            label: assignmentOptionsLoading
                              ? '역할 불러오는 중'
                              : '역할 선택',
                          },
                          ...roles.map((role) => ({
                            value: String(role.roleId),
                            label: role.roleName,
                          })),
                        ]}
                      />
                      {fixedScopeType ? (
                        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                          이 역할은 범위가 <span className="text-slate-700">{fixedScopeLabel}</span>(으)로 자동 지정됩니다.
                        </p>
                      ) : (
                        <Select
                          label="범위"
                          value={roleAssignForm.scopeTypeCd}
                          disabled={Boolean(assignmentSubmitting)}
                          onChange={(event) =>
                            updateRoleAssignForm(
                              'scopeTypeCd',
                              event.target.value,
                            )
                          }
                          options={roleScopeTypeOptions}
                        />
                      )}
                      {!fixedScopeType && requiresScopeId(roleAssignForm.scopeTypeCd) && (
                        <Select
                          label="범위 대상"
                          value={roleAssignForm.scopeId}
                          disabled={
                            assignmentOptionsLoading ||
                            Boolean(assignmentSubmitting)
                          }
                          onChange={(event) =>
                            updateRoleAssignForm('scopeId', event.target.value)
                          }
                          options={[
                            {
                              value: '',
                              label: assignmentOptionsLoading
                                ? '대상 불러오는 중'
                                : '대상 선택',
                            },
                            ...currentScopeOptions.map((option) => ({
                              value: option.scopeId,
                              label: option.label,
                            })),
                          ]}
                        />
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        loading={assignmentSubmitting === 'role'}
                        disabled={
                          assignmentOptionsLoading ||
                          Boolean(assignmentSubmitting) ||
                          !roleAssignForm.roleId ||
                          (requiresScopeId(roleAssignForm.scopeTypeCd) &&
                            !roleAssignForm.scopeId)
                        }
                        onClick={() => void assignRoleToEmployee()}
                      >
                        역할 부여
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-3">
                <h3 className="text-xs font-bold text-slate-500">메일 계정</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDetail.mailAccountList?.length ? (
                    selectedDetail.mailAccountList.map((mail, index) => (
                      <Badge
                        key={`${getMailAddress(mail)}-${index}`}
                        variant={mail.useYn === 'N' ? 'neutral' : 'outline'}
                      >
                        {getMailAddress(mail)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">
                      -
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-3">
                <h3 className="text-xs font-bold text-slate-500">역할</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDetail.roleAssignmentList?.length ? (
                    selectedDetail.roleAssignmentList.map((role) => {
                      const revokeAction = getRoleRevokeAction(role);

                      return (
                        <div
                          key={getRoleAssignmentKey(role)}
                          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex min-w-0 flex-wrap gap-1.5">
                            <Badge variant="outline">{getRoleName(role)}</Badge>
                            <Badge variant="neutral">
                              {getRoleScopeLabel(role)}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<ShieldMinus size={14} />}
                            loading={assignmentSubmitting === revokeAction}
                            disabled={Boolean(assignmentSubmitting)}
                            onClick={() => void revokeRoleFromEmployee(role)}
                          >
                            해제
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">
                      -
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={registerOpen}
        title="사원 등록"
        description="로그인에 사용할 사번과 기본 인사 정보를 입력합니다."
        onClose={closeRegister}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeRegister}
              disabled={registerSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="admin-employee-register-form"
              loading={registerSubmitting}
            >
              등록
            </Button>
          </>
        }
      >
        <form
          id="admin-employee-register-form"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleRegisterSubmit}
        >
          <FormField
            label="사번"
            type="number"
            min={1}
            required
            value={registerForm.empId || ''}
            onChange={(event) =>
              updateRegisterForm('empId', Number(event.target.value))
            }
          />
          <FormField
            label="사원명"
            required
            value={registerForm.empNm}
            onChange={(event) =>
              updateRegisterForm('empNm', event.target.value)
            }
          />
          <FormField
            label="주민등록번호"
            required
            placeholder="예: 900101-1234567"
            value={registerForm.rrno}
            onChange={(event) =>
              updateRegisterForm('rrno', event.target.value)
            }
          />
          <Select
            label="성별"
            required
            value={registerForm.genderCd}
            onChange={(event) =>
              updateRegisterForm('genderCd', event.target.value)
            }
            options={[
              { value: 'M', label: '남성' },
              { value: 'F', label: '여성' },
            ]}
          />
          <FormField
            label="휴대전화"
            required
            placeholder="010-1234-5678"
            value={registerForm.mblTelno}
            onChange={(event) =>
              updateRegisterForm('mblTelno', event.target.value)
            }
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormField
                label="우편번호"
                required
                readOnly
                placeholder="주소 검색"
                value={registerForm.zip}
                onChange={(event) => updateRegisterForm('zip', event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              leftIcon={<MapPin size={15} />}
              onClick={handleSearchRegisterAddress}
              className="h-10 shrink-0 whitespace-nowrap"
            >
              주소 검색
            </Button>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="주소"
              required
              value={registerForm.addr}
              placeholder="주소 검색 후 상세주소 입력"
              onChange={(event) =>
                updateRegisterForm('addr', event.target.value)
              }
            />
          </div>
          <div className="md:col-span-2">
            <DatePickerField
              label="입사일"
              value={registerDate}
              onChange={setRegisterDate}
              mode="date"
              required
            />
          </div>
          {registerError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 md:col-span-2">
              {registerError}
            </p>
          )}
        </form>
      </Modal>
    </section>
  );
}
