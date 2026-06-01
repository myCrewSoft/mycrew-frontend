import { UserRound } from 'lucide-react';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import { getProfileInitial, getProfileMeta, useMyProfile } from '../../hooks/useMyProfile';

const formatCode = (value: string | null | undefined, fallback = '-') =>
  value && value.trim() ? value : fallback;

export default function MyPage() {
  const { profile, loading, error } = useMyProfile();

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
            title="프로필 정보를 불러오지 못했습니다."
            description={error}
          />
        ) : loading ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">
            프로필 정보를 불러오는 중입니다.
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-black text-blue-700">
              {profile.empNm ? getProfileInitial(profile) : <UserRound size={32} />}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-950">
                {formatCode(profile.empNm, '사용자')}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {getProfileMeta(profile)}
              </p>

              <dl className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-bold text-slate-500">부서</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCode(profile.department?.deptNm)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-bold text-slate-500">직위</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCode(profile.jobPosition?.jobPstnNm)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-bold text-slate-500">직급</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCode(profile.jobGrade?.jobGrdNm)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <EmptyState title="프로필 정보가 없습니다." />
        )}
      </ContentCard>
    </section>
  );
}
