import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LockKeyhole, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/axiosInstance';
import { authApi } from '../../api/authApi';
import Button from '../../components/common/button/Button';
import FormField from '../../components/common/form/formField/FormField';
import { useAuth } from '../../store/AuthContext';

function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return '로그인 중 문제가 발생했습니다.';
  }

  if (error.errorCode === 'AUTH_005') {
    return '사번 또는 비밀번호를 확인해주세요.';
  }

  if (error.errorCode === 'USER_004') {
    return '사용할 수 없는 계정입니다. 관리자에게 문의해주세요.';
  }

  return error.message || '로그인 중 문제가 발생했습니다.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const expired = searchParams.get('expired') === 'true';
  const redirectTo = searchParams.get('redirect') || '/components';

  const empIdError = empId && !/^\d+$/.test(empId)
    ? '사번은 숫자만 입력해주세요.'
    : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmpId = empId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmpId || !trimmedPassword) {
      setErrorMessage('사번과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (!/^\d+$/.test(trimmedEmpId)) {
      setErrorMessage('사번은 숫자만 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await authApi.login({
        empId: Number(trimmedEmpId),
        password: trimmedPassword,
      });
      const data = response.data.data;

      if (!data) {
        throw new Error('로그인 응답에 토큰이 없습니다.');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('empId', String(data.empId));
      localStorage.setItem('authVersion', String(data.authVersion));
      if (data.firstLoginRequired) {
        localStorage.setItem('firstLoginRequired', 'true');
      } else {
        localStorage.removeItem('firstLoginRequired');
      }
      refreshAuth();

      navigate(data.firstLoginRequired ? '/first-login' : redirectTo, {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex w-full max-w-[420px] flex-col px-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <LockKeyhole size={24} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">MyCrew 로그인</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              사번과 비밀번호로 사내 업무 공간에 접속하세요.
            </p>
          </div>
        </div>

        {expired && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            세션이 만료되었습니다. 다시 로그인해주세요.
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormField
            label="사번"
            inputMode="numeric"
            autoComplete="username"
            placeholder="1234"
            value={empId}
            onChange={(event) => setEmpId(event.target.value)}
            errorText={empIdError}
          />

          <FormField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!!empIdError}
            rightIcon={<LogIn size={18} aria-hidden="true" />}
          >
            로그인
          </Button>
        </form>
      </section>
    </main>
  );
}
