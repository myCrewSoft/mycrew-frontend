import {
  ArchiveRestore,
  AtSign,
  FileText,
  MailPlus,
  Paperclip,
  RefreshCcw,
  Search,
  Send,
  Star,
  Trash2,
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
import { useNavigate, useParams } from 'react-router-dom';
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

const getMailErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.errorCode === 'MAIL_003') {
      return 'Google 메일 권한이 부족합니다. 메일을 다시 연동해 주세요.';
    }

    return error.message;
  }

  return '메일 요청 처리 중 오류가 발생했습니다.';
};

interface ComposeModalProps {
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSubmit: (request: MailSendRequest, attachments: File[]) => Promise<void>;
}

function ComposeModal({ open, sending, onClose, onSubmit }: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState('');

  const reset = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setContent('');
    setAttachments([]);
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
      },
      attachments,
    );
    reset();
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
          <Button variant="outline" onClick={handleClose}>
            취소
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
  onSelect: (mailId: number) => void;
  onToggleImportant: (mail: MailSummaryResponse) => void;
}

function MailList({
  mails,
  loading,
  selectedMailId,
  onSelect,
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

        return (
          <button
            key={mail.mailId}
            type="button"
            onClick={() => onSelect(mail.mailId)}
            className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${
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
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface MailDetailPanelProps {
  detail: MailDetailResponse | null;
  loading: boolean;
  trashView: boolean;
  onMarkRead: () => void;
  onToggleImportant: () => void;
  onMoveTrash: () => void;
  onRestore: () => void;
}

function MailDetailPanel({
  detail,
  loading,
  trashView,
  onMarkRead,
  onToggleImportant,
  onMoveTrash,
  onRestore,
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
            {detail.unread ? (
              <Button variant="outline" size="sm" onClick={onMarkRead}>
                읽음 처리
              </Button>
            ) : null}
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {detail.content ? (
          <article
            className="prose prose-slate max-w-none text-sm leading-7"
            dangerouslySetInnerHTML={{ __html: detail.content }}
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
                <div
                  key={attachment.attachmentId}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                    <FileText size={16} className="text-blue-500" />
                    <span className="truncate">
                      {attachment.originalFileName}
                    </span>
                  </span>
                  <span className="ml-3 flex-shrink-0 text-xs font-bold text-slate-400">
                    {formatFileSize(attachment.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function MailPage() {
  const { mailbox } = useParams<{ mailbox?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentMailbox = (
    mailbox && mailbox in mailboxMeta ? mailbox : 'inbox'
  ) as MailRouteBox;
  const meta = mailboxMeta[currentMailbox];
  const trashView = currentMailbox === 'trash';
  const inboxView = currentMailbox === 'inbox';

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

    try {
      if (options?.syncBefore) {
        await syncMails();
      }

      const response = trashView
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
  }, [keyword, meta.apiType, page, syncMails, trashView]);

  const loadDetail = useCallback(async () => {
    if (!selectedMailId) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);

    try {
      const response = await mailApi.getMailDetail(selectedMailId);
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
  }, [selectedMailId, showToast]);

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
    const openCompose = () => setComposeOpen(true);
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
      const response = await authApi.getGoogleAuthorizeUrl();
      const authorizationUrl = response.data.data?.authorizationUrl;
      window.location.href = authorizationUrl || '/mail/oauth/google/authorize';
    } catch {
      window.location.href = '/mail/oauth/google/authorize';
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

  const handleSendMail = async (
    request: MailSendRequest,
    attachments: File[],
  ) => {
    setSending(true);

    try {
      await mailApi.sendMail(request, attachments);
      setComposeOpen(false);
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
              {meta.title}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {meta.description}
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
                onClick={() => setComposeOpen(true)}
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
        <div className="min-h-0 overflow-y-auto border-r border-slate-100">
          <MailList
            mails={mails}
            loading={listLoading}
            selectedMailId={selectedMailId}
            onSelect={setSelectedMailId}
            onToggleImportant={handleSummaryImportant}
          />
        </div>

        <div className="min-h-0 overflow-hidden">
          <MailDetailPanel
            detail={detail}
            loading={detailLoading}
            trashView={trashView}
            onMarkRead={() => {
              if (detail) {
                void mutateAndReload(
                  () => mailApi.markAsRead(detail.mailId),
                  '읽음 처리했습니다.',
                );
              }
            }}
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
        onClose={() => setComposeOpen(false)}
        onSubmit={handleSendMail}
      />
    </div>
  );
}
