import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import Button from '../button/Button';
import Badge from '../dataDisplay/badge/Badge';
import type { AdminAccessResponse } from '../../../types/admin';

interface AdminHeaderProps {
  access: AdminAccessResponse;
  onLogout: () => void;
}

export default function AdminHeader({ access, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="min-w-0">
        <h1 className="text-lg font-bold tracking-tight text-slate-950">
          관리자 콘솔
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          접속 사번 {access.empId}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/components"
          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 no-underline transition hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          사용자 화면
        </Link>
        <Badge variant="success">ADMIN_CONSOLE_ACCESS</Badge>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<LogOut size={16} />}
          onClick={onLogout}
        >
          로그아웃
        </Button>
      </div>
    </header>
  );
}
