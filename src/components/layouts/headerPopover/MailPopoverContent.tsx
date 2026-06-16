import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mailApi } from '../../../api/mailApi';
import type { MailSummaryResponse } from '../../../types/mail.dto';

interface MailPopoverContentProps {
  refreshSignal: number;
  onSelect?: () => void;
}

const formatTimeText = (sentAt: string | null) => {
  if (!sentAt) {
    return '';
  }
  const sentTime = new Date(sentAt).getTime();
  if (Number.isNaN(sentTime)) {
    return '';
  }
  const diffMinutes = Math.floor((Date.now() - sentTime) / 1000 / 60);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`;
  return `${Math.floor(diffMinutes / 1440)}일 전`;
};

const MailPopoverContent = ({ refreshSignal, onSelect }: MailPopoverContentProps) => {
  const navigate = useNavigate();
  const [mails, setMails] = useState<MailSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    mailApi
      .getMails({ type: 'inbox', page: 0, size: 5 })
      .then((res) => {
        if (active) setMails(res.data.data ?? []);
      })
      .catch(() => {
        if (active) setMails([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshSignal]);

  const openMail = (mailId: number) => {
    onSelect?.();
    navigate(`/mail/inbox?mailId=${mailId}`);
  };

  const goInbox = () => {
    onSelect?.();
    navigate('/mail/inbox');
  };

  return (
    <div className="flex flex-col">
      {loading ? (
        <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
          불러오는 중입니다.
        </p>
      ) : mails.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
          받은 메일이 없습니다.
        </p>
      ) : (
        mails.map((mail) => (
          <button
            key={mail.mailId}
            type="button"
            onClick={() => openMail(mail.mailId)}
            className="flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <span
              className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                mail.unread ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`truncate text-sm ${
                    mail.unread
                      ? 'font-black text-slate-900'
                      : 'font-bold text-slate-600'
                  }`}
                >
                  {mail.fromEmail ?? '발신자 정보 없음'}
                </p>
                <span className="flex-shrink-0 text-xs font-semibold text-slate-400">
                  {formatTimeText(mail.sentAt)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
                {mail.subject || '(제목 없음)'}
              </p>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                {mail.snippet ?? ''}
              </p>
            </div>
          </button>
        ))
      )}
      <button
        type="button"
        onClick={goInbox}
        className="border-t border-slate-100 px-4 py-2.5 text-center text-xs font-bold text-blue-600 transition-colors hover:bg-slate-50"
      >
        받은 메일함 전체 보기
      </button>
    </div>
  );
};

export default MailPopoverContent;
