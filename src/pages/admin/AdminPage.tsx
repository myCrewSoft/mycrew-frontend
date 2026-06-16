import {
  Building2,
  Database,
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable';
import type {
  AdminAccessResponse,
  AdminDashboardResponse,
  AdminDashboardStatusCount,
} from '../../types/admin';

interface AdminPageProps {
  access: AdminAccessResponse;
}

// 사원 상태 코드 → 배지 색상 매핑 (정의되지 않은 코드는 neutral)
const statusBadgeVariant: Record<
  string,
  'success' | 'warning' | 'neutral' | 'outline' | 'danger'
> = {
  EMP_INITIAL: 'outline',
  EMP_ACTIVE: 'success',
  EMP_INACTIVE: 'neutral',
  EMP_RETIRED: 'danger',
  EMP_VACATION: 'warning',
  EMP_LOGIN: 'success',
  EMP_LOGOUT: 'neutral',
};

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

export default function AdminPage({ access }: AdminPageProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await adminApi.getDashboard();
      setDashboard(response.data.data ?? null);
    } catch {
      setDashboard(null);
      setErrorMessage('대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [loadDashboard]);

  const summaryItems = useMemo(
    () => [
      {
        title: '사원',
        value: dashboard?.totalEmployees ?? 0,
        caption: '전체 등록 사원',
        icon: Users,
        badge: '사원',
      },
      {
        title: '역할',
        value: dashboard?.roleCount ?? 0,
        caption: '운영 중인 역할',
        icon: ShieldCheck,
        badge: '권한 그룹',
      },
      {
        title: '권한',
        value: dashboard?.permissionCount ?? 0,
        caption: '등록된 권한',
        icon: KeyRound,
        badge: '권한',
      },
      {
        title: '부서',
        value: dashboard?.departmentCount ?? 0,
        caption: '사용 중인 부서',
        icon: Building2,
        badge: '조직',
      },
    ],
    [dashboard],
  );

  const statusRows = dashboard?.employeeStatusCounts ?? [];
  const totalEmployees = dashboard?.totalEmployees ?? 0;

  const getStatusLabel = (row: AdminDashboardStatusCount) =>
    row.empStatNm?.trim() || row.empStatCd;

  const getStatusRatio = (count: number) =>
    totalEmployees > 0 ? Math.round((count / totalEmployees) * 1000) / 10 : 0;

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Badge variant="outline">Backend verified</Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            관리자 대시보드
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            사번 {access.empId} 관리자 세션
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCcw size={17} />}
            loading={loading}
            onClick={() => void loadDashboard()}
          >
            새로고침
          </Button>
          <Button variant="outline" leftIcon={<Database size={17} />}>
            설정 백업
          </Button>
          <Button variant="primary" leftIcon={<UserPlus size={17} />}>
            사용자 초대
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <ContentCard key={item.title} title={item.title}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold tracking-tight text-slate-950">
                    {loading ? '—' : formatNumber(item.value)}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {item.caption}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={22} />
                </div>
              </div>
              <div className="mt-4">
                <Badge variant="neutral">{item.badge}</Badge>
              </div>
            </ContentCard>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ContentCard
          title="사원 상태별 인원 분포"
          description="현재 등록된 사원을 상태별로 집계한 결과입니다."
        >
          {loading ? (
            <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
              불러오는 중입니다.
            </p>
          ) : (
            <DataTable
              data={statusRows}
              getRowKey={(row) => row.empStatCd}
              columns={[
                {
                  key: 'status',
                  header: '상태',
                  render: (row) => (
                    <Badge variant={statusBadgeVariant[row.empStatCd] ?? 'neutral'}>
                      {getStatusLabel(row)}
                    </Badge>
                  ),
                },
                {
                  key: 'count',
                  header: '인원',
                  render: (row) => `${formatNumber(row.count)}명`,
                },
                {
                  key: 'ratio',
                  header: '비율',
                  render: (row) => `${getStatusRatio(row.count)}%`,
                },
              ]}
            />
          )}
        </ContentCard>

        <ContentCard title="접근 판정">
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">권한 확인</span>
              <Badge variant="success">통과</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">사번</span>
              <span className="font-bold text-slate-950">{access.empId}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">전체 사원</span>
              <span className="font-bold text-slate-950">
                {loading ? '—' : `${formatNumber(totalEmployees)}명`}
              </span>
            </div>
          </div>
        </ContentCard>
      </div>
    </section>
  );
}
