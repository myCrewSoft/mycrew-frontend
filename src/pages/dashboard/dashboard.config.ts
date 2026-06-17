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
  defaultSize: Pick<DashboardLayoutItem, 'w' | 'h' | 'minW' | 'minH' | 'maxW' | 'maxH'>
}

export const DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    key: 'attendance',
    title: '근태',
    icon: Timer,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 5, maxH: 4 },
  },
  {
    key: 'approval',
    title: '전자결재',
    icon: FileText,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'todaySchedule',
    title: '오늘 일정',
    icon: CalendarDays,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'meeting',
    title: '오늘 회의',
    icon: CalendarCheck,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'reservation',
    title: '회의실 예약',
    icon: ClipboardCheck,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'task',
    title: '업무',
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
    key: 'board',
    title: '게시판',
    icon: Megaphone,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'mail',
    title: '메일',
    icon: Mail,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'messenger',
    title: '메신저',
    icon: MessageSquare,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
  {
    key: 'notification',
    title: '알림',
    icon: Bell,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  },
]

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { i: 'attendance', x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2, maxW: 5, maxH: 4 },
  { i: 'approval', x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'todaySchedule', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'meeting', x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'reservation', x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'task', x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'projectProgress', x: 0, y: 6, w: 5, h: 3, minW: 4, minH: 2, maxW: 8, maxH: 5 },
  { i: 'board', x: 5, y: 6, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'messenger', x: 9, y: 6, w: 3, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'notification', x: 0, y: 9, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
  { i: 'mail', x: 4, y: 9, w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 5 },
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
