import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, MapPin, Pencil, X } from 'lucide-react';
import { ApiError } from '../../api/axiosInstance';
import { mypageApi } from '../../api/myPageAPi';
import { useDaumPostcode } from '../../hooks/useDaumPostcode';
import Button from '../../components/common/button/Button';
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import { useToast } from '../../components/common/toast/useToast';
import type { MyPageState } from '../../hooks/useMyPage';
import {
  formatMyPageDate,
  formatMyPageValue,
  getMyPageMeta,
  getRoleNames,
} from '../../hooks/useMyPage';

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
    <dt className="text-xs font-bold text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</dd>
  </div>
);

const inputCls =
  'h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-medium outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-bold text-slate-500">{label}</span>
    {children}
  </label>
);

const formatAddress = (zip: string | null, addr: string | null) =>
  [formatMyPageValue(zip, ''), formatMyPageValue(addr, '')].filter(Boolean).join(' ') || '-';

interface ProfileSectionProps {
  state: MyPageState;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
};

type EditForm = {
  empNm: string;
  mblTelno: string;
  zip: string;
  addr: string;
};

export default function ProfileSection({ state }: ProfileSectionProps) {
  const { myPage, loading, error, reload } = state;
  const { showToast } = useToast();
  const { open: openPostcode } = useDaumPostcode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    empNm: '',
    mblTelno: '',
    zip: '',
    addr: '',
  });

  // 편집 시작 시 현재 값으로 폼 초기화
  useEffect(() => {
    if (editing && myPage) {
      setForm({
        empNm: myPage.empNm ?? '',
        mblTelno: myPage.mblTelno ?? '',
        zip: myPage.zip ?? '',
        addr: myPage.addr ?? '',
      });
    }
  }, [editing, myPage]);

  const handleSearchAddress = () => {
    void openPostcode((data) => {
      setForm((p) => ({ ...p, zip: data.zonecode, addr: data.address }));
    }).catch(() =>
      showToast({ title: '우편번호 서비스를 불러오지 못했습니다.', variant: 'danger' }),
    );
  };

  const handlePickImage = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({ title: '이미지 파일만 업로드할 수 있습니다.', variant: 'danger' });
      return;
    }

    setUploading(true);
    try {
      await mypageApi.changeProfileImage(file);
      showToast({ title: '프로필 이미지가 변경되었습니다.', variant: 'success' });
      await reload();
    } catch (uploadError) {
      showToast({
        title: '프로필 이미지 변경 실패',
        description: getErrorMessage(uploadError, '프로필 이미지 변경 중 문제가 발생했습니다.'),
        variant: 'danger',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.empNm.trim()) {
      showToast({ title: '이름을 입력하세요.', variant: 'danger' });
      return;
    }
    setSaving(true);
    try {
      await mypageApi.changeProfileInfo({
        empNm: form.empNm.trim(),
        mblTelno: form.mblTelno.trim() || undefined,
        zip: form.zip.trim() || undefined,
        addr: form.addr.trim() || undefined,
      });
      showToast({ title: '개인정보가 변경되었습니다.', variant: 'success' });
      setEditing(false);
      await reload();
    } catch (saveError) {
      showToast({
        title: '개인정보 변경 실패',
        description: getErrorMessage(saveError, '개인정보 변경 중 문제가 발생했습니다.'),
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <ContentCard title="프로필">
        <EmptyState title="마이페이지 정보를 불러오지 못했습니다." description={error} />
      </ContentCard>
    );
  }

  if (loading) {
    return (
      <ContentCard title="프로필">
        <div className="py-10 text-center text-sm font-semibold text-slate-500">
          마이페이지 정보를 불러오는 중입니다.
        </div>
      </ContentCard>
    );
  }

  if (!myPage) {
    return (
      <ContentCard title="프로필">
        <EmptyState title="마이페이지 정보가 없습니다." />
      </ContentCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 히어로 카드 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-12 flex items-end gap-4">
              <div className="relative flex-shrink-0">
                <ProfileAvatar
                  fileId={myPage.prflImgFileId}
                  name={myPage.empNm}
                  size={96}
                  rounded="2xl"
                  className="h-24 w-24 text-3xl ring-4 ring-white"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleImageChange(event)}
                />
                <button
                  type="button"
                  onClick={handlePickImage}
                  disabled={uploading}
                  aria-label="프로필 이미지 변경"
                  title="프로필 이미지 변경"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Camera size={15} aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="min-w-0 pb-1">
                <h2 className="truncate text-xl font-black text-slate-950">
                  {formatMyPageValue(myPage.empNm, '사용자')}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {getMyPageMeta(myPage)}
                </p>
              </div>
            </div>

            {!editing && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Pencil size={14} />}
                onClick={() => setEditing(true)}
              >
                개인정보 수정
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 기본 정보 (읽기 전용) */}
      <ContentCard title="기본 정보">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="사번" value={formatMyPageValue(myPage.empId)} />
          <InfoItem label="이메일" value={formatMyPageValue(myPage.emailAddr)} />
          <InfoItem label="입사일" value={formatMyPageDate(myPage.entcoYmd)} />
          <InfoItem label="부서" value={formatMyPageValue(myPage.department?.deptNm)} />
          <InfoItem label="직위" value={formatMyPageValue(myPage.jobPosition?.jobPstnNm)} />
          <InfoItem label="직급" value={formatMyPageValue(myPage.jobGrade?.jobGrdNm)} />
          <InfoItem label="역할" value={getRoleNames(myPage)} />
        </dl>
      </ContentCard>

      {/* 개인정보 (수정 가능) */}
      <ContentCard
        title="개인정보"
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<X size={14} />}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={14} />}
                loading={saving}
                onClick={handleSave}
              >
                저장
              </Button>
            </div>
          ) : undefined
        }
      >
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="이름">
              <input
                className={inputCls}
                value={form.empNm}
                onChange={(e) => setForm((p) => ({ ...p, empNm: e.target.value }))}
                placeholder="이름"
              />
            </Field>
            <Field label="휴대전화">
              <input
                className={inputCls}
                value={form.mblTelno}
                onChange={(e) => setForm((p) => ({ ...p, mblTelno: e.target.value }))}
                placeholder="010-1234-5678"
              />
            </Field>
            <Field label="우편번호">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={form.zip}
                  readOnly
                  placeholder="주소 검색"
                />
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MapPin size={14} />}
                  onClick={handleSearchAddress}
                  className="h-10 shrink-0 whitespace-nowrap"
                >
                  주소 검색
                </Button>
              </div>
            </Field>
            <Field label="주소">
              <input
                className={inputCls}
                value={form.addr}
                onChange={(e) => setForm((p) => ({ ...p, addr: e.target.value }))}
                placeholder="주소 검색 후 상세주소 입력"
              />
            </Field>
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="이름" value={formatMyPageValue(myPage.empNm)} />
            <InfoItem label="휴대전화" value={formatMyPageValue(myPage.mblTelno)} />
            <InfoItem label="주소" value={formatAddress(myPage.zip, myPage.addr)} />
          </dl>
        )}
      </ContentCard>
    </div>
  );
}
