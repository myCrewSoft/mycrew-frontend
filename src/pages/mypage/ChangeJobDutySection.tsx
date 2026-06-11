import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../api/axiosInstance';
import { mypageApi } from '../../api/myPageAPi';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import Textarea from '../../components/common/form/textarea/Textarea';
import { useToast } from '../../components/common/toast/useToast';
import type { MyPageState } from '../../hooks/useMyPage';

const getErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : '직무 설정 중 문제가 발생했습니다.';

interface ChangeJobDutySectionProps {
  state: MyPageState;
}

export default function ChangeJobDutySection({ state }: ChangeJobDutySectionProps) {
  const { myPage, loading, reload } = state;
  const { showToast } = useToast();
  const [jobDutyCn, setJobDutyCn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 마이페이지 데이터가 로드되면 기존 직무 내용을 입력값으로 채운다.
  useEffect(() => {
    setJobDutyCn(myPage?.jobDutyCn ?? '');
  }, [myPage?.jobDutyCn]);

  const trimmed = jobDutyCn.trim();
  const isUnchanged = trimmed === (myPage?.jobDutyCn ?? '').trim();
  const canSubmit = !loading && !isUnchanged && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await mypageApi.changeJobDuty({ jobDutyCn: trimmed });
      showToast({ title: '직무 내용이 저장되었습니다.', variant: 'success' });
      await reload();
    } catch (error) {
      showToast({
        title: '직무 설정 실패',
        description: getErrorMessage(error),
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentCard
      title="내 직무 설정"
      description="담당하고 있는 직무 내용을 자유롭게 작성합니다."
    >
      <form className="flex max-w-2xl flex-col gap-4" onSubmit={handleSubmit}>
        <Textarea
          label="직무 내용"
          placeholder="담당 업무, 역할, 책임 등을 입력하세요."
          value={jobDutyCn}
          onChange={(event) => setJobDutyCn(event.target.value)}
          rows={6}
          disabled={loading}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={submitting} disabled={!canSubmit}>
            저장
          </Button>
        </div>
      </form>
    </ContentCard>
  );
}
