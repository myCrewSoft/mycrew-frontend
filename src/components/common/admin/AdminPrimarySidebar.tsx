import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { adminNavItems } from './adminLayoutConfig';
import {
  adminLogoLinkClass,
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
          className={adminLogoLinkClass}
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
