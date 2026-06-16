import {
  ArchiveRestore,
  AtSign,
  Download,
  FileText,
  MailPlus,
  Paperclip,
  Pencil,
  Reply,
  ReplyAll,
  Forward,
  RefreshCcw,
  Search,
  Send,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/axiosInstance';
import { authApi } from '../../api/authApi';
import { mailApi } from '../../api/mailApi';
import Button from '../../components/common/button/Button';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import Pagination from '../../components/common/dataDisplay/pagination/Pagination';
import FormField from '../../components/common/form/formField/FormField';
import SearchInput from '../../components/common/form/searchInput/SearchInput';
import Textarea from '../../components/common/form/textarea/Textarea';
import Modal from '../../components/common/overlay/modal/Modal';
import { useToast } from '../../components/common/toast/useToast';
import type {
  MailDetailResponse,
  MailDraftRequest,
  MailLabelResponse,
  MailListResult,
  MailRouteBox,
  MailSendRequest,
  MailSummaryResponse,
  MailboxType,
} from '../../types/mail.dto';

const PAGE_SIZE = 20;
const INBOX_SYNC_MAX_RESULTS = 50;

const mailboxMeta: Record<
  MailRouteBox,
  { title: string; description: string; apiType?: MailboxType }
> = {
  inbox: {
    title: '받은 메일함',
    description: '수신된 메일을 확인하고 처리합니다.',
    apiType: 'inbox',
  },
  sent: {
    title: '보낸 메일함',
    description: '내가 발송한 메일을 확인합니다.',
    apiType: 'sent',
  },
  all: {
    title: '전체 메일',
    description: '모든 메일을 통합해서 조회합니다.',
    apiType: 'all',
  },
  self: {
    title: '내게 쓴 메일',
    description: '내가 나에게 보낸 메일을 확인합니다.',
    apiType: 'self',
  },
  tome: {
    title: '나에게 온 메일',
    description: '내 주소가 수신 대상인 메일을 확인합니다.',
    apiType: 'tome',
  },
  important: {
    title: '중요 메일함',
    description: '중요로 표시한 메일을 모아봅니다.',
    apiType: 'important',
  },
  unread: {
    title: '안읽은 메일',
    description: '아직 읽지 않은 메일만 모아봅니다.',
    apiType: 'unread',
  },
  draft: {
    title: '임시보관함',
    description: '작성 중인 임시보관 메일을 확인하고 이어서 작성합니다.',
    apiType: 'draft',
  },
  trash: {
    title: '휴지통',
    description: '삭제된 메일을 복원하거나 휴지통을 비웁니다.',
  },
};

const participantLabels = {
  FROM: '보낸 사람',
  TO: '받는 사람',
  CC: '참조',
  BCC: '숨은 참조',
  REPLY_TO: '답장 주소',
};

const splitAddresses = (value: string) =>
  value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const isFullHtmlDocument = (content: string) =>
  /^\s*(?:<!doctype\s+html\b|<html[\s>])/i.test(content);

const buildSandboxedMailDocument = (content: string) => {
  if (isFullHtmlDocument(content)) {
    return content;
  }

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; }
      body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.65; overflow-wrap: anywhere; }
      img, table { max-width: 100%; }
    </style>
  </head>
  <body>${content}</body>
</html>`;
};

interface MailContentViewerProps {
  content: string;
  renderMode?: string | null;
}

function MailContentViewer({ content, renderMode }: MailContentViewerProps) {
  return (
    <iframe
      title="메일 본문"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      srcDoc={buildSandboxedMailDocument(content)}
      data-render-mode={renderMode ?? 'SANDBOX_IFRAME'}
      className="h-[70vh] min-h-[420px] max-h-[720px] w-full rounded-xl border border-slate-200 bg-white"
    />
  );
}

const getMailErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.errorCode === 'MAIL_003') {
      return 'Google 메일 권한이 부족합니다. 메일을 다시 연동해 주세요.';
    }

    return error.message;
  }

  return '메일 요청 처리 중 오류가 발생했습니다.';
};

interface ComposePrefill {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  content?: string;
  inReplyToMailId?: number;
  draftMailId?: number;
}

interface ComposeModalProps {
  open: boolean;
  sending: boolean;
  prefill?: ComposePrefill | null;
  onClose: () => void;
  onSubmit: (request: MailSendRequest, attachments: File[]) => Promise<void>;
  onSaveDraft: (request: MailDraftRequest) => Promise<void>;
  onDeleteDraft: (mailId: number) => void;
}

function ComposeModal({
  open,
  sending,
  prefill,
  onClose,
  onSubmit,
  onSaveDraft,
  onDeleteDraft,
}: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [inReplyToMailId, setInReplyToMailId] = useState<number | null>(null);
  const [draftMailId, setDraftMailId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // 모달이 열릴 때 prefill(답장/전달 등) 값으로 폼을 채운다.
  useEffect(() => {
    if (!open) {
      return;
    }
    // 모달 열림 시 폼을 prefill 값으로 동기화 (의도된 1회성 동기화)
    /* eslint-disable react-hooks/set-state-in-effect */
    setTo(prefill?.to ?? '');
    setCc(prefill?.cc ?? '');
    setBcc(prefill?.bcc ?? '');
    setSubject(prefill?.subject ?? '');
    setContent(prefill?.content ?? '');
    setAttachments([]);
    setInReplyToMailId(prefill?.inReplyToMailId ?? null);
    setDraftMailId(prefill?.draftMailId ?? null);
    setError('');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, prefill]);

  const reset = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setContent('');
    setAttachments([]);
    setInReplyToMailId(null);
    setDraftMailId(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAttachments(Array.from(event.target.files ?? []));
  };

  const handleSubmit = async () => {
    const toList = splitAddresses(to);

    if (toList.length === 0) {
      setError('받는 사람을 1명 이상 입력하세요.');
      return;
    }

    if (!subject.trim()) {
      setError('제목을 입력하세요.');
      return;
    }

    if (!content.trim()) {
      setError('본문을 입력하세요.');
      return;
    }

    setError('');
    await onSubmit(
      {
        to: toList,
        cc: splitAddresses(cc),
        bcc: splitAddresses(bcc),
        subject: subject.trim(),
        content,
        inReplyToMailId: inReplyToMailId ?? undefined,
      },
      attachments,
    );
    reset();
  };

  const handleSaveDraft = async () => {
    setError('');
    await onSaveDraft({
      mailId: draftMailId ?? undefined,
      to: splitAddresses(to),
      cc: splitAddresses(cc),
      bcc: splitAddresses(bcc),
      subject: subject.trim(),
      content,
    });
  };

  return (
    <Modal
      open={open}
      title="메일 쓰기"
      description="수신자는 쉼표, 세미콜론 또는 줄바꿈으로 여러 명을 입력할 수 있습니다."
      onClose={handleClose}
      size="lg"
      footer={
        <>
          {draftMailId != null ? (
            <Button
              variant="danger"
              onClick={() => onDeleteDraft(draftMailId)}
            >
              삭제
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button variant="outline" onClick={() => void handleSaveDraft()}>
            임시저장
          </Button>
          <Button
            variant="primary"
            loading={sending}
            leftIcon={<Send size={16} />}
            onClick={() => void handleSubmit()}
          >
            발송
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <FormField
          label="받는 사람"
          placeholder="person@example.com, team@example.com"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="참조"
            placeholder="cc@example.com"
            value={cc}
            onChange={(event) => setCc(event.target.value)}
          />
          <FormField
            label="숨은 참조"
            placeholder="bcc@example.com"
            value={bcc}
            onChange={(event) => setBcc(event.target.value)}
          />
        </div>
        <FormField
          label="제목"
          placeholder="메일 제목"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
        <Textarea
          label="본문"
          helperText="HTML 태그를 포함할 수 있습니다."
          className="min-h-56"
          placeholder="메일 내용을 입력하세요."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">첨부파일</span>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-blue-700"
          />
        </label>
        {attachments.length > 0 ? (
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {attachments.map((file) => (
              <div key={`${file.name}-${file.size}`} className="flex gap-2">
                <Paperclip size={15} />
                <span>{file.name}</span>
                <span className="text-slate-400">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

interface MailListProps {
  mails: MailSummaryResponse[];
  loading: boolean;
  selectedMailId: number | null;
  selectedIds: number[];
  draftView: boolean;
  onSelect: (mailId: number) => void;
  onToggleSelect: (mailId: number) => void;
  onToggleImportant: (mail: MailSummaryResponse) => void;
}

function MailList({
  mails,
  loading,
  selectedMailId,
  selectedIds,
  draftView,
  onSelect,
  onToggleSelect,
  onToggleImportant,
}: MailListProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
        메일을 불러오는 중입니다.
      </div>
    );
  }

  if (mails.length === 0) {
    return (
      <EmptyState
        title="메일이 없습니다."
        description="검색 조건이나 메일함을 변경해 다시 확인하세요."
      />
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {mails.map((mail) => {
        const selected = selectedMailId === mail.mailId;
        const checked = selectedIds.includes(mail.mailId);

        return (
          <div key={mail.mailId} className="flex items-stretch">
            <label
              className="flex cursor-pointer items-start px-3 pt-5"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleSelect(mail.mailId)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </label>
            <button
              type="button"
              onClick={() => onSelect(mail.mailId)}
              className={`flex min-w-0 flex-1 items-start gap-3 py-4 pr-5 text-left transition ${
                selected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
            <span
              className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                mail.unread ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`truncate text-sm ${
                    mail.unread
                      ? 'font-black text-slate-950'
                      : 'font-bold text-slate-700'
                  }`}
                >
                  {mail.subject || '(제목 없음)'}
                </p>
                {mail.hasAttachment ? (
                  <Paperclip size={14} className="flex-shrink-0 text-slate-400" />
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {mail.fromEmail ?? mail.toSummary ?? '발신자 정보 없음'}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                {mail.snippet ?? '본문 미리보기가 없습니다.'}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-400">
                  {formatDateTime(mail.sentAt)}
                </span>
                {!draftView ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleImportant(mail);
                  }}
                  aria-label={mail.important ? '중요 해제' : '중요 설정'}
                  className={`rounded-full p-1 ${
                    mail.important
                      ? 'text-amber-500'
                      : 'text-slate-300 hover:text-amber-500'
                  }`}
                >
                  <Star
                    size={16}
                    fill={mail.important ? 'currentColor' : 'none'}
                  />
                </button>
                ) : null}
              </div>
            </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MailLabelEditor({ mailId }: { mailId: number }) {
  const [allLabels, setAllLabels] = useState<MailLabelResponse[]>([]);
  const [applied, setApplied] = useState<MailLabelResponse[]>([]);

  const load = useCallback(async () => {
    try {
      const [labelsRes, mineRes] = await Promise.all([
        mailApi.getUserLabels(),
        mailApi.getMailLabels(mailId),
      ]);
      setAllLabels(labelsRes.data.data ?? []);
      setApplied(mineRes.data.data ?? []);
    } catch {
      setAllLabels([]);
      setApplied([]);
    }
  }, [mailId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const appliedIds = new Set(applied.map((label) => label.labelId));
  const available = allLabels.filter((label) => !appliedIds.has(label.labelId));

  const apply = async (labelId: number) => {
    try {
      await mailApi.applyLabel(mailId, labelId);
      await load();
    } catch {
      // ignore
    }
  };

  const remove = async (labelId: number) => {
    try {
      await mailApi.removeLabel(mailId, labelId);
      await load();
    } catch {
      // ignore
    }
  };

  if (allLabels.length === 0 && applied.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-slate-500">라벨</span>
      {applied.map((label) => (
        <span
          key={label.labelId}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"
        >
          <Tag size={12} />
          {label.name}
          <button
            type="button"
            onClick={() => void remove(label.labelId)}
            className="hover:text-red-500"
            aria-label={`${label.name} 제거`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      {available.length > 0 ? (
        <select
          value=""
          onChange={(event) => {
            const value = Number(event.target.value);
            if (value) {
              void apply(value);
            }
          }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
        >
          <option value="">+ 라벨 추가</option>
          {available.map((label) => (
            <option key={label.labelId} value={label.labelId}>
              {label.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

interface MailDetailPanelProps {
  detail: MailDetailResponse | null;
  loading: boolean;
  trashView: boolean;
  draftView: boolean;
  onMarkRead: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onMarkUnread: () => void;
  onToggleImportant: () => void;
  onMoveTrash: () => void;
  onRestore: () => void;
  onEditDraft: () => void;
  onSendDraft: () => void;
  onDownloadAttachment: (attachmentId: number, fileName: string) => void;
}

function MailDetailPanel({
  detail,
  loading,
  trashView,
  draftView,
  onMarkRead,
  onReply,
  onReplyAll,
  onForward,
  onMarkUnread,
  onToggleImportant,
  onMoveTrash,
  onRestore,
  onEditDraft,
  onSendDraft,
  onDownloadAttachment,
}: MailDetailPanelProps) {
  const participantGroups = useMemo(() => {
    const groups = new Map<string, string[]>();

    detail?.participants.forEach((participant) => {
      const list = groups.get(participant.type) ?? [];
      list.push(participant.email);
      groups.set(participant.type, list);
    });

    return groups;
  }, [detail]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
        상세를 불러오는 중입니다.
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="메일을 선택하세요."
        description="왼쪽 목록에서 메일을 선택하면 상세 내용이 표시됩니다."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {detail.subject || '(제목 없음)'}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {detail.fromEmail ?? '발신자 정보 없음'} ·{' '}
              {formatDateTime(detail.sentAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {draftView ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Pencil size={15} />}
                  onClick={onEditDraft}
                >
                  수정
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send size={15} />}
                  onClick={onSendDraft}
                >
                  전송
                </Button>
              </>
            ) : (
              <>
            {!trashView ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Reply size={15} />}
                  onClick={onReply}
                >
                  답장
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ReplyAll size={15} />}
                  onClick={onReplyAll}
                >
                  전체답장
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Forward size={15} />}
                  onClick={onForward}
                >
                  전달
                </Button>
              </>
            ) : null}
            {detail.unread ? (
              <Button variant="outline" size="sm" onClick={onMarkRead}>
                읽음 처리
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onMarkUnread}>
                읽지 않음으로 표시
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                <Star
                  size={15}
                  fill={detail.important ? 'currentColor' : 'none'}
                />
              }
              onClick={onToggleImportant}
            >
              {detail.important ? '중요 해제' : '중요 설정'}
            </Button>
            {trashView ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArchiveRestore size={15} />}
                onClick={onRestore}
              >
                복원
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={15} />}
                onClick={onMoveTrash}
              >
                휴지통
              </Button>
            )}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          {Array.from(participantGroups.entries()).map(([type, emails]) => (
            <div key={type} className="flex gap-3">
              <span className="w-20 flex-shrink-0 font-bold text-slate-500">
                {participantLabels[type as keyof typeof participantLabels] ??
                  type}
              </span>
              <span className="min-w-0 text-slate-700">{emails.join(', ')}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {detail.labels.map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>

        <MailLabelEditor mailId={detail.mailId} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {detail.content ? (
          <MailContentViewer
            content={detail.content}
            renderMode={detail.contentRenderMode}
          />
        ) : (
          <p className="text-sm leading-7 text-slate-600">
            {detail.snippet ?? '표시할 본문이 없습니다.'}
          </p>
        )}

        {detail.attachments.length > 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
              <Paperclip size={16} />
              첨부파일
            </h3>
            <div className="grid gap-2">
              {detail.attachments.map((attachment) => (
                <button
                  key={attachment.attachmentId}
                  type="button"
                  onClick={() =>
                    onDownloadAttachment(
                      attachment.attachmentId,
                      attachment.originalFileName,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50"
                >
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                    <FileText size={16} className="text-blue-500" />
                    <span className="truncate">
                      {attachment.originalFileName}
                    </span>
                  </span>
                  <span className="ml-3 flex flex-shrink-0 items-center gap-2 text-xs font-bold text-slate-400">
                    {formatFileSize(attachment.fileSize)}
                    <Download size={14} className="text-blue-500" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function MailPage() {
  const { mailbox, labelId } = useParams<{ mailbox?: string; labelId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentMailbox = (
    mailbox && mailbox in mailboxMeta ? mailbox : 'inbox'
  ) as MailRouteBox;
  const labelMode = Boolean(labelId);
  const labelIdNum = labelId ? Number(labelId) : null;
  const meta = mailboxMeta[currentMailbox];
  const trashView = currentMailbox === 'trash';
  const draftView = currentMailbox === 'draft';
  const inboxView = !labelMode && currentMailbox === 'inbox';

  const [mails, setMails] = useState<MailSummaryResponse[]>([]);
  const [pagination, setPagination] = useState<MailListResult['pagination']>(
    null,
  );
  const [page, setPage] = useState(0);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedMailId, setSelectedMailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MailDetailResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState<ComposePrefill | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [labelName, setLabelName] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [scopeRequired, setScopeRequired] = useState(false);
  const inboxSyncedOnEntryRef = useRef(false);

  const syncMails = useCallback(async () => {
    setSyncing(true);

    try {
      await mailApi.syncMails(INBOX_SYNC_MAX_RESULTS);
    } finally {
      setSyncing(false);
    }
  }, []);

  const loadList = useCallback(async (options?: { syncBefore?: boolean }) => {
    setListLoading(true);
    setErrorMessage('');
    setScopeRequired(false);
    setSelectedIds([]);
    let syncError: unknown = null;

    try {
      if (options?.syncBefore) {
        try {
          await syncMails();
        } catch (error) {
          syncError = error;
        }
      }

      const response =
        labelMode && labelIdNum != null
          ? await mailApi.getMailsByLabel(labelIdNum, { page, size: PAGE_SIZE })
          : trashView
            ? await mailApi.getTrashMails({ page, size: PAGE_SIZE })
            : await mailApi.getMails({
                type: meta.apiType,
                keyword: keyword || undefined,
                page,
                size: PAGE_SIZE,
              });
      const nextMails = response.data.data ?? [];
      setMails(nextMails);
      setPagination(response.data.pagination ?? null);
      if (syncError) {
        setErrorMessage(
          `메일 동기화 중 문제가 발생했지만 저장된 메일을 표시합니다. ${getMailErrorMessage(syncError)}`,
        );
      }
      setSelectedMailId((current) => {
        if (current && nextMails.some((mail) => mail.mailId === current)) {
          return current;
        }

        return nextMails[0]?.mailId ?? null;
      });
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'MAIL_003') {
        setScopeRequired(true);
      }
      setMails([]);
      setPagination(null);
      setSelectedMailId(null);
      setErrorMessage(getMailErrorMessage(error));
    } finally {
      setListLoading(false);
    }
  }, [keyword, meta.apiType, page, syncMails, trashView, labelMode, labelIdNum]);

  useEffect(() => {
    if (!labelMode || labelIdNum == null) {
      return;
    }
    let active = true;
    mailApi
      .getUserLabels()
      .then((res) => {
        if (!active) return;
        const found = (res.data.data ?? []).find(
          (item) => item.labelId === labelIdNum,
        );
        setLabelName(found?.name ?? '라벨');
      })
      .catch(() => {
        if (active) setLabelName('라벨');
      });
    return () => {
      active = false;
    };
  }, [labelMode, labelIdNum]);

  // 헤더 메일 팝오버 등에서 ?mailId=로 진입하면 해당 메일을 자동 선택한다.
  useEffect(() => {
    const mailIdParam = searchParams.get('mailId');
    if (!mailIdParam) {
      return;
    }
    const id = Number(mailIdParam);
    if (!Number.isNaN(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMailId(id);
    }
  }, [searchParams]);

  const loadDetail = useCallback(async () => {
    if (!selectedMailId) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);

    try {
      const response = draftView
        ? await mailApi.getDraft(selectedMailId)
        : await mailApi.getMailDetail(selectedMailId);
      setDetail(response.data.data ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'MAIL_003') {
        setScopeRequired(true);
      }
      setDetail(null);
      showToast({
        title: '메일 상세 조회 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    } finally {
      setDetailLoading(false);
    }
  }, [draftView, selectedMailId, showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      setPage(0);
      setSelectedMailId(null);
      setDetail(null);
      if (!inboxView) {
        inboxSyncedOnEntryRef.current = false;
      }
    });
  }, [currentMailbox, inboxView]);

  useEffect(() => {
    queueMicrotask(() => {
      const syncBefore = inboxView && !inboxSyncedOnEntryRef.current;

      if (syncBefore) {
        inboxSyncedOnEntryRef.current = true;
      }

      void loadList({ syncBefore });
    });
  }, [inboxView, loadList]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDetail();
    });
  }, [loadDetail]);

  useEffect(() => {
    const openCompose = () => {
      setComposePrefill(null);
      setComposeOpen(true);
    };
    window.addEventListener('mail:open-compose', openCompose);
    return () => {
      window.removeEventListener('mail:open-compose', openCompose);
    };
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setKeyword(keywordInput.trim());
  };

  const connectGoogleMail = async () => {
    try {
      const response = await authApi.getGoogleAuthorizeUrl('mail');
      const authorizationUrl = response.data.data?.authorizationUrl;
      window.location.href =
        authorizationUrl || '/mail/oauth/google/authorize?context=mail';
    } catch {
      window.location.href = '/mail/oauth/google/authorize?context=mail';
    }
  };

  const mutateAndReload = async (
    action: () => Promise<unknown>,
    successTitle: string,
  ) => {
    try {
      await action();
      showToast({ title: successTitle, variant: 'success' });
      await loadList();
      await loadDetail();
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'MAIL_003') {
        setScopeRequired(true);
      }
      showToast({
        title: '메일 처리 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    }
  };

  const handleSummaryImportant = (mail: MailSummaryResponse) => {
    void mutateAndReload(
      () =>
        mailApi.updateImportant(mail.mailId, {
          important: !mail.important,
        }),
      mail.important ? '중요 메일을 해제했습니다.' : '중요 메일로 설정했습니다.',
    );
  };

  const handleDetailImportant = () => {
    if (!detail) {
      return;
    }

    void mutateAndReload(
      () =>
        mailApi.updateImportant(detail.mailId, {
          important: !detail.important,
        }),
      detail.important ? '중요 메일을 해제했습니다.' : '중요 메일로 설정했습니다.',
    );
  };

  const handleDownloadAttachment = async (
    attachmentId: number,
    fileName: string,
  ) => {
    if (!detail) {
      return;
    }
    try {
      const response = await mailApi.downloadAttachment(detail.mailId, attachmentId);
      const url = window.URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || 'attachment';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        title: '첨부파일 다운로드 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    }
  };

  const openComposeWith = (prefillValue: ComposePrefill) => {
    setComposePrefill(prefillValue);
    setComposeOpen(true);
  };

  const handleSaveDraft = async (request: MailDraftRequest) => {
    try {
      await mailApi.saveDraft(request);
      setComposeOpen(false);
      setComposePrefill(null);
      showToast({ title: '임시보관에 저장했습니다.', variant: 'success' });
      if (draftView) {
        await loadList();
      } else {
        navigate('/mail/draft');
      }
    } catch (error) {
      showToast({
        title: '임시저장 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    }
  };

  const handleDeleteDraft = async (mailId: number) => {
    try {
      await mailApi.deleteDraft(mailId);
      setComposeOpen(false);
      setComposePrefill(null);
      showToast({ title: '임시보관 메일을 삭제했습니다.', variant: 'success' });
      await loadList();
    } catch (error) {
      showToast({
        title: '삭제 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    }
  };

  const openDraftForEdit = async (mailId: number) => {
    try {
      const response = await mailApi.getDraft(mailId);
      const draft = response.data.data;
      if (!draft) {
        return;
      }
      const emailsOf = (type: string) =>
        draft.participants
          .filter((participant) => participant.type === type)
          .map((participant) => participant.email)
          .join(', ');
      openComposeWith({
        to: emailsOf('TO'),
        cc: emailsOf('CC'),
        bcc: emailsOf('BCC'),
        subject: draft.subject ?? '',
        content: draft.content ?? '',
        draftMailId: draft.mailId,
      });
    } catch (error) {
      showToast({
        title: '임시보관 메일을 불러오지 못했습니다.',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    }
  };

  const handleSendDraft = async (mailId: number) => {
    if (!window.confirm('저장된 임시메일을 바로 전송하시겠습니까?')) {
      return;
    }

    setSending(true);

    try {
      await mailApi.sendDraft(mailId);
      setComposeOpen(false);
      setComposePrefill(null);
      setSelectedIds([]);
      setSelectedMailId(null);
      setDetail(null);
      showToast({ title: '임시보관 메일을 전송했습니다.', variant: 'success' });
      navigate('/mail/sent');
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'MAIL_003') {
        setScopeRequired(true);
      }
      showToast({
        title: '임시보관 메일 전송 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    } finally {
      setSending(false);
    }
  };

  const buildQuotedBody = (source: MailDetailResponse) => {
    const plain = (source.content ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const original = plain || source.snippet || '';
    return `<br/><br/>-------- 원본 메일 --------<br/>보낸 사람: ${source.fromEmail ?? ''}<br/>날짜: ${formatDateTime(source.sentAt)}<br/>제목: ${source.subject ?? ''}<br/><br/>${original}`;
  };

  const withSubjectPrefix = (subjectValue: string, prefix: string) => {
    const base = subjectValue ?? '';
    return base.toLowerCase().startsWith(prefix.toLowerCase())
      ? base
      : `${prefix} ${base}`;
  };

  const handleReply = () => {
    if (!detail) {
      return;
    }
    openComposeWith({
      to: detail.fromEmail ?? '',
      subject: withSubjectPrefix(detail.subject, 'Re:'),
      content: buildQuotedBody(detail),
      inReplyToMailId: detail.mailId,
    });
  };

  const handleReplyAll = () => {
    if (!detail) {
      return;
    }
    const toList = detail.participants
      .filter((participant) => participant.type === 'TO')
      .map((participant) => participant.email);
    const ccList = detail.participants
      .filter((participant) => participant.type === 'CC')
      .map((participant) => participant.email);
    const recipients = Array.from(
      new Set([detail.fromEmail ?? '', ...toList].filter(Boolean)),
    );
    openComposeWith({
      to: recipients.join(', '),
      cc: Array.from(new Set(ccList)).join(', '),
      subject: withSubjectPrefix(detail.subject, 'Re:'),
      content: buildQuotedBody(detail),
      inReplyToMailId: detail.mailId,
    });
  };

  const handleForward = () => {
    if (!detail) {
      return;
    }
    openComposeWith({
      subject: withSubjectPrefix(detail.subject, 'Fwd:'),
      content: buildQuotedBody(detail),
    });
  };

  const toggleSelect = (mailId: number) => {
    setSelectedIds((prev) =>
      prev.includes(mailId)
        ? prev.filter((id) => id !== mailId)
        : [...prev, mailId],
    );
  };

  const allSelected = mails.length > 0 && selectedIds.length === mails.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : mails.map((mail) => mail.mailId));
  };

  const runBulk = async (
    action: 'read' | 'trash' | 'important',
    important?: boolean,
  ) => {
    if (selectedIds.length === 0) {
      return;
    }
    try {
      const response = await mailApi.bulkAction({
        action,
        mailIds: selectedIds,
        important,
      });
      const result = response.data.data;
      showToast({
        title: `${result?.processed ?? 0}건 처리했습니다.${
          result && result.failed > 0 ? ` (${result.failed}건 실패)` : ''
        }`,
        variant: 'success',
      });
      setSelectedIds([]);
      await loadList();
      await loadDetail();
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'MAIL_003') {
        setScopeRequired(true);
      }
      showToast({
        title: '일괄 처리 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    }
  };

  const handleSendMail = async (
    request: MailSendRequest,
    attachments: File[],
  ) => {
    setSending(true);

    try {
      await mailApi.sendMail(request, attachments);
      const draftId = composePrefill?.draftMailId;
      if (draftId) {
        try {
          await mailApi.deleteDraft(draftId);
        } catch {
          // 드래프트 삭제 실패는 발송 성공에 영향을 주지 않음
        }
      }
      setComposeOpen(false);
      setComposePrefill(null);
      showToast({ title: '메일을 발송했습니다.', variant: 'success' });
      navigate('/mail/sent');
      await loadList();
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'MAIL_003') {
        setScopeRequired(true);
      }
      showToast({
        title: '메일 발송 실패',
        description: getMailErrorMessage(error),
        variant: 'danger',
      });
    } finally {
      setSending(false);
    }
  };

  const clearTrash = () => {
    if (!window.confirm('휴지통의 모든 메일을 삭제하시겠습니까?')) {
      return;
    }

    void mutateAndReload(
      () => mailApi.clearTrash(),
      '휴지통을 비웠습니다.',
    );
  };

  const refreshMails = () => {
    void loadList({ syncBefore: !trashView });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              {labelMode ? labelName || '라벨' : meta.title}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {labelMode
                ? '이 라벨이 적용된 메일을 모아봅니다.'
                : meta.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<RefreshCcw size={16} />}
              loading={listLoading || syncing}
              onClick={refreshMails}
            >
              {syncing ? '동기화 중' : '새로고침'}
            </Button>
            {trashView ? (
              <Button
                variant="danger"
                leftIcon={<Trash2 size={16} />}
                onClick={clearTrash}
              >
                휴지통 비우기
              </Button>
            ) : (
              <Button
                variant="primary"
                leftIcon={<MailPlus size={16} />}
                onClick={() => {
                  setComposePrefill(null);
                  setComposeOpen(true);
                }}
              >
                메일 쓰기
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <SearchInput
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="제목, 본문, 이메일 검색"
            disabled={trashView}
          />
          <Button
            type="submit"
            variant="outline"
            leftIcon={<Search size={16} />}
            disabled={trashView}
          >
            검색
          </Button>
        </form>
      </section>

      {scopeRequired ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-amber-900">
                Google 메일 권한이 필요합니다.
              </h2>
              <p className="mt-1 text-sm font-semibold text-amber-800">
                메일 조회와 발송을 계속하려면 Google 메일을 다시 연동하세요.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={<AtSign size={16} />}
              onClick={() => void connectGoogleMail()}
            >
              Google 메일 재연동
            </Button>
          </div>
        </section>
      ) : null}

      {errorMessage && !scopeRequired ? (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid min-h-0 flex-1 grid-cols-[minmax(320px,440px)_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-0 flex-col border-r border-slate-100">
          {mails.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                전체 선택
              </label>
              {selectedIds.length > 0 ? (
                <>
                  <span className="text-xs font-bold text-blue-600">
                    {selectedIds.length}개 선택
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runBulk('read')}
                    >
                      읽음
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runBulk('important', true)}
                    >
                      중요표시
                    </Button>
                    {!trashView ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void runBulk('trash')}
                      >
                        휴지통
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIds([])}
                    >
                      해제
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MailList
              mails={mails}
              loading={listLoading}
              selectedMailId={selectedMailId}
              selectedIds={selectedIds}
              draftView={draftView}
              onSelect={setSelectedMailId}
              onToggleSelect={toggleSelect}
              onToggleImportant={handleSummaryImportant}
            />
          </div>
        </div>

        <div className="min-h-0 overflow-hidden">
          <MailDetailPanel
            detail={detail}
            loading={detailLoading}
            trashView={trashView}
            draftView={draftView}
            onMarkRead={() => {
              if (detail) {
                void mutateAndReload(
                  () => mailApi.markAsRead(detail.mailId),
                  '읽음 처리했습니다.',
                );
              }
            }}
            onReply={handleReply}
            onReplyAll={handleReplyAll}
            onForward={handleForward}
            onMarkUnread={() => {
              if (detail) {
                void mutateAndReload(
                  () => mailApi.markAsUnread(detail.mailId),
                  '읽지 않음으로 표시했습니다.',
                );
              }
            }}
            onDownloadAttachment={handleDownloadAttachment}
            onToggleImportant={handleDetailImportant}
            onMoveTrash={() => {
              if (detail) {
                void mutateAndReload(
                  () => mailApi.moveToTrash(detail.mailId),
                  '메일을 휴지통으로 이동했습니다.',
                );
              }
            }}
            onRestore={() => {
              if (detail) {
                void mutateAndReload(
                  () => mailApi.restoreTrashMail(detail.mailId),
                  '메일을 복원했습니다.',
                );
              }
            }}
            onEditDraft={() => {
              if (detail) {
                void openDraftForEdit(detail.mailId);
              }
            }}
            onSendDraft={() => {
              if (detail) {
                void handleSendDraft(detail.mailId);
              }
            }}
          />
        </div>
      </section>

      {pagination && pagination.totalPages > 1 ? (
        <Pagination
          page={pagination.page + 1}
          totalPages={pagination.totalPages}
          onChange={(nextPage) => setPage(nextPage - 1)}
        />
      ) : null}

      <ComposeModal
        open={composeOpen}
        sending={sending}
        prefill={composePrefill}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleSendMail}
        onSaveDraft={handleSaveDraft}
        onDeleteDraft={handleDeleteDraft}
      />
    </div>
  );
}
