import { useState } from 'react';
import type { FormEvent } from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { ApiError } from '../../api/axiosInstance';
import { mypageApi } from '../../api/myPageAPi';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import FormField from '../../components/common/form/formField/FormField';
import { useToast } from '../../components/common/toast/useToast';
import type { EmployeeMyPage } from '../../types/myPage';

const getErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : '이메일 변경 중 문제가 발생했습니다.';

interface ChangeEmailSectionProps {
  myPage: EmployeeMyPage | null;
}

export default function ChangeEmailSection({ myPage }: ChangeEmailSectionProps) {
  const { showToast } = useToast();
  const [emailAddr, setEmailAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentEmail = myPage?.emailAddr ?? '-';
  const trimmed = emailAddr.trim();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const isSame = trimmed.length > 0 && trimmed === myPage?.emailAddr;
  const canSubmit = isValid && !isSame && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const response = await mypageApi.changeEmail({ emailAddr: trimmed });
      const authorizationUrl = response.data.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error('Google 인증 URL을 받지 못했습니다.');
      }

      // 이메일 변경은 Google OAuth 재연동이 필요하므로 인증 페이지로 이동한다.
      window.location.href = authorizationUrl;
    } catch (error) {
      showToast({
        title: '이메일 변경 실패',
        description: getErrorMessage(error),
        variant: 'danger',
      });
      setSubmitting(false);
    }
  };

  return (
    <ContentCard
      title="이메일 변경"
      description="새 이메일로 변경하면 Google 메일 재연동이 필요합니다."
    >
      <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold text-slate-500">현재 이메일</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Mail size={16} aria-hidden="true" />
            {currentEmail}
          </p>
        </div>

        <FormField
          label="새 이메일"
          type="email"
          autoComplete="email"
          placeholder="person@gmail.com"
          value={emailAddr}
          onChange={(event) => setEmailAddr(event.target.value)}
          helperText="Google OAuth로 연동할 Gmail 주소를 입력하세요."
          errorText={isSame ? '현재 이메일과 동일합니다.' : ''}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!canSubmit}
            rightIcon={<ExternalLink size={16} aria-hidden="true" />}
          >
            변경하고 Google 연동
          </Button>
        </div>
      </form>
    </ContentCard>
  );
}
