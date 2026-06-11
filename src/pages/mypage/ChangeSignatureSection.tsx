import { useEffect, useRef, useState } from 'react';
import { ImageUp, Signature } from 'lucide-react';
import { ApiError } from '../../api/axiosInstance';
import { mypageApi } from '../../api/myPageAPi';
import Button from '../../components/common/button/Button';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import { useToast } from '../../components/common/toast/useToast';
import type { MyPageState } from '../../hooks/useMyPage';

const getErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : '전자서명 변경 중 문제가 발생했습니다.';

// 파일 저장소에서 서명 이미지를 조회하는 URL을 만든다. (GET /api/files/{id})
const buildFileUrl = (fileId?: number | null) => {
  if (!fileId) return null;
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';
  return `${apiBaseUrl}/api/files/${fileId}`;
};

// 업로드 응답이 number 이거나 { fileId } / { atchFileId } 형태일 수 있어 모두 처리한다.
const extractFileId = (
  data: number | { fileId?: number; atchFileId?: number } | undefined,
): number | null => {
  if (typeof data === 'number') return data;
  return data?.fileId ?? data?.atchFileId ?? null;
};

interface ChangeSignatureSectionProps {
  state: MyPageState;
}

export default function ChangeSignatureSection({ state }: ChangeSignatureSectionProps) {
  const { myPage, reload } = state;
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentSignatureUrl = buildFileUrl(myPage?.mbrStampFileId);

  // 선택한 파일의 미리보기 URL을 만들고, 언마운트/변경 시 해제한다.
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && !file.type.startsWith('image/')) {
      showToast({ title: '이미지 파일만 업로드할 수 있습니다.', variant: 'danger' });
      return;
    }
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile || submitting) return;

    setSubmitting(true);
    try {
      const uploadResponse = await mypageApi.uploadStampImage(selectedFile);
      const fileId = extractFileId(uploadResponse.data.data);

      if (!fileId) {
        throw new Error('업로드된 파일 ID를 받지 못했습니다.');
      }

      await mypageApi.changeSignature({ mbrStampFileId: fileId });
      showToast({ title: '전자서명 이미지가 변경되었습니다.', variant: 'success' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await reload();
    } catch (error) {
      showToast({
        title: '전자서명 변경 실패',
        description: getErrorMessage(error),
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentCard
      title="전자서명 이미지 변경"
      description="결재 문서 등에 사용할 전자서명 이미지를 등록합니다."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500">현재 서명</span>
            <div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              {currentSignatureUrl ? (
                <img
                  src={currentSignatureUrl}
                  alt="현재 전자서명"
                  className="max-h-28 max-w-full object-contain"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs font-semibold text-slate-400">
                  <Signature size={24} aria-hidden="true" />
                  등록된 서명이 없습니다.
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-500">새 서명 미리보기</span>
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="새 전자서명 미리보기"
                  className="max-h-28 max-w-full object-contain"
                />
              ) : (
                <span className="text-xs font-semibold text-slate-400">
                  이미지를 선택하세요.
                </span>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelect}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            leftIcon={<ImageUp size={16} aria-hidden="true" />}
            onClick={() => fileInputRef.current?.click()}
          >
            이미지 선택
          </Button>
          {selectedFile && (
            <span className="truncate text-xs font-semibold text-slate-500">
              {selectedFile.name}
            </span>
          )}
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={!selectedFile || submitting}
            onClick={() => void handleSave()}
          >
            서명 저장
          </Button>
        </div>
      </div>
    </ContentCard>
  );
}
