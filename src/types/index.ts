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
export type PageBoardResponse = components['schemas']['PageBoardResponse'];
export type BoardSearchRequest = components['schemas']['BoardSearchRequest'];

export type ApiResponsePageBoardResponse =
  components['schemas']['ApiResponsePageBoardResponse'];
// 일정 관리
export type ScheduleRequestDto = components['schemas']['ScheduleRequestDto']
export type ScheduleTargetRequestDto = components['schemas']['ScheduleTargetRequestDto']
export type ScheduleResponseDto = components['schemas']['ScheduleResponseDto'];
export type ScheduleTargetResponseDto = components['schemas']['ScheduleTargetResponseDto'];
// 메신저
export type CreateChatRoomRequest = components['schemas']['CreateChatRoomRequest'];
export type ChatMessageResponse = components['schemas']['ChatMessageResponse'];
export type ChatRoomResponse = components['schemas']['ChatRoomResponse'];

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
