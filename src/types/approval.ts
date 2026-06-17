/**
 * Approval API Types
 *
 * Java DTO -> TypeScript mapping
 * - Long -> number
 * - boolean -> boolean
 * - String -> string
 * - LocalDateTime -> LocalDateTimeString
 * - List<T> -> T[]
 */

export type LocalDateTimeString = string;
export type Nullable<T> = T | null;


/** 결재 처리 사유 요청 */
export interface ApprovalActionRequestDTO {
  /** 승인 또는 반려 사유 */
  reason?: string;
}

/** 결재 기안서 임시 작성 요청 */
export interface ApprovalDraftRequestDTO {
  /** 기안문 일련번호. 기존 임시저장 문서를 수정할 때 사용합니다. */
  drftDocSn?: number;

  /** 기안서 제목 */
  docTtl?: string;

  /** 결재 희망 일시. 예: 2026-06-30T18:00:00 */
  aprvlHopeDt?: LocalDateTimeString;

  /** 기안서 템플릿 코드 */
  tmplatCd?: string;

  /** 첨부파일 ID */
  atchFileId?: number;

  /** 결재 전문 내용 */
  aprvlFullCn?: string;

  /** 결재 단계 목록 */
  approvalLines?: ApprovalStepRequestDTO[];
}

/** 전자결재 AI 기안서 초안 생성 요청 */
export interface ApprovalAiDraftRequestDTO {
  /** AI에게 전달할 기안서 작성 요청 내용 */
  userPrompt: string;

  /** 우선 활용할 결재 양식 코드 */
  tmplatCd?: string;
}

/** 전자결재 AI 기안서 초안 생성 응답 */
export interface ApprovalAiDraftResponseDTO {
  /** AI가 생성해 임시저장한 기안문 일련번호 */
  drftDocSn: number;

  /** AI가 생성한 기안서 제목 */
  docTtl: string;

  /** AI 초안에 적용된 결재 양식 코드 */
  tmplatCd?: Nullable<string>;

  /** AI 초안 생성 중 서버가 보정한 내용 또는 사용자 확인이 필요한 경고 */
  warnings?: string[];
}

/** 결재 단계 요청 */
export interface ApprovalStepRequestDTO {
  /** 결재 방식 코드 */
  aprvlMthdCd: string;

  /** 결재 순서 */
  aprvlOrd: number;

  /** 결재자 사원 ID 목록 */
  aprvrEmpIds: number[];
}

/** 결재 처리 가능 여부 응답 */
export interface ApprovalAvailabilityResponse {
  /** 기안문 일련번호 */
  drftDocSn: number;

  /** 처리 가능 여부 */
  available: boolean;

  /** 처리 가능 여부 설명 */
  message: string;
}

/** 결재 문서 상세 응답 */
export interface ApprovalDocumentDetailResponse {
  /** 기안문 일련번호 */
  drftDocSn: number;

  /** 문서 제목 */
  docTtl: string;

  /** 템플릿 코드 */
  tmplatCd: string;

  /** 기안자 사원 ID */
  empId: number;

  /** 기안자명 */
  drafterEmpNm: string;

  /** 기안자 부서명 */
  drafterDeptNm: string;

  /** 기안자 직급명 */
  drafterJobGrdNm: string;

  /** 기안자 직위명 */
  drafterJobPstnNm: string;

  /** 프로필 이미지 파일 ID */
  prflImgFileId: Nullable<number>;

  /** 결재 전문 내용 */
  aprvlFullCn: string;

  /** 결재 요청 일시 */
  drftReqstDt: Nullable<LocalDateTimeString>;

  /** 결재 희망 일시 */
  aprvlHopeDt: Nullable<LocalDateTimeString>;

  /** 결재 완료 일시 */
  aprvlCmptnDt: Nullable<LocalDateTimeString>;

  /** 반려 일시 */
  rtrnDt: Nullable<LocalDateTimeString>;

  /** 결재 문서 상태 코드 */
  aprvlDocSttsCd: string;

  /** 첨부파일 ID */
  atchFileId: Nullable<number>;

  /** 결재 상태 표시 메시지 */
  statusMessages: string[];

  /** 결재 단계 및 결재자 상태 */
  approvalSteps: ApprovalStepStatusResponse[];
}

/** 결재 기안서 목록 응답 */
export interface ApprovalDraftSummaryResponse {
  /** 기안문 일련번호 */
  drftDocSn: number;

  /** 기안서 제목 */
  docTtl: string;

  /** 템플릿 코드 */
  tmplatCd: string;

  /** 기안자 사원 ID */
  empId: number;

  /** 기안자명 */
  drafterEmpNm: string;

  /** 결재자명 목록 */
  approverNames: string;

  /** 기안 요청 일시 */
  drftReqstDt: Nullable<LocalDateTimeString>;

  /** 결재 희망 일시 */
  aprvlHopeDt: Nullable<LocalDateTimeString>;

  /** 결재 문서 상태 코드 */
  aprvlDocSttsCd: string;

  /** 반려 사유 */
  rtrnRsn: Nullable<string>;
}

/** 결재 변경 처리 응답 */
export interface ApprovalMutationResponse {
  /** 기안문 일련번호 */
  drftDocSn: number;

  /** 결재 문서 상태 코드 */
  aprvlDocSttsCd: string;

  /** 처리 메시지 */
  message: string;
}

/** 결재자 처리 상태 응답 */
export interface ApprovalStepStatusResponse {
  /** 결재 단계 일련번호 */
  aprvlStepSn: number;

  /** 결재 순서 */
  aprvlOrd: number;

  /** 결재 단계 상태 코드 */
  stepPrgrsCd: string;

  /** 결재자 사원 ID */
  aprvrEmpId: number;

  /** 결재자명 */
  aprvrEmpNm: string;

  /** 결재자 부서명 */
  aprvrDeptNm?: Nullable<string>;

  /** 결재자 직위명 */
  aprvrJobPstnNm?: Nullable<string>;

  /** 결재자 프로필 이미지 파일 ID */
  aprvrPrflImgFileId?: Nullable<number>;

  /** 결재 처리 상태 코드 */
  aprvlPrgrsCd: string;

  /** 승인 또는 반려 처리 일시 */
  aprvlDt: Nullable<LocalDateTimeString>;

  /** 승인 사유 */
  aprvlRsn: Nullable<string>;

  /** 반려 사유 */
  rtrnRsn: Nullable<string>;
}

/** 전자결재 함별 기안서 건수 응답 */
export interface ApprovalDraftCountResponse {
  /** 상신함 - 진행 중 기안서 수 */
  sentProgress: number;

  /** 상신함 - 완료된 기안서 수 */
  sentCompleted: number;

  /** 상신함 - 반려된 기안서 수 */
  sentRejected: number;

  /** 상신함 - 임시저장 기안서 수 */
  sentTemporary: number;

  /** 수신함 - 결재 요청(내 처리 대기) 문서 수 */
  receivedRequests: number;

  /** 수신함 - 결재 내역(내가 처리한) 문서 수 */
  receivedHistory: number;

  /** 수신함 - 결재 완료(내가 승인한 최종 완료) 문서 수 */
  receivedCompleted: number;
}

/** 결재 템플릿 응답 */
export interface ApprovalTemplateResponse {
  /** 템플릿 코드 */
  tmplatCd: string;

  /** 템플릿명 */
  tmplatNm: string;

  /** 템플릿 내용 */
  tmplatCn: string;

  /** 사용 여부 */
  useYn: string;

  /** 첨부파일 ID */
  atchFileId: Nullable<number>;

  /** 현재 사원의 즐겨찾기 여부 */
  favoriteYn: string;
}

/** 결재 템플릿 생성 요청 */
export interface ApprovalTemplateCreateRequestDTO {
  /** 템플릿명 */
  tmplatNm: string;

  /** HTML 템플릿 내용 */
  tmplatCn: string;

  /** 사용 여부 */
  useYn?: string;

  /** 첨부파일 ID */
  atchFileId?: Nullable<number>;
}

/** 결재 템플릿 수정 요청 */
export interface ApprovalTemplateUpdateRequestDTO {
  /** 템플릿 코드 */
  tmplatCd: string;

  /** 템플릿명 */
  tmplatNm?: string;

  /** HTML 템플릿 내용 */
  tmplatCn?: string;

  /** 사용 여부 */
  useYn?: string;

  /** 첨부파일 ID */
  atchFileId?: Nullable<number>;
}
