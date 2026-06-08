import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { mypageApi } from '../../api/myPageAPi';
import Button from '../../components/common/button/Button';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import FormField from '../../components/common/form/formField/FormField';
import FileUpload from '../../components/common/form/fileUpload/FileUpload';
import Textarea from '../../components/common/form/textarea/Textarea';
import {
  formatMyPageDate,
  formatMyPageValue,
  getMyPageInitial,
  getMyPageMeta,
  getRoleNames,
  useMyPage,
} from '../../hooks/useMyPage';
import './MyPage.css';

type MyPageSection =
  | 'info'
  | 'password'
  | 'signature'
  | 'posts'
  | 'job-duty'
  | 'email';

interface InfoItemProps {
  label: string;
  value: string;
}

interface SectionProps {
  myPage: NonNullable<ReturnType<typeof useMyPage>['myPage']>;
  reload: () => Promise<void>;
}

const sectionTitle: Record<MyPageSection, string> = {
  info: '내 정보',
  password: '비밀번호 변경',
  signature: '전자서명 이미지 변경',
  posts: '내 게시글',
  'job-duty': '내 직무 설정',
  email: '이메일 변경',
};

const routeSectionMap: Record<string, MyPageSection> = {
  password: 'password',
  signature: 'signature',
  posts: 'posts',
  'job-duty': 'job-duty',
  email: 'email',
};

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="mypage-info-item">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const formatAddress = (zip: string | null, addr: string | null) =>
  [formatMyPageValue(zip, ''), formatMyPageValue(addr, '')]
    .filter(Boolean)
    .join(' ') || '-';

const getSection = (section?: string): MyPageSection =>
  section ? routeSectionMap[section] ?? 'info' : 'info';

const StatusMessage = ({
  message,
  variant = 'info',
}: {
  message: string;
  variant?: 'info' | 'success' | 'danger';
}) => <p className={`mypage-status mypage-status-${variant}`}>{message}</p>;

const MyInfoSection = ({ myPage }: SectionProps) => (
  <div className="mypage-card">
    <div className="mypage-profile">
      <div className="mypage-avatar">
        {myPage.empNm ? getMyPageInitial(myPage) : <UserRound size={32} />}
      </div>

      <div className="mypage-profile-main">
        <h2>{formatMyPageValue(myPage.empNm, '사용자')}</h2>
        <p>{getMyPageMeta(myPage)}</p>

        <dl className="mypage-info-grid mypage-info-grid-three">
          <InfoItem label="사번" value={formatMyPageValue(myPage.empId)} />
          <InfoItem label="이메일" value={formatMyPageValue(myPage.emailAddr)} />
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
          <InfoItem label="권한" value={getRoleNames(myPage)} />
        </dl>
      </div>
    </div>

    <dl className="mypage-info-grid">
      <InfoItem label="휴대전화" value={formatMyPageValue(myPage.mblTelno)} />
      <InfoItem label="입사일" value={formatMyPageDate(myPage.entcoYmd)} />
      <InfoItem label="주소" value={formatAddress(myPage.zip, myPage.addr)} />
      <InfoItem label="직무" value={formatMyPageValue(myPage.jobDutyCn)} />
    </dl>
  </div>
);

const PasswordSection = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setSaving(true);
    try {
      await mypageApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('비밀번호가 변경되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="mypage-card mypage-form" onSubmit={handleSubmit}>
      <FormField
        label="현재 비밀번호"
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
      />
      <FormField
        label="새 비밀번호"
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        required
      />
      <FormField
        label="비밀번호 확인"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
      {message && <StatusMessage message={message} variant="success" />}
      {error && <StatusMessage message={error} variant="danger" />}
      <div className="mypage-actions">
        <Button type="submit" loading={saving}>
          변경
        </Button>
      </div>
    </form>
  );
};

const SignatureSection = ({ myPage }: SectionProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const previewUrlRef = useRef('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = (file?: File) => {
    setMessage('');
    setError('');

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSelectedFile(null);
      setError('이미지 파일만 등록할 수 있습니다.');
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('교체할 전자서명 이미지를 선택해 주세요.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      throw new Error(
        '현재 백엔드 API는 전자서명 파일 ID 등록만 지원합니다. 이미지 업로드 API가 추가되면 이 화면에서 바로 저장할 수 있습니다.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '전자서명 이미지 변경에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mypage-card mypage-form">
      <div className="mypage-signature-current">
        <span>현재 전자서명 파일 ID</span>
        <strong>{formatMyPageValue(myPage.mbrStampFileId)}</strong>
      </div>

      <div className="mypage-signature-preview">
        {previewUrl ? (
          <img src={previewUrl} alt="새 전자서명 미리보기" />
        ) : (
          <span>선택한 이미지 미리보기</span>
        )}
      </div>

      <FileUpload
        label="전자서명 이미지 교체"
        helperText="JPG, PNG, GIF, WEBP 이미지 파일만 선택하세요."
        accept="image/*"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />

      {message && <StatusMessage message={message} variant="success" />}
      {error && <StatusMessage message={error} variant="danger" />}
      <div className="mypage-actions">
        <Button onClick={handleSubmit} loading={saving}>
          교체
        </Button>
      </div>
    </div>
  );
};

const PostsSection = () => (
  <div className="mypage-card">
    <EmptyState
      title="내 게시글 화면은 아직 연결하지 않습니다."
      description="요청에 따라 Board 관련 기능은 이번 작업 범위에서 제외했습니다."
    />
  </div>
);

const JobDutySection = ({ myPage, reload }: SectionProps) => {
  const [jobDutyCn, setJobDutyCn] = useState(myPage.jobDutyCn ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await mypageApi.changeJobDuty({ jobDutyCn });
      await reload();
      setMessage('직무 내용이 수정되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '직무 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="mypage-card mypage-form" onSubmit={handleSubmit}>
      <Textarea
        label="내 직무"
        value={jobDutyCn}
        onChange={(event) => setJobDutyCn(event.target.value)}
        placeholder="현재 담당하고 있는 직무를 입력하세요."
        required
      />
      {message && <StatusMessage message={message} variant="success" />}
      {error && <StatusMessage message={error} variant="danger" />}
      <div className="mypage-actions">
        <Button type="submit" loading={saving}>
          수정
        </Button>
      </div>
    </form>
  );
};

const EmailSection = ({ myPage }: SectionProps) => {
  const [emailAddr, setEmailAddr] = useState(myPage.emailAddr ?? '');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestAuthorizeUrl = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await mypageApi.changeEmail({ emailAddr });
      const nextUrl = response.data.data?.authorizationUrl ?? '';
      setAuthorizationUrl(nextUrl);
      setMessage('메일 연동 URL이 발급되었습니다.');
      return nextUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : '메일 연동에 실패했습니다.');
      return '';
    } finally {
      setSaving(false);
    }
  };

  const handleRegister = async () => {
    const nextUrl = authorizationUrl || (await requestAuthorizeUrl());

    if (nextUrl) {
      window.location.href = nextUrl;
    }
  };

  return (
    <div className="mypage-card mypage-form">
      <FormField
        label="새 이메일 주소"
        type="email"
        value={emailAddr}
        onChange={(event) => setEmailAddr(event.target.value)}
        required
      />
      {message && <StatusMessage message={message} variant="success" />}
      {error && <StatusMessage message={error} variant="danger" />}
      <div className="mypage-actions">
        <Button variant="outline" onClick={() => void requestAuthorizeUrl()} loading={saving}>
          메일 연동
        </Button>
        <Button onClick={() => void handleRegister()} loading={saving}>
          등록
        </Button>
      </div>
    </div>
  );
};

export default function MyPage() {
  const params = useParams();
  const currentSection = getSection(params.section);
  const { myPage, loading, error, reload } = useMyPage();

  const content = useMemo(() => {
    if (!myPage) {
      return null;
    }

    switch (currentSection) {
      case 'password':
        return <PasswordSection />;
      case 'signature':
        return <SignatureSection myPage={myPage} reload={reload} />;
      case 'posts':
        return <PostsSection />;
      case 'job-duty':
        return <JobDutySection myPage={myPage} reload={reload} />;
      case 'email':
        return <EmailSection myPage={myPage} reload={reload} />;
      case 'info':
      default:
        return <MyInfoSection myPage={myPage} reload={reload} />;
    }
  }, [currentSection, myPage, reload]);

  return (
    <section className="mypage-page">
      <header className="mypage-header">
        <h1>{sectionTitle[currentSection]}</h1>
        <p>내 프로필과 계정 설정을 관리합니다.</p>
      </header>

      {error ? (
        <EmptyState
          title="마이페이지 정보를 불러오지 못했습니다."
          description={error}
        />
      ) : loading ? (
        <div className="mypage-card mypage-loading">
          마이페이지 정보를 불러오는 중입니다.
        </div>
      ) : myPage ? (
        content
      ) : (
        <EmptyState title="마이페이지 정보가 없습니다." />
      )}
    </section>
  );
}
