import { Archive, FileEdit, Inbox, Mail, MailPlus, Send, Star, Trash2, UserCheck, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SubSidebarActionButton from './SubSidebarActionButton';
import SubSidebarMenuItem from './SubSidebarMenuItem';
import SubSidebarSection from './SubSidebarSection';

const mailboxes = [
  { icon: Inbox, label: '받은 메일함', path: '/mail/inbox' },
  { icon: Send, label: '보낸 메일함', path: '/mail/sent' },
  { icon: Star, label: '중요 메일함', path: '/mail/important' },
  { icon: Mail, label: '안읽은 메일', path: '/mail/unread' },
  { icon: FileEdit, label: '임시보관함', path: '/mail/draft' },
  { icon: Archive, label: '전체 메일', path: '/mail/all' },
  { icon: UserCheck, label: '내게 쓴 메일', path: '/mail/self' },
  { icon: Users, label: '나에게 온 메일', path: '/mail/tome' },
  { icon: Trash2, label: '휴지통', path: '/mail/trash' },
];

const MailSubSidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const openCompose = () => {
    window.dispatchEvent(new Event('mail:open-compose'));
  };

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">메일</h2>
      </div>

      <div className="flex flex-col gap-2.5">
        <SubSidebarActionButton variant="primary" onClick={openCompose}>
          <span className="inline-flex items-center gap-2">
            <MailPlus size={16} />
            메일 쓰기
          </span>
        </SubSidebarActionButton>
        <SubSidebarActionButton onClick={() => navigate('/mail/all')}>
          <span className="inline-flex items-center gap-2">
            <Star size={16} />
            전체 메일 보기
          </span>
        </SubSidebarActionButton>
      </div>

      <SubSidebarSection title="메일함">
        {mailboxes.map((item) => (
          <SubSidebarMenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`) ||
              (item.path === '/mail/inbox' && location.pathname === '/mail')
            }
          />
        ))}
      </SubSidebarSection>
    </div>
  );
};

export default MailSubSidebarContent;
