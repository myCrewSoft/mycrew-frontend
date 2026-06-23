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
export type AdminSchdRequest = components['schemas']['AdminSchdRequest'];
export type AdminSchdListResponse = components['schemas']['AdminSchdListResponse'];
export type AdminSchdResponse = components['schemas']['AdminSchdResponse'];
export type HolidayManualRequest = components['schemas']['HolidayManualRequest'];
export type HolidayResponse = components['schemas']['HolidayResponse'];

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
export type ReservationResponse = Omit<
  components['schemas']['ReservationResponse'],
  'mtngId'
> & {
  mtngId: number | null;
};
export type RsrvStatsSummary = components['schemas']['RsrvStatsSummary'];
export type RsrvListItem = components['schemas']['RsrvListItem'];
export type PopularRmItem = components['schemas']['PopularRmItem'];
export type RsrvSearchRequest = components['schemas']['RsrvSearchRequest'];

// 회의실
export type RoomCreateRequest = components['schemas']['RoomCreateRequest'];
export type RoomUpdateRequest = components['schemas']['RoomUpdateRequest'];
export type RoomResponse = components['schemas']['RoomResponse'];
export type ConfRmStatsSummary = components['schemas']['ConfRmStatsSummary'];
export type AdminMtngListRequest = components['schemas']['AdminMtngListRequest'];
export type AdminMtngListResponse = components['schemas']['AdminMtngListResponse'];
export type AdminMtngListPageResponse = components['schemas']['AdminMtngListPageResponse'];
export type AdminMtngPtcptResponse = components['schemas']['AdminMtngPtcptResponse'];
export type AdminMtngDetailResponse = components['schemas']['AdminMtngDetailResponse'];
export type AdminMtngStatsResponse = components['schemas']['AdminMtngStatsResponse'];
export type AdminMtngAnalyticsItemResponse = components['schemas']['AdminMtngAnalyticsItemResponse'];
export type AdminMtngAnalyticsResponse = components['schemas']['AdminMtngAnalyticsResponse'];

// 업무
export type TaskCreateRequest = components['schemas']['TaskCreateRequest'];
export type TaskUpdateRequest = components['schemas']['TaskUpdateRequest'];
export type TaskDetailResponse = components['schemas']['TaskDetailResponse'];
export type TaskListResponse = components['schemas']['TaskListResponse'];
export type TaskDashboardResponse = components['schemas']['TaskDashboardResponse'];
export type TaskDashboardSummaryResponse = components['schemas']['TaskDashboardSummaryResponse'];
export type TaskUpcomingResponse = components['schemas']['TaskUpcomingResponse'];

// 화상회의
export type VideoTokenResponse = components['schemas']['VideoTokenResponse'];

// 알림
export type NotificationResponse = components['schemas']['NotificationResponse'];
export type NotificationUnreadCountResponse =
  components['schemas']['NotificationUnreadCountResponse'];

// 검색
export type SearchResponse = components['schemas']['SearchResponse'];
export type SearchType = NonNullable<SearchResponse['type']>;
export type SearchHistVO = components['schemas']['SearchHistVO'];
export type EducationSearchDetails = components['schemas']['EducationSearchDetails'];
export type MailSearchDetails = components['schemas']['MailSearchDetails'];
export type MeetingSearchDetails = components['schemas']['MeetingSearchDetails'];
export type ProjectSearchDetails = components['schemas']['ProjectSearchDetails'];
export type ScheduleSearchDetails = components['schemas']['ScheduleSearchDetails'];
export type TaskSearchDetails = components['schemas']['TaskSearchDetails'];

// 사용자 대시보드(위젯)
export type DashboardLayoutResponse = components['schemas']['DashboardLayoutResponse'];
export type DashboardLayoutRequest = components['schemas']['DashboardLayoutRequest'];
export type ApprovalWidgetResponse = components['schemas']['ApprovalWidgetResponse'];
export type AttendanceWidgetResponse = components['schemas']['AttendanceWidgetResponse'];
export type BoardWidgetResponse = components['schemas']['BoardWidgetResponse'];
export type MeetingWidgetResponse = components['schemas']['MeetingWidgetResponse'];
export type MessengerWidgetResponse = components['schemas']['MessengerWidgetResponse'];
export type NotificationWidgetResponse = components['schemas']['NotificationWidgetResponse'];
export type ProjectWidgetResponse = components['schemas']['ProjectWidgetResponse'];
export type ReservationWidgetResponse = components['schemas']['ReservationWidgetResponse'];
export type ScheduleWidgetResponse = components['schemas']['ScheduleWidgetResponse'];
export type TaskWidgetResponse = components['schemas']['TaskWidgetResponse'];
export type MailWidgetResponse = components['schemas']['MailWidgetResponse'];
