import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Mail,
  Megaphone,
  MessageSquare,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardLayoutItem, DashboardWidgetKey } from '../../types/dashboard'

export interface DashboardWidgetConfig {
  key: DashboardWidgetKey
  title: string
  icon: LucideIcon
  defaultSize: Required<
    Pick<DashboardLayoutItem, 'w' | 'h' | 'minW' | 'minH' | 'maxW' | 'maxH'>
  >
}

export const DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    key: 'attendance',
    title: '근태',
    icon: Timer,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 3, maxW: 5, maxH: 4 },
  },
  {
    key: 'approval',
    title: '전자결재',
    icon: FileText,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'todaySchedule',
    title: '오늘 일정',
    icon: CalendarDays,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'meeting',
    title: '오늘 회의',
    icon: CalendarCheck,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'reservation',
    title: '회의실 예약',
    icon: ClipboardCheck,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'task',
    title: '업무',
    icon: FileText,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'projectProgress',
    title: '프로젝트 진행',
    icon: BriefcaseBusiness,
    defaultSize: { w: 5, h: 3, minW: 4, minH: 2, maxW: 8, maxH: 5 },
  },
  {
    key: 'board',
    title: '게시판',
    icon: Megaphone,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'mail',
    title: '메일',
    icon: Mail,
    defaultSize: { w: 4, h: 5, minW: 3, minH: 5, maxW: 6, maxH: 6 },
  },
  {
    key: 'messenger',
    title: '메신저',
    icon: MessageSquare,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
  {
    key: 'notification',
    title: '알림',
    icon: Bell,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  },
]

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { i: 'attendance', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 3, maxW: 5, maxH: 4 },
  { i: 'approval', x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'todaySchedule', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'meeting', x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'reservation', x: 4, y: 4, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'task', x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'projectProgress', x: 0, y: 8, w: 5, h: 3, minW: 4, minH: 2, maxW: 8, maxH: 5 },
  { i: 'board', x: 5, y: 8, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'messenger', x: 9, y: 8, w: 3, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'notification', x: 0, y: 12, w: 4, h: 4, minW: 3, minH: 4, maxW: 6, maxH: 6 },
  { i: 'mail', x: 4, y: 12, w: 4, h: 5, minW: 3, minH: 5, maxW: 6, maxH: 6 },
]

// 관리자 메인 대시보드 기본 레이아웃
// (프로젝트별 진척률, 근태현황, 주요 일정, 공지사항)
export const ADMIN_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { i: 'projectProgress', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 2, maxW: 8, maxH: 5 },
  { i: 'attendance', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 2, maxW: 4, maxH: 4 },
  { i: 'todaySchedule', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'board', x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 2, maxW: 6, maxH: 5 },
]

export const DASHBOARD_WIDGET_CONFIG_MAP = DASHBOARD_WIDGETS.reduce(
  (acc, widget) => {
    acc[widget.key] = widget
    return acc
  },
  {} as Record<DashboardWidgetKey, DashboardWidgetConfig>,
)
