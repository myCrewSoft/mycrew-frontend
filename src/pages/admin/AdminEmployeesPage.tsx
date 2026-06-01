import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Eye, RefreshCw, UserPlus, Users } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import Badge from '../../components/common/dataDisplay/badge/Badge';
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
  AdminEmployeeDetail,
  AdminEmployeeListItem,
  AdminEmployeeRegisterRequest,
  AdminEmployeeStatusCode,
  AdminMailAccount,
  AdminRoleAssignment,
} from '../../types/adminEmployee';

const pageSize = 10;

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
  EMP_LOGIN: 'success',
  EMP_LOGOUT: 'neutral',
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
  role.roleName ?? role.roleCd ?? String(role.roleId ?? '-');

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

  const summary = useMemo(() => {
    const total = pagination?.totalElements ?? employees.length;
    const login = employees.filter(
      (employee) => employee.empStatCd === 'EMP_LOGIN',
    ).length;
    const logout = employees.filter(
      (employee) => employee.empStatCd === 'EMP_LOGOUT',
    ).length;
    const vacation = employees.filter(
      (employee) => employee.empStatCd === 'EMP_VACATION',
    ).length;

    return [
      { label: '전체 사원', value: total, caption: '조회된 구성원' },
      { label: '출근', value: login, caption: '현재 근무 중' },
      { label: '퇴근', value: logout, caption: '근무 종료' },
      { label: '휴가', value: vacation, caption: '휴가 등록' },
    ];
  }, [employees, pagination]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSubmittedKeyword(keyword.trim());
  };

  const reload = () => {
    setPage(1);
    setReloadKey((current) => current + 1);
  };

  const openEmployeeDetail = async (empId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setStatusUpdateError(null);
    setSelectedDetail(null);

    try {
      const response = await adminApi.getEmployeeDetail(empId);
      const detail = response.data.data ?? null;
      setSelectedDetail(detail);

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
    if (detailLoading || statusUpdatingCode) {
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
            <Button type="submit" variant="outline">
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
                    <div>
                      <div className="font-bold text-slate-950">
                        {employee.empNm}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        {formatEmployeeId(employee.empId)}
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
        size="xl"
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
            disabled={detailLoading || Boolean(statusUpdatingCode)}
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
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white text-slate-300">
                  <Camera size={44} />
                </div>
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
                <h3 className="text-xs font-bold text-slate-500">권한</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDetail.roleAssignmentList?.length ? (
                    selectedDetail.roleAssignmentList.map((role, index) => (
                      <Badge
                        key={`${getRoleName(role)}-${index}`}
                        variant="outline"
                      >
                        {getRoleName(role)}
                      </Badge>
                    ))
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
          <FormField
            label="우편번호"
            required
            value={registerForm.zip}
            onChange={(event) => updateRegisterForm('zip', event.target.value)}
          />
          <div className="md:col-span-2">
            <FormField
              label="주소"
              required
              value={registerForm.addr}
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
