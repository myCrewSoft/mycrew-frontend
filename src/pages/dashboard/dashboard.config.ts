import {
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  FolderClock,
  Megaphone,
  MessageSquare,
  MousePointer2,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardLayoutItem, DashboardWidgetKey } from '../../types/dashboard'

export interface DashboardWidgetConfig {
  key: DashboardWidgetKey
  title: string
  icon: LucideIcon
  defaultSize: Pick<DashboardLayoutItem, 'w' | 'h' | 'minW' | 'minH' | 'maxW' | 'maxH'>
}

export const DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    key: 'todaySchedule',
    title: '오늘 일정',
    icon: CalendarDays,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'notice',
    title: '공지사항',
    icon: Megaphone,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'unreadNotification',
    title: '안 읽은 알림',
    icon: Bell,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 5, maxH: 4 },
  },
  {
    key: 'messenger',
    title: '메신저',
    icon: MessageSquare,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'meetingSchedule',
    title: '회의 일정',
    icon: CalendarCheck,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'reservationStatus',
    title: '예약 현황',
    icon: ClipboardCheck,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'quickLinks',
    title: '빠른 실행',
    icon: MousePointer2,
    defaultSize: { w: 3, h: 3, minW: 3, minH: 2, maxW: 4, maxH: 4 },
  },
  {
    key: 'attendance',
    title: '내 근태 상태',
    icon: Timer,
    defaultSize: { w: 3, h: 3, minW: 3, minH: 2, maxW: 4, maxH: 4 },
  },
  {
    key: 'departmentBoard',
    title: '부서 게시글',
    icon: Users,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'approval',
    title: '내 결재함',
    icon: FileText,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'projectProgress',
    title: '프로젝트 진행',
    icon: BriefcaseBusiness,
    defaultSize: { w: 5, h: 3, minW: 4, minH: 2, maxW: 8, maxH: 5 },
  },
  {
    key: 'recentDrive',
    title: '최근 문서함',
    icon: FolderClock,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'aiSummary',
    title: 'AI 요약',
    icon: Bot,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
]

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { i: 'todaySchedule', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'notice', x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'unreadNotification', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2, maxW: 5, maxH: 4 },
  { i: 'messenger', x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'meetingSchedule', x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'reservationStatus', x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'quickLinks', x: 0, y: 6, w: 3, h: 3, minW: 3, minH: 2, maxW: 4, maxH: 4 },
  { i: 'attendance', x: 3, y: 6, w: 3, h: 3, minW: 3, minH: 2, maxW: 4, maxH: 4 },
]

export const DASHBOARD_WIDGET_CONFIG_MAP = DASHBOARD_WIDGETS.reduce(
  (acc, widget) => {
    acc[widget.key] = widget
    return acc
  },
  {} as Record<DashboardWidgetKey, DashboardWidgetConfig>,
)
