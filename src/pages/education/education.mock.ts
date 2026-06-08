export type EducationFormat = 'video' | 'document'

export type EducationStatus = 'inProgress' | 'learning' | 'completed'

export interface EducationCourse {
  id: string
  status: EducationStatus
  educatorName: string
  title: string
  content: string
  format: EducationFormat
  progress?: number
  documentType?: string
  duration: string
  updatedAt: string
  dueDate?: string
}

export const educationStatusLabels: Record<EducationStatus, string> = {
  inProgress: '진행 중인 교육 목록',
  learning: '수강 중인 교육 목록',
  completed: '완료된 교육 목록',
}

export const educationCourses: EducationCourse[] = [
  {
    id: 'onboarding-security',
    status: 'inProgress',
    educatorName: '김하늘',
    title: '신규 입사자 정보보안 필수 교육',
    content:
      '사내 계정, 비밀번호, 메일 보안, 자료 반출 기준을 이해하고 실무에서 지켜야 할 보안 수칙을 학습합니다.',
    format: 'video',
    progress: 64,
    duration: '42분',
    updatedAt: '2026.06.05',
    dueDate: '2026.06.14',
  },
  {
    id: 'project-collaboration',
    status: 'inProgress',
    educatorName: '박민준',
    title: '프로젝트 협업 프로세스',
    content:
      '업무 요청 등록, 담당자 배정, 진행 상태 공유, 회고 문서 작성까지 프로젝트 협업 흐름을 익힙니다.',
    format: 'document',
    documentType: 'PDF 문서',
    duration: '18쪽',
    updatedAt: '2026.06.04',
    dueDate: '2026.06.20',
  },
  {
    id: 'leadership-basic',
    status: 'learning',
    educatorName: '이서연',
    title: '팀 리더십 기본 과정',
    content:
      '목표 설정, 1:1 피드백, 업무 우선순위 조정 등 팀 리더에게 필요한 기본 운영 역량을 다룹니다.',
    format: 'video',
    progress: 31,
    duration: '1시간 12분',
    updatedAt: '2026.06.02',
    dueDate: '2026.06.30',
  },
  {
    id: 'approval-manual',
    status: 'learning',
    educatorName: '최유진',
    title: '전자결재 사용 매뉴얼',
    content:
      '기안 작성, 결재선 지정, 반려 문서 재상신, 첨부 파일 관리 방법을 문서 예제로 확인합니다.',
    format: 'document',
    documentType: '업무 매뉴얼',
    duration: '24쪽',
    updatedAt: '2026.05.29',
  },
  {
    id: 'privacy-compliance',
    status: 'completed',
    educatorName: '정도윤',
    title: '개인정보 보호 정기 교육',
    content:
      '개인정보 수집, 보관, 파기 단계별 주의사항과 사고 발생 시 보고 절차를 점검합니다.',
    format: 'video',
    progress: 100,
    duration: '55분',
    updatedAt: '2026.05.20',
  },
]

export const getEducationCourseById = (id?: string) =>
  educationCourses.find((course) => course.id === id) ?? educationCourses[0]

export const getEducationCoursesByStatus = (status: EducationStatus) =>
  educationCourses.filter((course) => course.status === status)
