import { type ChangeEvent, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { ApiError } from '../../api/axiosInstance';
import { mypageApi } from '../../api/myPageAPi';
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

interface ProfileSectionProps {
  state: MyPageState;
}

const getUploadErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return '프로필 이미지 변경 중 문제가 발생했습니다.';
};

export default function ProfileSection({ state }: ProfileSectionProps) {
  const { myPage, loading, error, reload } = state;
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        title: '이미지 파일만 업로드할 수 있습니다.',
        variant: 'danger',
      });
      return;
    }

    setUploading(true);

    try {
      await mypageApi.changeProfileImage(file);

      showToast({
        title: '프로필 이미지가 변경되었습니다.',
        variant: 'success',
      });

      await reload();
    } catch (uploadError) {
      showToast({
        title: '프로필 이미지 변경 실패',
        description: getUploadErrorMessage(uploadError),
        variant: 'danger',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
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
            <div className="relative h-24 w-24 flex-shrink-0">
              <ProfileAvatar
                fileId={myPage.prflImgFileId}
                name={myPage.empNm}
                size={96}
                rounded="2xl"
                className="h-24 w-24 text-3xl"
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

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-950">
                {formatMyPageValue(myPage.empNm, '사용자')}
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {getMyPageMeta(myPage)}
              </p>

              <dl className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoItem label="사번" value={formatMyPageValue(myPage.empId)} />
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
            <InfoItem
              label="입사일"
              value={formatMyPageDate(myPage.entcoYmd)}
            />
            <InfoItem
              label="주소"
              value={formatAddress(myPage.zip, myPage.addr)}
            />
            <InfoItem label="역할" value={getRoleNames(myPage)} />
          </dl>
        </div>
      ) : (
        <EmptyState title="마이페이지 정보가 없습니다." />
      )}
    </ContentCard>
  );
}