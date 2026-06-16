import {
  Archive,
  FileEdit,
  Inbox,
  Mail,
  MailPlus,
  Plus,
  Send,
  Star,
  Tag,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mailApi } from '../../../api/mailApi';
import type { MailLabelResponse } from '../../../types/mail.dto';
import Button from '../../common/button/Button';
import FormField from '../../common/form/formField/FormField';
import Modal from '../../common/overlay/modal/Modal';
import { useToast } from '../../common/toast/useToast';
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
  const { showToast } = useToast();
  const [labels, setLabels] = useState<MailLabelResponse[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [labelName, setLabelName] = useState('');
  const [labelError, setLabelError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MailLabelResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCompose = () => {
    window.dispatchEvent(new Event('mail:open-compose'));
  };

  const loadLabels = useCallback(async () => {
    try {
      const response = await mailApi.getUserLabels();
      setLabels(response.data.data ?? []);
    } catch {
      setLabels([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLabels();
    const refresh = () => void loadLabels();
    window.addEventListener('mail:labels-changed', refresh);
    return () => window.removeEventListener('mail:labels-changed', refresh);
  }, [loadLabels]);

  const openAddModal = () => {
    setLabelName('');
    setLabelError('');
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setLabelError('');
  };

  const submitAddLabel = async () => {
    const name = labelName.trim();
    if (!name) {
      setLabelError('라벨 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setLabelError('');
    try {
      await mailApi.createLabel({ name });
      setAddModalOpen(false);
      setLabelName('');
      await loadLabels();
      showToast({ title: '라벨을 추가했습니다.', variant: 'success' });
    } catch {
      setLabelError('라벨을 추가하지 못했습니다. 이미 있는 이름인지 확인하세요.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const target = deleteTarget;
    setDeleting(true);
    try {
      await mailApi.deleteLabel(target.labelId);
      setDeleteTarget(null);
      await loadLabels();
      showToast({ title: '라벨을 삭제했습니다.', variant: 'success' });
      if (location.pathname === `/mail/label/${target.labelId}`) {
        navigate('/mail/inbox');
      }
    } catch {
      showToast({ title: '라벨을 삭제하지 못했습니다.', variant: 'danger' });
    } finally {
      setDeleting(false);
    }
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

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            라벨
          </span>
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="라벨 추가"
          >
            <Plus size={15} />
          </button>
        </div>
        {labels.length === 0 ? (
          <p className="px-2 py-1 text-xs font-medium text-slate-400">
            라벨이 없습니다.
          </p>
        ) : (
          labels.map((label) => {
            const active = location.pathname === `/mail/label/${label.labelId}`;
            return (
              <div
                key={label.labelId}
                className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                  active ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/mail/label/${label.labelId}`)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-600"
                >
                  <Tag
                    size={15}
                    className={active ? 'text-blue-600' : 'text-slate-400'}
                  />
                  <span className="truncate">{label.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(label)}
                  className="rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label={`${label.name} 삭제`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={addModalOpen}
        title="새 라벨"
        description="새로 만들 라벨의 이름을 입력하세요."
        onClose={closeAddModal}
        footer={
          <>
            <Button variant="outline" onClick={closeAddModal}>
              취소
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={() => void submitAddLabel()}
            >
              추가
            </Button>
          </>
        }
      >
        <FormField
          label="라벨 이름"
          placeholder="예: 회사, 프로젝트A"
          value={labelName}
          autoFocus
          maxLength={60}
          errorText={labelError}
          onChange={(event) => setLabelName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submitAddLabel();
            }
          }}
        />
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="라벨 삭제"
        description={
          deleteTarget
            ? `'${deleteTarget.name}' 라벨을 삭제하시겠습니까? 메일에 표시된 라벨도 함께 제거됩니다.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={() => void confirmDelete()}
            >
              삭제
            </Button>
          </>
        }
      />
    </div>
  );
};

export default MailSubSidebarContent;
