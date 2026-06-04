import { Link } from 'react-router-dom';
import { BriefcaseBusiness } from 'lucide-react';
import { adminNavItems } from './adminLayoutConfig';
import {
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

interface AdminGenericSubSidebarProps {
  pathname: string;
}

export default function AdminGenericSubSidebar({
  pathname,
}: AdminGenericSubSidebarProps) {
  return (
    <>
      <h2 className={subSidebarTitleClass}>관리자</h2>

      <Link
        to="/admin/users"
        className="mt-5 flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-black text-white no-underline shadow-lg shadow-blue-200 transition hover:bg-blue-700"
      >
        <BriefcaseBusiness size={16} />
        사원 관리로 이동
      </Link>

      <div className="mt-9 flex flex-col gap-3">
        <p className={subSidebarSectionLabelClass}>관리자 메뉴</p>
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-black no-underline transition ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-800 hover:bg-white'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
