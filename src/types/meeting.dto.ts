// 화상회의 상태값입니다.
// 백엔드 공통코드(CONF_STTUS_CD)가 정해지면 아래 문자열로 매핑해서 내려주면 됩니다.
export type MeetingStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

// 회의록 상태값입니다.
// TB_VIDEO_MOM.MOM_STTUS_CD 값을 프론트가 이해하기 쉬운 문자열로 변환한 형태입니다.
export type MeetingMinutesStatus = '생성 중' | '수정 중' | '결재 중' | '승인 됨'

// 회의가 끝난 뒤 생성되는 녹취록 처리 상태입니다.
// 녹화 파일을 저장하는 기능이 아니라, 음성 기반 텍스트 기록을 만든다는 의미로 분리했습니다.
export type MeetingTranscriptStatus = '없음' | '생성 중' | '생성 완료'

// 화면 상단 탭에서 사용할 필터 타입입니다.
export type MeetingListFilter = 'scheduled' | 'live' | 'ended'

// 회의 참여자 한 명의 요약 정보입니다.
// 지금 목록 화면에서는 count만 써도 되지만, 상세 화면 확장을 위해 participants를 열어둡니다.
export interface MeetingParticipantSummary {
  memberId: number
  name: string
  departmentName?: string
  positionName?: string
  joinedAt?: string
  leftAt?: string
}

// GET /api/v1/meetings 응답의 data 배열 아이템으로 기대하는 DTO입니다.
// 백엔드에서는 TB_VIDEO_CONF 중심으로 참여자 수, 회의록, 녹취록 상태를 조합해서 내려주면 됩니다.
export interface MeetingSummaryResponse {
  meetingId: number
  title: string
  description?: string
  meetingRoomName?: string
  creatorId: number
  creatorName: string
  status: MeetingStatus
  startDateTime: string
  endDateTime?: string
  createdAt?: string
  participantCount: number
  participants?: MeetingParticipantSummary[]
  inviteUrl?: string
  joinAvailable?: boolean
  transcriptStatus?: MeetingTranscriptStatus
  transcriptId?: number
  transcriptDownloadUrl?: string
  minutesStatus?: MeetingMinutesStatus
  minutesId?: number
  myMinutesApprovalStatus?: 'none' | 'required' | 'approved'
}

// 회의록 수정 이력 응답 DTO입니다.
// 실제 테이블에 버전별 본문이 저장되어 있다면, 사용자가 특정 버전을 눌러 읽기 전용으로 확인할 수 있습니다.
export interface MeetingMinutesRevisionResponse {
  revisionId: number
  minutesId: number
  version: number
  content: string
  modifiedByName: string
  modifiedAt: string
  changeMemo?: string
}

// 목록 API에 전달할 조회 조건입니다.
// OpenAPI로 명세를 만들 때 query parameter와 같은 이름을 사용하면 프론트 연동이 단순해집니다.
export interface MeetingListParams {
  status?: MeetingListFilter
  from?: string
  to?: string
}

// 즉시 회의 생성 API를 붙일 때 사용할 요청 DTO입니다.
// 현재 화면에서는 버튼 연결점만 만들어두고, 실제 생성 모달은 다음 단계에서 확장하면 됩니다.
export interface CreateInstantMeetingRequest {
  title: string
  participantIds: number[]
}

// 예약 회의 생성 요청 DTO입니다.
// 백엔드는 이 값을 받아 TB_VIDEO_CONF와 TB_VIDEO_PTCPT를 함께 생성하면 됩니다.
export interface CreateScheduledMeetingRequest {
  title: string
  description?: string
  meetingRoomName?: string
  startDateTime: string
  endDateTime: string
  participantIds: number[]
  minutesEnabled?: boolean
  transcriptEnabled?: boolean
}
