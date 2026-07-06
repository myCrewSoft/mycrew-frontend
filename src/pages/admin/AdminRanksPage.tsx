import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  IdCard,
  Pencil,
  PlusCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
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
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import FormField from '../../components/common/form/formField/FormField';
import Modal from '../../components/common/overlay/modal/Modal';
import Pagination from '../../components/common/dataDisplay/pagination/Pagination';
import SearchInput from '../../components/common/form/searchInput/SearchInput';
import Select from '../../components/common/form/select/Select';
import { useAdminRanks } from './adminRanksHooks';
import type { RankResponse } from '../../types/admin';
import type { AdminEmployeeListItem } from '../../types/adminEmployee';

const pageSize = 10;

interface RankFormState {
  rankName: string;
  sortOrder: number;
}

interface ConfirmAction {
  title: string;
  description: string;
  confirmText: string;
  variant?: 'confirm' | 'danger';
  onConfirm: () => Promise<void> | void;
}

const createEmptyRankForm = (): RankFormState => ({
  rankName: '',
  sortOrder: 1,
});

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const rankErrorMessages: Record<string, string> = {
  AUTH_002: '접근 권한이 없습니다.',
  COMMON_001: '입력값을 확인해 주세요.',
  RANK_NOT_FOUND: '직급을 찾을 수 없습니다.',
  DUPLICATE_RANK_ID: '이미 사용 중인 직급 ID입니다.',
};

const getErrorMessage = (err: unknown) => {
  const apiError = toApiError(err);
  const fallback = rankErrorMessages[apiError.errorCode];

  return apiError.message || fallback || '요청 처리 중 오류가 발생했습니다.';
};

const formatCode = (value: string | null | undefined, fallback = '-') =>
  value && value.trim() ? value : fallback;

const getEmployeeDepartment = (employee: AdminEmployeeListItem) =>
  formatCode(employee.department?.deptNm ?? employee.deptCd);

const getEmployeeRankCode = (employee: AdminEmployeeListItem) =>
  employee.jobGrade?.jobGrdCd ?? employee.jobGrdCd ?? null;

const getEmployeeRankName = (employee: AdminEmployeeListItem) =>
  employee.jobGrade?.jobGrdNm ?? employee.jobGrdCd ?? '-';

const hasRank = (employee: AdminEmployeeListItem, rank: RankResponse | null) => {
  if (!rank) {
    return false;
  }

  return (
    getEmployeeRankCode(employee) === rank.rankId ||
    employee.jobGrade?.jobGrdNm === rank.rankName
  );
};

export default function AdminRanksPage() {
  const {
    ranks,
    ranksLoading,
    ranksError,
    selectedRankId,
    selectRank,
    reloadRanks,
  } = useAdminRanks();
  const selectedRank = useMemo(
    () => ranks.find((rank) => rank.rankId === selectedRankId) ?? null,
    [ranks, selectedRankId],
  );
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([]);
  const [employeesPagination, setEmployeesPagination] =
    useState<PageInfo | null>(null);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [employeesReloadKey, setEmployeesReloadKey] = useState(0);
  const [employeeKeyword, setEmployeeKeyword] = useState('');
  const [submittedEmployeeKeyword, setSubmittedEmployeeKeyword] = useState('');
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [rankModalMode, setRankModalMode] = useState<'create' | 'edit' | null>(
    null,
  );
  const [rankForm, setRankForm] = useState<RankFormState>(createEmptyRankForm);
  const [rankSubmitError, setRankSubmitError] = useState<string | null>(null);
  const [rankSubmitting, setRankSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replacementRankId, setReplacementRankId] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<number[]>([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedAssignedEmployeeIds, setSelectedAssignedEmployeeIds] =
    useState<number[]>([]);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const assignedEmployees = useMemo(
    () => employees.filter((employee) => hasRank(employee, selectedRank)),
    [employees, selectedRank],
  );

  const selectableEmployees = useMemo(
    () => employees.filter((employee) => !hasRank(employee, selectedRank)),
    [employees, selectedRank],
  );

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
          setSelectedAssignedEmployeeIds([]);
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
  }, [employeesPage, employeesReloadKey, submittedEmployeeKeyword, selectedRankId]);

  useEffect(() => {
    const openCreate = () => {
      setRankForm(createEmptyRankForm());
      setRankSubmitError(null);
      setRankModalMode('create');
    };

    window.addEventListener('admin:open-rank-create', openCreate);
    return () => {
      window.removeEventListener('admin:open-rank-create', openCreate);
    };
  }, []);

  const reloadAll = () => {
    reloadRanks();
    setEmployeesReloadKey((current) => current + 1);
    setEmployeesPage(1);
  };

  const applyRankToCurrentEmployees = (empIds: number[]) => {
    if (!selectedRank) {
      return;
    }

    setEmployees((current) =>
      current.map((employee) =>
        empIds.includes(employee.empId)
          ? {
              ...employee,
              jobGrdCd: selectedRank.rankId,
              jobGrade: {
                jobGrdCd: selectedRank.rankId,
                jobGrdNm: selectedRank.rankName,
                useYn: selectedRank.enabled,
              },
            }
          : employee,
      ),
    );
  };

  const clearRankFromCurrentEmployees = (empIds: number[]) => {
    setEmployees((current) =>
      current.map((employee) =>
        empIds.includes(employee.empId)
          ? {
              ...employee,
              jobGrdCd: null,
              jobGrade: null,
            }
          : employee,
      ),
    );
  };

  const handleEmployeeSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmployeesPage(1);
    setSubmittedEmployeeKeyword(employeeKeyword.trim());
  };

  const openCreateModal = () => {
    setRankForm(createEmptyRankForm());
    setRankSubmitError(null);
    setRankModalMode('create');
  };

  const openEditModal = () => {
    if (!selectedRank) {
      return;
    }

    setRankForm({
      rankName: selectedRank.rankName,
      sortOrder: selectedRank.sortOrder,
    });
    setRankSubmitError(null);
    setRankModalMode('edit');
  };

  const closeRankModal = () => {
    if (rankSubmitting) {
      return;
    }

    setRankModalMode(null);
    setRankSubmitError(null);
  };

  const submitRankForm = async () => {
    if (!rankForm.rankName.trim()) {
      setRankSubmitError('직급명을 입력해 주세요.');
      return;
    }

    if (!Number.isFinite(rankForm.sortOrder) || rankForm.sortOrder < 0) {
      setRankSubmitError('정렬 순서를 0 이상 숫자로 입력해 주세요.');
      return;
    }

    setRankSubmitting(true);
    setRankSubmitError(null);

    try {
      const response =
        rankModalMode === 'create'
          ? await adminApi.createRank({
              rankName: rankForm.rankName.trim(),
              sortOrder: rankForm.sortOrder,
            })
          : selectedRank
            ? await adminApi.updateRank(selectedRank.rankId, {
                rankName: rankForm.rankName.trim(),
                sortOrder: rankForm.sortOrder,
                enabled: selectedRank.enabled,
              })
            : null;
      const nextRank = response?.data.data ?? null;

      setRankModalMode(null);
      reloadRanks();

      if (nextRank) {
        selectRank(nextRank.rankId);
      }
    } catch (err) {
      setRankSubmitError(getErrorMessage(err));
    } finally {
      setRankSubmitting(false);
    }
  };

  const handleRankSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (rankModalMode === 'edit' && selectedRank) {
      setConfirmAction({
        title: '직급을 수정할까요?',
        description: `${selectedRank.rankName} 직급의 이름과 정렬 순서가 변경됩니다.`,
        confirmText: '수정',
        onConfirm: submitRankForm,
      });
      return;
    }

    void submitRankForm();
  };

  const requestStatusToggle = () => {
    if (!selectedRank) {
      return;
    }

    const nextEnabled = selectedRank.enabled === 'Y' ? 'N' : 'Y';

    setConfirmAction({
      title:
        nextEnabled === 'Y'
          ? '직급을 사용 상태로 변경할까요?'
          : '직급을 비활성화할까요?',
      description: `${selectedRank.rankName} 직급의 사용 여부가 변경됩니다.`,
      confirmText: nextEnabled === 'Y' ? '사용' : '비활성화',
      variant: nextEnabled === 'Y' ? 'confirm' : 'danger',
      onConfirm: () => updateRankStatus(nextEnabled),
    });
  };

  const updateRankStatus = async (enabled: 'Y' | 'N') => {
    if (!selectedRank) {
      return;
    }

    setStatusUpdating(true);
    setStatusError(null);

    try {
      await adminApi.updateRank(selectedRank.rankId, {
        rankName: selectedRank.rankName,
        sortOrder: selectedRank.sortOrder,
        enabled,
      });
      reloadRanks();
    } catch (err) {
      setStatusError(getErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  };

  const openDeleteModal = () => {
    setReplacementRankId('');
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
    if (!selectedRank) {
      return;
    }

    const replacement = replacementRankId.trim() || null;

    if (assignedEmployeeCount > 0 && !replacement) {
      setDeleteError('배정된 사원이 있으면 대체 직급을 선택해야 합니다.');
      return;
    }

    if (replacement === selectedRank.rankId) {
      setDeleteError('삭제 대상 직급은 대체 직급으로 선택할 수 없습니다.');
      return;
    }

    setConfirmAction({
      title: '직급을 삭제할까요?',
      description: `${selectedRank.rankName} 직급이 비활성화됩니다. 배정 사원이 있으면 대체 직급으로 이전됩니다.`,
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: () => deleteRank(replacement),
    });
  };

  const deleteRank = async (replacementRankId: string | null) => {
    if (!selectedRank) {
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await adminApi.deleteRank(selectedRank.rankId, { replacementRankId });
      setDeleteOpen(false);
      reloadRanks();
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

    if (!selectedRank) {
      return;
    }

    if (assignEmployeeIds.length === 0) {
      setAssignError('직급을 부여할 사원을 선택해 주세요.');
      return;
    }

    setConfirmAction({
      title: '직급을 부여할까요?',
      description: `${assignEmployeeIds.length}명의 사원에게 ${selectedRank.rankName} 직급을 부여합니다.`,
      confirmText: '부여',
      onConfirm: assignRank,
    });
  };

  const assignRank = async () => {
    if (!selectedRank) {
      return;
    }

    setAssignSubmitting(true);
    setAssignError(null);

    try {
      await adminApi.assignRank(selectedRank.rankId, {
        empIds: assignEmployeeIds,
      });
      applyRankToCurrentEmployees(assignEmployeeIds);
      setAssignOpen(false);
      setAssignEmployeeIds([]);
      reloadAll();
    } catch (err) {
      setAssignError(getErrorMessage(err));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const toggleAssignedEmployee = (empId: number) => {
    setSelectedAssignedEmployeeIds((current) =>
      current.includes(empId)
        ? current.filter((id) => id !== empId)
        : [...current, empId],
    );
  };

  const requestRevokeConfirmation = () => {
    if (!selectedRank) {
      return;
    }

    if (selectedAssignedEmployeeIds.length === 0) {
      setRevokeError('회수할 사원을 선택해 주세요.');
      return;
    }

    setConfirmAction({
      title: '직급을 회수할까요?',
      description: `${selectedAssignedEmployeeIds.length}명의 사원에게서 ${selectedRank.rankName} 직급을 회수합니다.`,
      confirmText: '회수',
      variant: 'danger',
      onConfirm: revokeRank,
    });
  };

  const revokeRank = async () => {
    if (!selectedRank) {
      return;
    }

    setRevokeSubmitting(true);
    setRevokeError(null);

    try {
      await adminApi.revokeRank(selectedRank.rankId, {
        empIds: selectedAssignedEmployeeIds,
      });
      clearRankFromCurrentEmployees(selectedAssignedEmployeeIds);
      setSelectedAssignedEmployeeIds([]);
      reloadAll();
    } catch (err) {
      setRevokeError(getErrorMessage(err));
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const closeConfirm = () => {
    if (
      rankSubmitting ||
      statusUpdating ||
      deleteSubmitting ||
      assignSubmitting ||
      revokeSubmitting
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

  const replacementOptions = ranks.filter(
    (rank) => rank.rankId !== selectedRank?.rankId,
  );
  const assignedEmployeeCount =
    selectedRank?.assignedEmployeeCount ?? assignedEmployees.length;

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            직급 관리
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            직급 생성, 정렬 순서, 사용 여부와 사원 배정을 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={17} />}
            loading={ranksLoading || employeesLoading}
            onClick={reloadAll}
          >
            새로고침
          </Button>
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={17} />}
            onClick={openCreateModal}
          >
            직급 생성
          </Button>
        </div>
      </div>

      {ranksError ? (
        <EmptyState
          title="직급 목록을 불러오지 못했습니다."
          description={ranksError.message}
          actions={
            <Button variant="outline" onClick={reloadRanks}>
              다시 시도
            </Button>
          }
        />
      ) : ranks.length === 0 && !ranksLoading ? (
        <EmptyState
          icon={<IdCard size={24} />}
          title="등록된 직급이 없습니다."
          description="직급 생성 버튼으로 새 직급을 등록할 수 있습니다."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <ContentCard title="선택 직급">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-2xl font-bold tracking-tight text-slate-950">
                    {selectedRank?.rankName ?? '-'}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                    {selectedRank?.rankId ?? '-'}
                  </p>
                </div>
                <IdCard size={26} className="shrink-0 text-blue-600" />
              </div>
            </ContentCard>

            <ContentCard title="정렬 순서">
              <div className="flex items-end justify-between gap-4">
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {selectedRank?.sortOrder ?? '-'}
                </div>
                <Badge variant="outline">SORT_ORDER</Badge>
              </div>
            </ContentCard>

            <ContentCard title="배정 사원">
              <div className="flex items-end justify-between gap-4">
                <div className="text-3xl font-bold tracking-tight text-slate-950">
                  {assignedEmployeeCount}
                </div>
                <Users size={26} className="text-emerald-600" />
              </div>
            </ContentCard>
          </div>

          <ContentCard
            title={selectedRank?.rankName ?? '직급 상세'}
            description="선택한 직급의 정보와 배정 사원을 관리합니다."
            actions={
              selectedRank ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Pencil size={15} />}
                    onClick={openEditModal}
                  >
                    직급 수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={
                      selectedRank.enabled === 'Y' ? (
                        <ToggleLeft size={15} />
                      ) : (
                        <ToggleRight size={15} />
                      )
                    }
                    loading={statusUpdating}
                    onClick={requestStatusToggle}
                  >
                    {selectedRank.enabled === 'Y' ? '비활성화' : '사용'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={15} />}
                    onClick={openDeleteModal}
                  >
                    직급 삭제
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus size={15} />}
                    onClick={openAssignModal}
                  >
                    직급 부여
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserMinus size={15} />}
                    disabled={
                      selectedAssignedEmployeeIds.length === 0 ||
                      revokeSubmitting
                    }
                    loading={revokeSubmitting}
                    onClick={requestRevokeConfirmation}
                  >
                    직급 회수
                  </Button>
                </>
              ) : null
            }
          >
            {statusError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {statusError}
              </p>
            )}
            {revokeError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                {revokeError}
              </p>
            )}
            <DataTable
              data={assignedEmployees}
              getRowKey={(employee) => String(employee.empId)}
              emptyText={
                employeesLoading
                  ? '사원 목록을 불러오는 중입니다.'
                  : '현재 조회된 사원 중 이 직급에 배정된 사원이 없습니다.'
              }
              columns={[
                {
                  key: 'select',
                  header: '',
                  render: (employee) => (
                    <input
                      type="checkbox"
                      checked={selectedAssignedEmployeeIds.includes(
                        employee.empId,
                      )}
                      onChange={() => toggleAssignedEmployee(employee.empId)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`${employee.empNm} 회수 선택`}
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
                  key: 'rank',
                  header: '직급',
                  render: (employee) => (
                    <Badge variant="outline">{getEmployeeRankName(employee)}</Badge>
                  ),
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
              ]}
            />
          </ContentCard>

          <ContentCard
            title="전체 사원 목록"
            description="직급 부여 모달에서 선택 가능한 사원 목록입니다."
            actions={
              <form onSubmit={handleEmployeeSearch} className="flex gap-2">
                <SearchInput
                  value={employeeKeyword}
                  onChange={(event) => setEmployeeKeyword(event.target.value)}
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
                      key: 'rank',
                      header: '직급',
                      render: (employee) => getEmployeeRankName(employee),
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
        open={rankModalMode !== null}
        title={rankModalMode === 'create' ? '직급 생성' : '직급 수정'}
        description={
          rankModalMode === 'create'
            ? '직급명과 정렬 순서를 입력합니다. 직급 ID는 자동으로 생성됩니다.'
            : '직급 ID는 수정할 수 없습니다.'
        }
        onClose={closeRankModal}
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeRankModal}
              disabled={rankSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              form="admin-rank-form"
              loading={rankSubmitting}
            >
              저장
            </Button>
          </>
        }
      >
        <form
          id="admin-rank-form"
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleRankSubmit}
        >
          <div className="md:col-span-2">
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
              직급 ID
            </span>
            <div className="mt-2 flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
              {rankModalMode === 'edit'
                ? (selectedRank?.rankId ?? '-')
                : '저장 시 자동 생성됩니다 (예: RANK_01)'}
            </div>
          </div>
          <FormField
            label="직급명"
            required
            value={rankForm.rankName}
            onChange={(event) =>
              setRankForm((current) => ({
                ...current,
                rankName: event.target.value,
              }))
            }
          />
          <FormField
            label="정렬 순서"
            type="number"
            min={0}
            required
            value={rankForm.sortOrder}
            onChange={(event) =>
              setRankForm((current) => ({
                ...current,
                sortOrder: Number(event.target.value),
              }))
            }
          />
          {rankSubmitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 md:col-span-2">
              {rankSubmitError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        title="직급 삭제"
        description="배정 사원이 있으면 대체 직급으로 이전한 뒤 기존 직급이 비활성화됩니다."
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
              {selectedRank?.rankName}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              배정 사원 {assignedEmployeeCount}명
            </p>
          </div>

          {assignedEmployeeCount > 0 && (
            <Select
              label="대체 직급"
              required
              value={replacementRankId}
              onChange={(event) => setReplacementRankId(event.target.value)}
              options={[
                { value: '', label: '대체 직급 선택' },
                ...replacementOptions.map((rank) => ({
                  value: rank.rankId,
                  label: rank.rankName,
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
        title="직급 부여"
        description="선택한 직급을 여러 사원에게 한 번에 부여합니다."
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
              form="admin-rank-assign-form"
              loading={assignSubmitting}
            >
              부여
            </Button>
          </>
        }
      >
        <form
          id="admin-rank-assign-form"
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
                  key: 'rank',
                  header: '현재 직급',
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
                rankSubmitting ||
                statusUpdating ||
                deleteSubmitting ||
                assignSubmitting ||
                revokeSubmitting
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
                rankSubmitting ||
                statusUpdating ||
                deleteSubmitting ||
                assignSubmitting ||
                revokeSubmitting
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
