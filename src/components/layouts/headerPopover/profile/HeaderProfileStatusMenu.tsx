import { Check, ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../../../api/authApi';
import Button from '../../../common/button/Button';
import { useMyProfile, getProfileInitial, getProfileMeta } from '../../../../hooks/useMyProfile';
import { useAuth } from '../../../../store/AuthContext';

type ProfileStatus = 'online' | 'away' | 'busy' | 'offline';

interface StatusOption {
  value: ProfileStatus;
  label: string;
  dotClassName: string;
}

const statusOptions: StatusOption[] = [
  { value: 'online', label: '온라인', dotClassName: 'bg-emerald-500' },
  { value: 'away', label: '자리 비움', dotClassName: 'bg-amber-500' },
  { value: 'busy', label: '다른 업무 중', dotClassName: 'bg-red-500' },
  { value: 'offline', label: '오프라인', dotClassName: 'bg-slate-300' },
];

const formatCode = (value: string | null | undefined, fallback = '-') =>
  value && value.trim() ? value : fallback;

const HeaderProfileStatusMenu = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuth();
  const { profile } = useMyProfile();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ProfileStatus>('online');
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedStatus =
    statusOptions.find((option) => option.value === status) ?? statusOptions[0];
  const profileMeta = getProfileMeta(profile);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      setOpen(false);
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        className="flex items-center gap-3 rounded-xl p-1 transition-all hover:bg-slate-50"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700">
          <span>{profile ? getProfileInitial(profile) : <UserRound size={18} />}</span>
          <span
            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-white shadow-sm ${selectedStatus.dotClassName}`}
          />
        </div>

        <div className="hidden min-w-0 text-left md:block">
          <p className="max-w-36 truncate text-sm font-bold leading-tight text-slate-800">
            {formatCode(profile?.empNm, '사용자')}
          </p>
          <p className="max-w-44 truncate text-[11px] text-slate-400">
            {profileMeta}
          </p>
        </div>

        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <section
          className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          aria-label="프로필 메뉴"
        >
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-sm font-bold text-slate-900">
              {formatCode(profile?.empNm, '사용자')}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {profileMeta}
            </p>
          </div>

          <p className="px-1 pb-2 text-[11px] font-semibold text-slate-500">
            상태 변경
          </p>

          <div className="flex flex-col gap-1">
            {statusOptions.map((option) => {
              const selected = option.value === status;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatus(option.value);
                    setOpen(false);
                  }}
                  className="flex h-8 items-center justify-between rounded-lg px-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  role="menuitem"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${option.dotClassName}`}
                    />
                    {option.label}
                  </span>

                  {selected && <Check size={16} className="text-green-600" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Link
              to="/mypage"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 no-underline shadow-sm transition hover:bg-slate-50"
            >
              마이페이지
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={15} />}
              onClick={() => void handleLogout()}
            >
              로그아웃
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default HeaderProfileStatusMenu;
