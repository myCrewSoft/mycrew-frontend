// ─────────────────────────────────────────────────────
// generated.ts 는 직접 수정 금지
// 백엔드 DTO 추가/변경 시:
//   1. npm run generate-api 실행 (백엔드 서버 켜놓고)
//   2. 이 파일에 타입 별칭 추가
// ─────────────────────────────────────────────────────

import type { components } from "./generated";


// 예시 - generate-api 실행 후 아래처럼 추가
// export type MemberResponseDto = components['schemas']['MemberResponseDto'];
// export type LoginRequestDto   = components['schemas']['LoginRequestDto'];
// export type TokenResponseDto  = components['schemas']['TokenResponseDto'];
// 게시판
export type BoardSideBarResponse  = components['schemas']['BoardSideBarResponse'];
export type BoardResponse = components['schemas']['BoardResponse'];
export type BoardSearchRequest = components['schemas']['BoardSearchRequest'];
export type BoardCreateRequest = components['schemas']['BoardCreateRequest'];
export type BoardCommentCreateRequest = components['schemas']['BoardCommentCreateRequest'];
export type BoardUpdateRequest = components['schemas']['BoardUpdateRequest'];
export type BoardCommentUpdateRequest = components['schemas']['BoardCommentUpdateRequest'];

export type ApiResponsePageBoardResponse =
  components['schemas']['ApiResponsePageBoardResponse'];
export type PageBoardResponse = components['schemas']['PageBoardResponse'];
export type BoardCommentVO = components['schemas']['BoardCommentVO'];
  
// 일정 관리
export type ScheduleRequestDto = components['schemas']['ScheduleRequestDto']
export type ScheduleTargetRequestDto = components['schemas']['ScheduleTargetRequestDto']
export type ScheduleResponseDto = components['schemas']['ScheduleResponseDto'];
export type ScheduleTargetResponseDto = components['schemas']['ScheduleTargetResponseDto'];

// 메신저
export type CreateChatRoomRequest = components['schemas']['CreateChatRoomRequest'];
export type AddParticipantsRequest = components['schemas']['AddParticipantsRequest'];
export type RemoveParticipantsRequest = components['schemas']['RemoveParticipantsRequest'];
export type UpdateChatRoomRequest = components['schemas']['UpdateChatRoomRequest'];
export type ChatMessageResponse = components['schemas']['ChatMessageResponse'];
export type ChatRoomResponse = components['schemas']['ChatRoomResponse'];
export type ChatParticipantResponse = components['schemas']['ChatParticipantResponse'];

// 사원 검색
export type EmployeeLookupRequest = components['schemas']['EmployeeLookupRequest'];
export type EmployeeLookupResponse = components['schemas']['EmployeeLookupResponse'];

// 부서 필터
export type DepartmentLookupResponse = components['schemas']['DepartmentLookupResponse'];

// 예약
export type ReservationCreateRequest = components['schemas']['ReservationCreateRequest'];
export type ReservationUpdateRequest = components['schemas']['ReservationUpdateRequest'];
export type ReservationResponse = components['schemas']['ReservationResponse'];

// 회의실
export type RoomCreateRequest = components['schemas']['RoomCreateRequest'];
export type RoomUpdateRequest = components['schemas']['RoomUpdateRequest'];
export type RoomResponse = components['schemas']['RoomResponse'];

// 업무
export type TaskCreateRequest = components['schemas']['TaskCreateRequest'];
export type TaskUpdateRequest = components['schemas']['TaskUpdateRequest'];
export type TaskDetailResponse = components['schemas']['TaskDetailResponse'];
export type TaskListResponse = components['schemas']['TaskListResponse'];
export type TaskDashboardResponse = components['schemas']['TaskDashboardResponse'];
export type TaskDashboardSummaryResponse = components['schemas']['TaskDashboardSummaryResponse'];
export type TaskUpcomingResponse = components['schemas']['TaskUpcomingResponse'];

// 화상회의
export type VideoConfCreateRequest = components['schemas']['VideoConfCreateRequest'];
export type VideoMomAprvlRequest = components['schemas']['VideoMomAprvlRequest'];
export type VideoMomUpdateRequest = components['schemas']['VideoMomUpdateRequest'];
export type VideoConfResponse = components['schemas']['VideoConfResponse'];
export type VideoMomAprvlResponse = components['schemas']['VideoMomAprvlResponse'];
export type VideoMomResponse = components['schemas']['VideoMomResponse'];
export type VideoPtcptResponse = components['schemas']['VideoPtcptResponse'];
export type VideoTokenResponse = components['schemas']['VideoTokenResponse'];

// 알림
export type NotificationResponse = components['schemas']['NotificationResponse'];
export type NotificationUnreadCountResponse =
  components['schemas']['NotificationUnreadCountResponse'];
