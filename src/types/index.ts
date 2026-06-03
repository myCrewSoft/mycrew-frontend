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
// 일정 관리
export type ScheduleRequestDto = components['schemas']['ScheduleRequestDto']
export type ScheduleTargetRequestDto = components['schemas']['ScheduleTargetRequestDto']
export type ScheduleResponseDto = components['schemas']['ScheduleResponseDto'];
export type ScheduleTargetResponseDto = 
                components['schemas']['ScheduleTargetResponseDto'];
// 사원 검색
export type EmployeeLookupRequest = components['schemas']['EmployeeLookupRequest'];
export type EmployeeLookupResponse = components['schemas']['EmployeeLookupResponse'];

// 부서 필터
export type DepartmentLookupResponse = components['schemas']['DepartmentLookupResponse'];