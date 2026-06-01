import { Database, KeyRound, ShieldCheck, UserPlus, Users } from 'lucide-react';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import DataTable from '../../components/common/dataDisplay/dataTable/DataTable';
import type { AdminAccessResponse } from '../../types/admin';

interface AdminPageProps {
  access: AdminAccessResponse;
}

interface AdminAuditRow {
  id: string;
  area: string;
  target: string;
  status: '정상' | '점검' | '제한';
}

const summaryItems = [
  {
    title: '사용자',
    value: '128',
    caption: '활성 계정',
    icon: Users,
    badge: '계정',
  },
  {
    title: '권한 그룹',
    value: '12',
    caption: '운영 중',
    icon: ShieldCheck,
    badge: '권한',
  },
  {
    title: '보안 정책',
    value: '6',
    caption: '적용 중',
    icon: KeyRound,
    badge: '정책',
  },
];

const auditRows: AdminAuditRow[] = [
  {
    id: 'ADM-001',
    area: '사용자 관리',
    target: '신규 입사자 계정',
    status: '정상',
  },
  {
    id: 'ADM-002',
    area: '권한 관리',
    target: '부서별 권한 세트',
    status: '점검',
  },
  {
    id: 'ADM-003',
    area: '시스템 설정',
    target: '접근 정책',
    status: '정상',
  },
];

const statusVariant = {
  정상: 'success',
  점검: 'warning',
  제한: 'danger',
} as const;

export default function AdminPage({ access }: AdminPageProps) {
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
          <Button variant="outline" leftIcon={<Database size={17} />}>
            설정 백업
          </Button>
          <Button variant="primary" leftIcon={<UserPlus size={17} />}>
            사용자 초대
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <ContentCard key={item.title} title={item.title}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold tracking-tight text-slate-950">
                    {item.value}
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
          title="운영 상태"
          description="관리 콘솔의 주요 운영 지표입니다."
        >
          <DataTable
            data={auditRows}
            getRowKey={(row) => row.id}
            columns={[
              { key: 'id', header: 'ID', render: (row) => row.id },
              { key: 'area', header: '영역', render: (row) => row.area },
              { key: 'target', header: '대상', render: (row) => row.target },
              {
                key: 'status',
                header: '상태',
                render: (row) => (
                  <Badge variant={statusVariant[row.status]}>
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />
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
              <span className="font-semibold text-slate-500">판정 주체</span>
              <span className="font-bold text-slate-950">Backend</span>
            </div>
          </div>
        </ContentCard>
      </div>
    </section>
  );
}
