import { UserRound } from 'lucide-react';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import {
  formatMyPageDate,
  formatMyPageValue,
  getMyPageInitial,
  getMyPageMeta,
  getRoleNames,
  useMyPage,
} from '../../hooks/useMyPage';

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <dt className="text-xs font-bold text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
      {value}
    </dd>
  </div>
);

const formatAddress = (zip: string | null, addr: string | null) =>
  [formatMyPageValue(zip, ''), formatMyPageValue(addr, '')]
    .filter(Boolean)
    .join(' ') || '-';

export default function MyPage() {
  const { myPage, loading, error } = useMyPage();

  return (
    <section className="flex w-full max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">마이페이지</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          내 프로필과 조직 정보를 확인합니다.
        </p>
      </div>

      <ContentCard title="프로필">
        {error ? (
          <EmptyState
            title="마이페이지 정보를 불러오지 못했습니다."
            description={error}
          />
        ) : loading ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">
            마이페이지 정보를 불러오는 중입니다.
          </div>
        ) : myPage ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-black text-blue-700">
                {myPage.empNm ? getMyPageInitial(myPage) : <UserRound size={32} />}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-950">
                  {formatMyPageValue(myPage.empNm, '사용자')}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {getMyPageMeta(myPage)}
                </p>

                <dl className="mt-5 grid gap-3 md:grid-cols-3">
                  <InfoItem
                    label="사번"
                    value={formatMyPageValue(myPage.empId)}
                  />
                  <InfoItem
                    label="이메일"
                    value={formatMyPageValue(myPage.emailAddr)}
                  />
                  <InfoItem
                    label="부서"
                    value={formatMyPageValue(myPage.department?.deptNm)}
                  />
                  <InfoItem
                    label="직위"
                    value={formatMyPageValue(myPage.jobPosition?.jobPstnNm)}
                  />
                  <InfoItem
                    label="직급"
                    value={formatMyPageValue(myPage.jobGrade?.jobGrdNm)}
                  />
                </dl>
              </div>
            </div>

            <dl className="grid gap-3 md:grid-cols-2">
              <InfoItem
                label="휴대전화"
                value={formatMyPageValue(myPage.mblTelno)}
              />
              <InfoItem label="입사일" value={formatMyPageDate(myPage.entcoYmd)} />
              <InfoItem
                label="주소"
                value={formatAddress(myPage.zip, myPage.addr)}
              />
              <InfoItem 
                label="역할" 
                value={getRoleNames(myPage)} 
              />
            </dl>
          </div>
        ) : (
          <EmptyState title="마이페이지 정보가 없습니다." />
        )}
      </ContentCard>
    </section>
  );
}
