import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Mail,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/axiosInstance';
import { authApi } from '../../api/authApi';
import Button from '../../components/common/button/Button';
import FormField from '../../components/common/form/formField/FormField';
import { useAuth } from '../../store/AuthContext';

const firstLoginEmailStorageKey = 'firstLoginEmailAddr';
const firstLoginNotificationRefreshKey = 'firstLoginNotificationRefresh';

function getFirstLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return '첫 로그인 완료 처리 중 문제가 발생했습니다.';
}

export default function FirstLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();
  const [emailAddr, setEmailAddr] = useState(
    () => sessionStorage.getItem(firstLoginEmailStorageKey) ?? '',
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authorizing, setAuthorizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const mailConnected = query.get('mailConnected') === 'Y';
  const mailConnectionFailed = query.get('mailConnected') === 'N';
  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canComplete =
    emailAddr.trim().length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    mailConnected &&
    !submitting;

  const connectGoogleMail = async () => {
    setAuthorizing(true);
    setErrorMessage('');

    try {
      if (emailAddr.trim()) {
        sessionStorage.setItem(firstLoginEmailStorageKey, emailAddr.trim());
      }

      const response = await authApi.getGoogleAuthorizeUrl();
      const authorizationUrl = response.data.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error('Google 메일 연결 URL이 없습니다.');
      }

      window.location.href = authorizationUrl;
    } catch (error) {
      setErrorMessage(getFirstLoginErrorMessage(error));
      setAuthorizing(false);
    }
  };

  const completeFirstLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canComplete) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await authApi.completeFirstLogin({
        emailAddr: emailAddr.trim(),
        newPassword,
      });

      sessionStorage.removeItem(firstLoginEmailStorageKey);
      sessionStorage.setItem(firstLoginNotificationRefreshKey, 'true');
      localStorage.removeItem('firstLoginRequired');
      refreshAuth();
      navigate('/components', { replace: true });
    } catch (error) {
      setErrorMessage(getFirstLoginErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex w-full max-w-[760px] flex-col px-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <KeyRound size={24} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                첫 로그인 설정
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                비밀번호 변경과 Google 메일 연결을 완료해야 MyCrew를 사용할 수
                있습니다.
              </p>
            </div>
          </div>
        </div>

        <form className="grid gap-6 p-8 lg:grid-cols-[1fr_280px]" onSubmit={completeFirstLogin}>
          <div className="flex flex-col gap-4">
            <FormField
              label="Google 이메일"
              type="email"
              autoComplete="email"
              placeholder="person@gmail.com"
              value={emailAddr}
              onChange={(event) => setEmailAddr(event.target.value)}
              helperText="Google OAuth로 연결한 이메일과 같은 주소를 입력하세요."
            />

            <FormField
              label="새 비밀번호"
              type="password"
              autoComplete="new-password"
              placeholder="New-password1!"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              helperText="영문, 숫자, 특수문자를 포함한 안전한 비밀번호를 사용하세요."
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

            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorMessage}
              </p>
            )}
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <Mail size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Google 메일 연결
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Gmail 권한 동의가 필요합니다.
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                mailConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : mailConnectionFailed
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span className="flex items-center gap-2">
                {mailConnected ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <AlertCircle size={17} />
                )}
                {mailConnected
                  ? 'Google 메일 연결 완료'
                  : mailConnectionFailed
                    ? 'Google 메일 연결 실패'
                    : 'Google 메일 연결 전'}
              </span>
            </div>

            <Button
              type="button"
              variant={mailConnected ? 'success' : 'outline'}
              loading={authorizing}
              disabled={submitting}
              rightIcon={<ExternalLink size={16} aria-hidden="true" />}
              onClick={() => void connectGoogleMail()}
              fullWidth
            >
              {mailConnected ? '다시 연결하기' : 'Google 메일 연결'}
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!canComplete}
              fullWidth
            >
              첫 로그인 완료
            </Button>
          </aside>
        </form>
      </section>
    </main>
  );
}
