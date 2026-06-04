import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Building2,
  MoveRight,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import type { PageInfo } from '../../api/axiosInstance';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import FormField from '../../components/common/form/formField/FormField';
import Modal from '../../components/common/overlay/modal/Modal';
import Pagination from '../../components/common/dataDisplay/pagination/Pagination';
import SearchInput from '../../components/common/form/searchInput/SearchInput';
import Select from '../../components/common/form/select/Select';
import type {
  AdminDepartmentMemberResponseDTO,
  AdminDepartmentResponseDTO,
} from '../../types/admin';
import type { AdminEmployeeListItem } from '../../types/adminEmployee';
import { useAdminDepartments } from './adminDepartmentsHooks';

const pageSize = 10;
const noParentDepartmentValue = '__NO_PARENT_DEPARTMENT__';

interface DepartmentFormState {
  deptNm: string;
  parentDeptCd: string;
}

interface ConfirmAction {
  title: string;
  description: string;
  confirmText: string;
  variant?: 'confirm' | 'danger';
  onConfirm: () => Promise<void> | void;
}

const createEmptyDepartmentForm = (): DepartmentFormState => ({
  deptNm: '',
  parentDeptCd: '',
});

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const departmentErrorMessages: Record<string, string> = {
  AUTH_002: '접근 권한이 없습니다.',
  COMMON_001: '입력값을 확인해 주세요.',
  DEPARTMENT_NOT_FOUND: '부서를 찾을 수 없습니다.',
  DUPLICATE_DEPARTMENT_CODE: '이미 사용 중인 부서 코드입니다.',
};

const getErrorMessage = (err: unknown) => {
  const apiError = toApiError(err);
  const fallback = departmentErrorMessages[apiError.errorCode];

  return apiError.message || fallback || '요청 처리 중 오류가 발생했습니다.';
};

const getEmployeeDepartmentName = (employee: AdminEmployeeListItem) =>
  employee.department?.deptNm ?? employee.deptCd ?? '-';

const getEmployeeRankName = (employee: AdminEmployeeListItem) =>
  employee.jobGrade?.jobGrdNm ?? employee.jobGrdCd ?? '-';

const getEmployeePositionName = (employee: AdminEmployeeListItem) =>
  employee.jobPosition?.jobPstnNm ?? employee.jobPstnCd ?? '-';

export default function AdminDepartmentsPage() {
  const {
    departments,
    departmentsLoading,
    departmentsError,
    selectedDeptCd,
    selectDepartment,
    reloadDepartments,
  } = useAdminDepartments();
  const selectedDepartmentFromList = useMemo(
    () =>
      departments.find((department) => department.deptCd === selectedDeptCd) ??
      null,
    [departments, selectedDeptCd],
  );
  const [departmentDetail, setDepartmentDetail] =
    useState<AdminDepartmentResponseDTO | null>(null);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [members, setMembers] = useState<AdminDepartmentMemberResponseDTO[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersReloadKey, setMembersReloadKey] = useState(0);
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([]);
  const [employeesPagination, setEmployeesPagination] =
    useState<PageInfo | null>(null);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [employeeKeyword, setEmployeeKeyword] = useState('');
  const [submittedEmployeeKeyword, setSubmittedEmployeeKeyword] = useState('');
  const [employeesReloadKey, setEmployeesReloadKey] = useState(0);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [departmentModalMode, setDepartmentModalMode] = useState<
    'create' | 'edit' | null
  >(null);
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(
    createEmptyDepartmentForm,
  );
  const [departmentSubmitting, setDepartmentSubmitting] = useState(false);
  const [departmentSubmitError, setDepartmentSubmitError] = useState<
    string | null
  >(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replacementDeptCd, setReplacementDeptCd] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<number[]>([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetDeptCd, setTargetDeptCd] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const selectedDepartment = departmentDetail ?? selectedDepartmentFromList;
  const memberCount = selectedDepartment?.memberCount ?? members.length;
  const replacementOptions = departments.filter(
    (department) => department.deptCd !== selectedDeptCd,
  );
  const parentOptions = departments.filter(
    (department) => department.deptCd !== selectedDeptCd,
  );
  const selectableEmployees = useMemo(
    () => employees.filter((employee) => employee.deptCd !== selectedDeptCd),
    [employees, selectedDeptCd],
  );

  useEffect(() => {
    let active = true;

    const loadDepartmentDetail = async () => {
      if (!selectedDeptCd) {
        setDepartmentDetail(null);
        setMembers([]);
        return;
      }

      setDepartmentLoading(true);
      setDepartmentError(null);

      try {
        const response = await adminApi.getDepartmentDetail(selectedDeptCd);

        if (active) {
          setDepartmentDetail(response.data.data ?? null);
        }
      } catch (err) {
        if (active) {
          setDepartmentDetail(null);
          setDepartmentError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setDepartmentLoading(false);
        }
      }
    };

    void loadDepartmentDetail();

    return () => {
      active = false;
    };
  }, [selectedDeptCd, membersReloadKey]);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      if (!selectedDeptCd) {
        setMembers([]);
        return;
      }

      setMembersLoading(true);
      setMembersError(null);

      try {
        const response = await adminApi.getDepartmentMembers(selectedDeptCd);

        if (active) {
          setMembers(response.data.data ?? []);
          setSelectedMemberIds([]);
        }
      } catch (err) {
        if (active) {
          setMembers([]);
          setMembersError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      active = false;
    };
  }, [selectedDeptCd, membersReloadKey]);

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
  }, [employeesPage, employeesReloadKey, submittedEmployeeKeyword]);

  useEffect(() => {
    const openCreate = () => {
      setDepartmentForm(createEmptyDepartmentForm());
      setDepartmentSubmitError(null);
      setDepartmentModalMode('create');
    };

    window.addEventListener('admin:open-department-create', openCreate);
    return () => {
      window.removeEventListener('admin:open-department-create', openCreate);
    };
  }, []);

  const reloadAll = async (preferredDeptCd?: string | null) => {
    await reloadDepartments(preferredDeptCd);
    setMembersReloadKey((current) => current + 1);
    setEmployeesReloadKey((current) => current + 1);
    setEmployeesPage(1);
  };

  const handleEmployeeSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmployeesPage(1);
    setSubmittedEmployeeKeyword(employeeKeyword.trim());
  };

  const openCreateModal = () => {
    setDepartmentForm(createEmptyDepartmentForm());
    setDepartmentSubmitError(null);
    setDepartmentModalMode('create');
  };

  const openEditModal = () => {
    if (!selectedDepartment) {
      return;
    }

    setDepartmentForm({
      deptNm: selectedDepartment.deptNm,
      parentDeptCd: selectedDepartment.parentDeptCd ?? '',
    });
    setDepartmentSubmitError(null);
    setDepartmentModalMode('edit');
  };

  const closeDepartmentModal = () => {
    if (departmentSubmitting) {
      return;
    }

    setDepartmentModalMode(null);
    setDepartmentSubmitError(null);
  };

  const submitDepartmentForm = async () => {
    if (!departmentForm.deptNm.trim()) {
      setDepartmentSubmitError('부서명을 입력해 주세요.');
      return;
    }

    setDepartmentSubmitting(true);
    setDepartmentSubmitError(null);

    try {
      const parentDeptCd =
        departmentForm.parentDeptCd === noParentDepartmentValue
          ? undefined
          : departmentForm.parentDeptCd.trim() || undefined;
      const response =
        departmentModalMode === 'create'
          ? await adminApi.createDepartment({
              ...(parentDeptCd ? { parentDeptCd } : {}),
              deptNm: departmentForm.deptNm.trim(),
            })
          : selectedDepartment
            ? await adminApi.updateDepartment(selectedDepartment.deptCd, {
                ...(parentDeptCd ? { parentDeptCd } : {}),
                deptNm: departmentForm.deptNm.trim(),
              })
            : null;
      const nextDepartment = response?.data.data ?? null;

      setDepartmentModalMode(null);
      await reloadAll(nextDepartment?.deptCd ?? selectedDepartment?.deptCd);

      if (nextDepartment) {
        selectDepartment(nextDepartment.deptCd);
      }
    } catch (err) {
      setDepartmentSubmitError(getErrorMessage(err));
    } finally {
      setDepartmentSubmitting(false);
    }
  };

  const handleDepartmentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (departmentModalMode === 'edit' && selectedDepartment) {
      setConfirmAction({
        title: '부서를 수정할까요?',
        description: `${selectedDepartment.deptNm} 부서 정보가 변경됩니다.`,
        confirmText: '수정',
        onConfirm: submitDepartmentForm,
      });
      return;
    }

    void submitDepartmentForm();
  };

  const openDeleteModal = () => {
    setReplacementDeptCd('');
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
    if (!selectedDepartment) {
      return;
    }

    const replacement = replacementDeptCd.trim() || null;

    if (memberCount > 0 && !replacement) {
      setDeleteError('소속 인원이 있으면 이동할 부서를 선택해야 합니다.');
      return;
    }

    if (replacement === selectedDepartment.deptCd) {
      setDeleteError('삭제 대상 부서를 대체 부서로 선택할 수 없습니다.');
      return;
    }

    setConfirmAction({
      title: '부서를 삭제할까요?',
      description: `${selectedDepartment.deptNm} 부서가 삭제됩니다. 소속 인원이 있으면 선택한 부서로 이동합니다.`,
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: () => deleteDepartment(replacement),
    });
  };

  const deleteDepartment = async (replacementDeptCd: string | null) => {
    if (!selectedDepartment) {
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await adminApi.deleteDepartment(
        selectedDepartment.deptCd,
        replacementDeptCd ? { replacementDeptCd } : null,
      );
      setDeleteOpen(false);
      await reloadAll();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openAssignModal = () => {
    setAssignEmployeeIds([]);
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
    setAssignEmployeeIds((current) =>
      current.includes(empId)
        ? current.filter((id) => id !== empId)
        : [...current, empId],
    );
  };

  const requestAssignConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDepartment) {
      return;
    }

    if (assignEmployeeIds.length === 0) {
      setAssignError('부서에 배정할 사원을 선택해 주세요.');
      return;
    }

    setConfirmAction({
      title: '사원을 배정할까요?',
      description: `${assignEmployeeIds.length}명을 ${selectedDepartment.deptNm} 부서에 배정합니다.`,
      confirmText: '배정',
      onConfirm: assignMembers,
    });
  };

  const assignMembers = async () => {
    if (!selectedDepartment) {
      return;
    }

    setAssignSubmitting(true);
    setAssignError(null);

    try {
      await adminApi.assignDepartmentMembers(selectedDepartment.deptCd, {
        empIds: assignEmployeeIds,
      });
      setAssignOpen(false);
      setAssignEmployeeIds([]);
      await reloadAll(selectedDepartment.deptCd);
    } catch (err) {
      setAssignError(getErrorMessage(err));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const toggleMember = (empId: number) => {
    setSelectedMemberIds((current) =>
      current.includes(empId)
        ? current.filter((id) => id !== empId)
        : [...current, empId],
    );
  };

  const openTransferModal = () => {
    setTransferError(null);
    setTargetDeptCd('');
    setTransferOpen(true);
  };

  const closeTransferModal = () => {
    if (transferSubmitting) {
      return;
    }

    setTransferOpen(false);
    setTransferError(null);
  };

  const requestTransferConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDepartment) {
      return;
    }

    if (selectedMemberIds.length === 0) {
      setTransferError('이동할 사원을 선택해 주세요.');
      return;
    }

    if (!targetDeptCd) {
      setTransferError('이동할 대상 부서를 선택해 주세요.');
      return;
    }

    setConfirmAction({
      title: '사원을 이동할까요?',
      description: `${selectedMemberIds.length}명을 선택한 부서로 이동합니다.`,
      confirmText: '이동',
      onConfirm: transferMembers,
    });
  };

  const transferMembers = async () => {
    if (!selectedDepartment) {
      return;
    }

    setTransferSubmitting(true);
    setTransferError(null);

    try {
      await adminApi.transferDepartmentMembers(selectedDepartment.deptCd, {
        targetDeptCd,
        empIds: selectedMemberIds,
      });
      setTransferOpen(false);
      setSelectedMemberIds([]);
      await reloadAll(selectedDepartment.deptCd);
    } catch (err) {
      setTransferError(getErrorMessage(err));
    } finally {
      setTransferSubmitting(false);
    }
  };

  const closeConfirm = () => {
    if (
      departmentSubmitting ||
      deleteSubmitting ||
      assignSubmitting ||
      transferSubmitting
    ) {
      return;
    }

    setConfirmAction(null);
  };

  const runConfirmedAction = async () => {
    const action = confirmAction;

    if (!action) {
      return;
    }

    await action.onConfirm();
    setConfirmAction(null);
  };

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            부서 관리
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            부서 생성, 소속 인원, 사원 배정과 부서 이동을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={17} />}
            loading={departmentsLoading || membersLoading || employeesLoading}
            onClick={() => void reloadAll()}
          >
            새로고침
          </Button>
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={17} />}
            onClick={openCreateModal}
          >
            부서 생성
          </Button>
        </div>
      </div>

      {departmentsError ? (
        <EmptyState
          title="부서 목록을 불러오지 못했습니다."
          description={departmentsError.message}
          actions={
            <Button variant="outline" onClick={reloadDepartments}>
              다시 시도
            </Button>
          }
        />
      ) : departments.length === 0 && !departmentsLoading ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="등록된 부서가 없습니다."
          description="부서 생성 버튼으로 새 부서를 등록할 수 있습니다."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ContentCard title="선택 부서">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-2xl font-bold tracking-tight text-slate-950">
                    {selectedDepartment?.deptNm ?? '-'}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                    {selectedDepartment?.deptCd ?? '-'}
                  </p>
                </div>
                <Building2 size={26} className="shrink-0 text-blue-600" />
              </div>
            </ContentCard>

            <ContentCard title="상위 부서">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 text-xl font-bold tracking-tight text-slate-950">
                  {selectedDepartment?.parentDeptNm ?? '-'}
                </div>
                <Badge variant="outline">
                  {selectedDepartment?.parentDeptCd ?? 'ROOT'}
                </Badge>
              </div>
            </ContentCard>

            <ContentCard title="소속 인원">
              <div className="flex items-end justify-between gap-4">
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {memberCount}
                </div>
                <Users size={26} className="text-emerald-600" />
              </div>
            </ContentCard>
          </div>

          <ContentCard
            title={selectedDepartment?.deptNm ?? '부서 상세'}
            description="선택한 부서의 소속 인원과 부서 이동을 관리합니다."
            actions={
              selectedDepartment ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Pencil size={15} />}
                    onClick={openEditModal}
                  >
                    부서 수정
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={15} />}
                    onClick={openDeleteModal}
                  >
                    부서 삭제
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus size={15} />}
                    onClick={openAssignModal}
                  >
                    사원 배정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<MoveRight size={15} />}
                    disabled={selectedMemberIds.length === 0}
                    onClick={openTransferModal}
                  >
                    사원 부서 이동
                  </Button>
                </>
              ) : null
            }
          >
            {departmentError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {departmentError}
              </p>
            )}
            {membersError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {membersError}
              </p>
            )}
            <DataTable
              data={members}
              getRowKey={(member) => String(member.empId)}
              emptyText={
                departmentLoading || membersLoading
                  ? '소속 인원을 불러오는 중입니다.'
                  : '현재 부서에 소속된 사원이 없습니다.'
              }
              columns={[
                {
                  key: 'select',
                  header: '',
                  render: (member) => (
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(member.empId)}
                      onChange={() => toggleMember(member.empId)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`${member.empNm} 이동 선택`}
                    />
                  ),
                },
                {
                  key: 'employee',
                  header: '사원',
                  render: (member) => (
                    <div>
                      <div className="font-bold text-slate-950">
                        {member.empNm}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        EMP-{member.empId}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'rank',
                  header: '직급',
                  render: (member) => member.jobGrdNm ?? member.jobGrdCd ?? '-',
                },
                {
                  key: 'position',
                  header: '직책',
                  render: (member) =>
                    member.jobPstnNm ?? member.jobPstnCd ?? '-',
                },
                {
                  key: 'status',
                  header: '상태',
                  render: (member) => (
                    <Badge variant="outline">
                      {member.empStatNm ?? member.empStatCd ?? '-'}
                    </Badge>
                  ),
                },
              ]}
            />
          </ContentCard>

          <ContentCard
            title="전체 사원 목록"
            description="사원 배정 모달에서 선택 가능한 기준 목록입니다."
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
                        <div>
                          <div className="font-bold text-slate-950">
                            {employee.empNm}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-400">
                            EMP-{employee.empId}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'dept',
                      header: '부서',
                      render: (employee) => getEmployeeDepartmentName(employee),
                    },
                    {
                      key: 'rank',
                      header: '직급',
                      render: (employee) => getEmployeeRankName(employee),
                    },
                    {
                      key: 'position',
                      header: '직책',
                      render: (employee) => getEmployeePositionName(employee),
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
        open={departmentModalMode !== null}
        title={departmentModalMode === 'create' ? '부서 생성' : '부서 수정'}
        description={
          departmentModalMode === 'create'
            ? '부서명과 상위 부서를 입력합니다. 부서 코드는 서버에서 자동 생성합니다.'
            : '부서명과 상위 부서를 수정합니다.'
        }
        onClose={closeDepartmentModal}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeDepartmentModal}
              disabled={departmentSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="admin-department-form"
              loading={departmentSubmitting}
            >
              저장
            </Button>
          </>
        }
      >
        <form
          id="admin-department-form"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleDepartmentSubmit}
        >
          <FormField
            label="부서명"
            required
            value={departmentForm.deptNm}
            onChange={(event) =>
              setDepartmentForm((current) => ({
                ...current,
                deptNm: event.target.value,
              }))
            }
          />
          <Select
            label="상위 부서"
            value={departmentForm.parentDeptCd || noParentDepartmentValue}
            onChange={(event) =>
              setDepartmentForm((current) => ({
                ...current,
                parentDeptCd: event.target.value,
              }))
            }
            options={[
              { value: noParentDepartmentValue, label: '없음' },
              ...parentOptions.map((department) => ({
                value: department.deptCd,
                label: department.deptNm,
              })),
            ]}
          />
          {departmentSubmitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 md:col-span-2">
              {departmentSubmitError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        title="부서 삭제"
        description="소속 인원이 있으면 이동할 대체 부서를 선택해야 합니다."
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
              onClick={requestDeleteConfirmation}
            >
              삭제
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              {selectedDepartment?.deptNm}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              소속 인원 {memberCount}명
            </p>
          </div>

          {memberCount > 0 && (
            <Select
              label="이동할 부서"
              required
              value={replacementDeptCd}
              onChange={(event) => setReplacementDeptCd(event.target.value)}
              options={[
                { value: '', label: '대체 부서 선택' },
                ...replacementOptions.map((department) => ({
                  value: department.deptCd,
                  label: department.deptNm,
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
        title="사원 배정"
        description="선택한 사원을 현재 부서에 배정합니다."
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
              form="admin-department-assign-form"
              loading={assignSubmitting}
            >
              배정
            </Button>
          </>
        }
      >
        <form
          id="admin-department-assign-form"
          className="flex flex-col gap-4"
          onSubmit={requestAssignConfirmation}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">사원 선택</h3>
            <Badge variant="outline">{assignEmployeeIds.length}명 선택</Badge>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <DataTable
              data={selectableEmployees}
              getRowKey={(employee) => String(employee.empId)}
              emptyText={
                employeesLoading
                  ? '사원 목록을 불러오는 중입니다.'
                  : '선택 가능한 사원이 없습니다.'
              }
              columns={[
                {
                  key: 'select',
                  header: '',
                  render: (employee) => (
                    <input
                      type="checkbox"
                      checked={assignEmployeeIds.includes(employee.empId)}
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
                    <div>
                      <div className="font-bold text-slate-950">
                        {employee.empNm}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        EMP-{employee.empId}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'dept',
                  header: '현재 부서',
                  render: (employee) => getEmployeeDepartmentName(employee),
                },
                {
                  key: 'rank',
                  header: '직급',
                  render: (employee) => getEmployeeRankName(employee),
                },
              ]}
            />
          </div>

          {assignError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {assignError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={transferOpen}
        title="사원 부서 이동"
        description="현재 부서에서 선택한 사원을 다른 부서로 이동합니다."
        onClose={closeTransferModal}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeTransferModal}
              disabled={transferSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="admin-department-transfer-form"
              loading={transferSubmitting}
            >
              이동
            </Button>
          </>
        }
      >
        <form
          id="admin-department-transfer-form"
          className="flex flex-col gap-4"
          onSubmit={requestTransferConfirmation}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            선택 사원 {selectedMemberIds.length}명
          </div>
          <Select
            label="이동할 부서"
            required
            value={targetDeptCd}
            onChange={(event) => setTargetDeptCd(event.target.value)}
            options={[
              { value: '', label: '대상 부서 선택' },
              ...replacementOptions.map((department) => ({
                value: department.deptCd,
                label: department.deptNm,
              })),
            ]}
          />
          {transferError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {transferError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={confirmAction !== null}
        title={confirmAction?.title}
        description={confirmAction?.description}
        variant={confirmAction?.variant ?? 'confirm'}
        onClose={closeConfirm}
        footer={
          <>
            <Button
              variant="outline"
              disabled={
                departmentSubmitting ||
                deleteSubmitting ||
                assignSubmitting ||
                transferSubmitting
              }
              onClick={closeConfirm}
            >
              취소
            </Button>
            <Button
              variant={
                confirmAction?.variant === 'danger' ? 'danger' : 'primary'
              }
              loading={
                departmentSubmitting ||
                deleteSubmitting ||
                assignSubmitting ||
                transferSubmitting
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
