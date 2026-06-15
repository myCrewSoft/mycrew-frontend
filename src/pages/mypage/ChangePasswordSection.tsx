import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../api/axiosInstance';
import { mypageApi } from '../../api/myPageAPi';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import FormField from '../../components/common/form/formField/FormField';
import { useToast } from '../../components/common/toast/useToast';

const getErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : '비밀번호 변경 중 문제가 발생했습니다.';

export default function ChangePasswordSection() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const sameAsCurrent =
    newPassword.length > 0 && newPassword === currentPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordMismatch &&
    !sameAsCurrent &&
    !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await mypageApi.changePassword({ currentPassword, newPassword });
      showToast({ title: '비밀번호가 변경되었습니다.', variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast({
        title: '비밀번호 변경 실패',
        description: getErrorMessage(error),
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentCard
      title="비밀번호 변경"
      description="현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
    >
      <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
        <FormField
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="현재 비밀번호를 입력하세요"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <FormField
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="New-password1!"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          helperText="영문, 숫자, 특수문자를 포함한 안전한 비밀번호를 사용하세요."
          errorText={sameAsCurrent ? '현재 비밀번호와 다른 비밀번호를 입력하세요.' : ''}
        />
        <FormField
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="새 비밀번호를 다시 입력하세요"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          errorText={passwordMismatch ? '비밀번호가 일치하지 않습니다.' : ''}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={submitting} disabled={!canSubmit}>
            비밀번호 변경
          </Button>
        </div>
      </form>
    </ContentCard>
  );
}
