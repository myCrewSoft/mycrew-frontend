import { useSearchParams } from 'react-router-dom';
import { BarChart3, CalendarCheck, SlidersHorizontal } from 'lucide-react';
import AdminSelectionMark from './AdminSelectionMark';
import {
  getSubNavButtonClass,
  subSidebarListClass,
  subSidebarSectionClass,
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

const MENU = [
  { view: 'policy', label: '근무 정책', icon: SlidersHorizontal },
  { view: 'stats', label: '사원 근태 현황', icon: BarChart3 },
  { view: 'leave', label: '연차 관리', icon: CalendarCheck },
] as const;

export default function AdminAttendanceSubSidebar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = searchParams.get('view') ?? 'policy';

  const select = (view: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', view);
    setSearchParams(next);
  };

  return (
    <>
      <h2 className={subSidebarTitleClass}>근태 관리</h2>

      <div className={subSidebarSectionClass}>
        <p className={subSidebarSectionLabelClass}>관리 메뉴</p>

        <div className={subSidebarListClass}>
          {MENU.map((item) => {
            const active = current === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => select(item.view)}
                className={getSubNavButtonClass(active)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AdminSelectionMark active={active} />
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
