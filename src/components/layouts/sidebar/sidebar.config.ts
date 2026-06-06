import {
  Archive,
  Calendar,
  CalendarPlus,
  Check,
  ClipboardList,
  Clock,
  Cloud,
  FileText,
  Folder,
  GraduationCap,
  Inbox,
  Kanban,
  List,
  ListChecks,
  Mail,
  Network,
  PenLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'

export interface MenuItem {
  icon?: LucideIcon
  label: string
  path: string
  children?: MenuItem[]
}

export interface SubSidebarAction {
  label: string
  variant?: 'primary' | 'soft'
}

export interface SubSidebarSectionConfig {
  title: string
  items: MenuItem[]
}

export interface SubSidebarConfig {
  title: string
  actions: SubSidebarAction[]
  sections: SubSidebarSectionConfig[]
}

export const menuItems: MenuItem[] = [
  { icon: Mail, label: '메일', path: '/mail' },
  { icon: FileText, label: '전자결재', path: '/approval' },
  { icon: Cloud, label: '드라이브', path: '/drive' },
  { icon: Kanban, label: '프로젝트', path: '/project' },
  { icon: Video, label: '회의', path: '/meeting' },
  { icon: Clock, label: '근태', path: '/attendance' },
  { icon: Calendar, label: '일정', path: '/calendar' },
  { icon: CalendarPlus, label: '예약', path: '/reservations' },
  { icon: GraduationCap, label: '교육', path: '/education' },
  { icon: Network, label: '조직관리', path: '/organization' },
  { icon: ClipboardList, label: '게시판', path: '/boards' },
]

export const adminMenuItem: MenuItem = {
  icon: ShieldCheck,
  label: '관리자',
  path: '/admin',
}

export const subSidebarConfigs: Record<string, SubSidebarConfig> = {
  mail: {
    title: '메일',
    actions: [
      { label: '메일 쓰기', variant: 'primary' },
      { label: '전체 메일 보기' },
    ],
    sections: [
      {
        title: '메일함',
        items: [
          { icon: Inbox, label: '받은 메일함', path: '/mail/inbox' },
          { icon: Send, label: '보낸 메일함', path: '/mail/sent' },
          { icon: Archive, label: '전체 메일', path: '/mail/all' },
        ],
      },
    ],
  },
  approval: {
    title: '전자결재',
    actions: [{ label: '기안서 작성', variant: 'primary' }],
    sections: [
      {
        title: '결재 상신함',
        items: [
          { icon: PenLine, label: '진행 중 기안서 목록', path: '/approval/sent/progress' },
          { icon: Check, label: '완료된 기안서 목록', path: '/approval/sent/completed' },
          { icon: Archive, label: '반려된 기안서 목록', path: '/approval/sent/rejected' },
        ],
      },
      {
        title: '결재 수신함',
        items: [
          { icon: Inbox, label: '결재 요청 목록', path: '/approval/received/requests' },
          { icon: ListChecks, label: '결재 내역', path: '/approval/received/history' },
          { icon: Check, label: '완료된 기안서 목록', path: '/approval/received/completed' },
        ],
      },
    ],
  },
  drive: {
    title: '드라이브',
    actions: [
      { label: '파일 업로드', variant: 'primary' },
      { label: '폴더 생성' },
    ],
    sections: [
      {
        title: '저장 공간',
        items: [
          { icon: Folder, label: '내 드라이브', path: '/drive/my' },
          { icon: Users, label: '공유 드라이브', path: '/drive/shared' },
          { icon: Archive, label: '휴지통', path: '/drive/trash' },
        ],
      },
    ],
  },
  project: {
    title: '업무 관리',
    actions: [
      { label: '업무 추가', variant: 'primary' },
      { label: '프로젝트 생성' },
    ],
    sections: [
      {
        title: '프로젝트',
        items: [
          { icon: List, label: '프로젝트 목록', path: '/project/list' },
          { icon: ClipboardList, label: '업무', path: '/project/tasks' },
          { icon: ListChecks, label: '해야 할 일', path: '/project/todo' },
          { icon: Clock, label: '진행 중', path: '/project/progress' },
          { icon: Search, label: '검토 중', path: '/project/review' },
          { icon: Check, label: '완료', path: '/project/done' },
          { icon: Sparkles, label: '프로젝트 AI', path: '/project/ai' },
        ],
      },
    ],
  },
  attendance: {
    title: '근태',
    actions: [
      { label: '출근 처리', variant: 'primary' },
      { label: '휴가 신청' },
    ],
    sections: [
      {
        title: '근태 관리',
        items: [
          { icon: Clock, label: '근태 현황', path: '/attendance/status' },
          { icon: Calendar, label: '근무 일정', path: '/attendance/schedule' },
          { icon: FileText, label: '휴가 내역', path: '/attendance/vacations' },
        ],
      },
    ],
  },
  // 전용 컴포넌트로 대체
  calendar: {
    title: '일정',
    actions: [],
    sections: [],
  },
  // 전용 컴포넌트로 대체
  reservations: {
    title: '예약',
    actions: [],
    sections: [],
  },
  education: {
    title: '교육',
    actions: [
      { label: '교육 신청', variant: 'primary' },
      { label: '강의 개설' },
    ],
    sections: [
      {
        title: '교육 관리',
        items: [
          { icon: GraduationCap, label: '교육 목록', path: '/education/list' },
          { icon: Check, label: '수강 중', path: '/education/learning' },
          { icon: FileText, label: '수료 내역', path: '/education/completed' },
        ],
      },
    ],
  },
  organization: {
    title: '조직관리',
    actions: [
      { label: '직원 추가', variant: 'primary' },
      { label: '부서 생성' },
    ],
    sections: [
      {
        title: '조직',
        items: [
          { icon: Network, label: '조직도', path: '/organization/chart' },
          { icon: Users, label: '직원 목록', path: '/organization/members' },
          { icon: Settings, label: '권한 관리', path: '/organization/roles' },
        ],
      },
    ],
  },
  board: {
    title: '게시판',
    actions: [
          { label: '글쓰기', variant: 'primary' },
    ],
    sections: [
      {
    title: '',
        items: [
         { icon: Sparkles, label: '공지사항', path: '/boards/notices' },
         { icon: Users, label: '부서게시판', path: '/boards/departments',
            children: [],

          },
         { icon: ClipboardList, label: '자유게시판', path: '/boards/free' },
         { icon: Archive, label: '익명게시판', path: '/boards/anonymous' },
        ],
      },
    ],
  },
  admin: {
    title: '관리자',
    actions: [
      { label: '사용자 초대', variant: 'primary' },
      { label: '설정 변경' },
    ],
    sections: [
      {
        title: '관리',
        items: [
          { icon: Users, label: '사용자 관리', path: '/admin/users' },
          { icon: ShieldCheck, label: '권한 관리', path: '/admin/roles' },
          { icon: Settings, label: '시스템 설정', path: '/admin/settings' },
        ],
      },
    ],
  },
}

export const getSidebarKey = (pathname: string): string => {
  // 만약 /boards 혹은 /boards/FREE 등으로 들어온다면 'board'를 반환하도록 예외 처리 추가
  if (pathname.startsWith('/boards') || pathname.startsWith('/board')) {
    return 'board';
  }
  
  // 기존 로직...
  const [, firstSegment] = pathname.split('/');
  return firstSegment || '';
}
