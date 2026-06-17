import type { ComponentType } from 'react';
import {
  Building2,
  CalendarClock,
  CalendarDays,  
  ClipboardList,
  DoorOpen,
  FileText,
  FolderKanban,
  IdCard,
  Network,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { adminEmployeeStatusOptions } from '../../../types/adminEmployee';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface EmployeeFilterItem {
  label: string;
  empStatCd?: string;
}

export const adminNavItems: AdminNavItem[] = [
  { label: '사원', path: '/admin/users', icon: Users },
  { label: '권한', path: '/admin/roles', icon: ShieldCheck },
  { label: '직급', path: '/admin/ranks', icon: IdCard },
  { label: '부서', path: '/admin/departments', icon: Building2 },
  { label: '게시판', path: '/admin/boards', icon: ClipboardList },
  { label: '프로젝트', path: '/admin/projects', icon: FolderKanban },
  { label: '양식', path: '/admin/templates', icon: FileText },
  { label: '조직도', path: '/admin/org', icon: Network },
  { label: '근태', path: '/admin/attendance', icon: CalendarClock },
  { label: '일정', path: '/admin/schedules', icon: CalendarDays },
  { label: '회의', path: '/admin/meeting', icon: Users },
  { label: '회의실예약', path: '/admin/reservations', icon: DoorOpen },
];

export const employeeFilterItems: EmployeeFilterItem[] = [
  { label: '전체 사원' },
  ...adminEmployeeStatusOptions.map((status) => ({
    label: status.label,
    empStatCd: status.code,
  })),
];
