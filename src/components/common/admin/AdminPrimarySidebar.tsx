import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { adminNavItems } from './adminLayoutConfig';
import {
  getPrimaryNavLinkClass,
  primarySidebarClass,
} from './adminLayoutStyles';

interface AdminPrimarySidebarProps {
  pathname: string;
}

export default function AdminPrimarySidebar({
  pathname,
}: AdminPrimarySidebarProps) {
  return (
    <aside className={primarySidebarClass}>
      <div className="flex w-full flex-col items-center">
        <Link
          to="/admin/dashboard"
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#5ac8fa] text-3xl font-black text-white no-underline shadow-md transition-transform hover:scale-105"
        >
          A
        </Link>

        <nav className="flex w-full flex-col gap-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={getPrimaryNavLinkClass(active)}
              >
                <Icon size={22} />
                <span className="text-[11px] font-bold leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        to="/admin/settings"
        className={getPrimaryNavLinkClass(pathname.startsWith('/admin/settings'))}
      >
        <Settings size={22} />
        <span className="text-[11px] font-bold leading-none tracking-tight">
          설정
        </span>
      </Link>
    </aside>
  );
}
