import type { DashboardWidgetResponseMap } from '../../types/dashboard'

export const dashboardMockData: DashboardWidgetResponseMap = {
  todaySchedule: {
    schedules: [
      { id: 1, title: '주간 업무 공유', startAt: '09:30', endAt: '10:00', location: '회의실 A' },
      { id: 2, title: '프로젝트 킥오프', startAt: '14:00', endAt: '15:30', location: '온라인' },
    ],
  },
  meetingSchedule: {
    meetings: [
      { id: 1, title: '디자인 리뷰', startAt: '11:00', endAt: '12:00', location: '회의실 B' },
      { id: 2, title: '개발 일정 점검', startAt: '16:00', endAt: '16:30', location: '회의실 C' },
    ],
  },
  reservationStatus: {
    reservations: [
      { id: 1, resourceName: '회의실 A', startAt: '09:30', endAt: '10:00', status: 'confirmed' },
      { id: 2, resourceName: '법인 차량 2호', startAt: '18:00', endAt: '20:00', status: 'waiting' },
    ],
  },
  notice: {
    notices: [
      { id: 1, title: '6월 전사 타운홀 안내', writerName: '관리자', createdAt: '오늘', isNew: true },
      { id: 2, title: '보안 점검 일정 공지', writerName: '정보보안팀', createdAt: '어제' },
    ],
  },
  departmentBoard: {
    posts: [
      { id: 1, title: '프론트엔드 코드 리뷰 규칙', writerName: '개발팀', createdAt: '오늘', isNew: true },
      { id: 2, title: '스프린트 회고 자료 공유', writerName: '기획팀', createdAt: '어제' },
    ],
  },
  unreadNotification: {
    count: 5,
    notifications: [
      { id: 1, title: '회의 시작 10분 전', content: '주간 업무 공유', createdAt: '방금', type: 'schedule' },
      { id: 2, title: '새 공지사항', content: '6월 전사 타운홀 안내', createdAt: '15분 전', type: 'board' },
    ],
  },
  messenger: {
    unreadCount: 3,
    rooms: [
      { roomId: 1, roomName: '개발팀', lastMessage: '배포 일정 확인했습니다.', lastMessageAt: '10:12', unreadCount: 2 },
      { roomId: 2, roomName: '프로젝트 TF', lastMessage: '회의록 올려둘게요.', lastMessageAt: '09:45', unreadCount: 1 },
    ],
  },
  attendance: {
    status: 'working',
    checkInAt: '08:57',
    workDurationMinutes: 214,
  },
  quickLinks: {
    links: [
      { id: 'schedule', label: '일정 등록', path: '/calendar', icon: 'calendar' },
      { id: 'reservation', label: '회의실 예약', path: '/reservations', icon: 'reservation' },
      { id: 'board', label: '게시글 작성', path: '/boards', icon: 'board' },
      { id: 'drive', label: '문서함', path: '/drive', icon: 'drive' },
    ],
  },
  approval: {
    pendingCount: 4,
    documents: [
      { id: 1, title: '구매 품의서', requesterName: '김민수', requestedAt: '오늘' },
      { id: 2, title: '휴가 신청서', requesterName: '이지은', requestedAt: '어제' },
    ],
  },
  projectProgress: {
    projects: [
      { id: 1, name: '그룹웨어 고도화', progressRate: 72, dueDate: '2026-06-14' },
      { id: 2, name: '대시보드 개편', progressRate: 38, dueDate: '2026-06-21' },
    ],
  },
  recentDrive: {
    files: [
      { id: 1, fileName: '대시보드 설계안.pdf', updatedAt: '오늘', ownerName: '나' },
      { id: 2, fileName: '회의록_0602.docx', updatedAt: '어제', ownerName: '개발팀' },
    ],
  },
  aiSummary: {
    summary: '오늘은 회의 2건, 새 공지 1건, 미확인 알림 5건이 있습니다.',
    keywords: ['회의', '공지', '알림'],
  },
}
