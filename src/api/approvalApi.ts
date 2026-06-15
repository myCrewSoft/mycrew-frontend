import type { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';

import type {
  ApprovalActionRequestDTO,
  ApprovalAvailabilityResponse,
  ApprovalDocumentDetailResponse,
  ApprovalDraftCountResponse,
  ApprovalDraftRequestDTO,
  ApprovalDraftSummaryResponse,
  ApprovalMutationResponse,
  ApprovalStepRequestDTO,
  ApprovalTemplateCreateRequestDTO,
  ApprovalTemplateResponse,
  ApprovalTemplateUpdateRequestDTO,
} from '../types/approval';

export type ApprovalPageParams = {
  keyword?: string;
  page?: number;
  size?: number;
};

export type ApprovalDraftSearchParams = ApprovalPageParams & {
  documentStatus?: string;
};

/** @deprecated keyword 전용 파라미터는 ApprovalPageParams로 대체되었습니다. */
export type ApprovalKeywordSearchParams = ApprovalPageParams;

export type ApprovalApproverListType = 'request' | 'history' | 'completed';

type ApprovalPagedListResponse = AxiosResponse<ApiResponse<ApprovalDraftSummaryResponse[]>>;
type ApprovalDetailResponse = AxiosResponse<ApiResponse<ApprovalDocumentDetailResponse>>;
type ApprovalMutationAxiosResponse = AxiosResponse<ApiResponse<ApprovalMutationResponse>>;
type ApprovalAvailabilityAxiosResponse = AxiosResponse<ApiResponse<ApprovalAvailabilityResponse>>;
type ApprovalTemplateAxiosResponse = AxiosResponse<ApiResponse<ApprovalTemplateResponse>>;
type ApprovalTemplateListResponse = AxiosResponse<ApiResponse<ApprovalTemplateResponse[]>>;
type ApprovalDraftCountAxiosResponse = AxiosResponse<ApiResponse<ApprovalDraftCountResponse>>;

const APPROVAL_BASE_URL = '/api/approval';

export const approvalApi = {
  /**
   * 기안서 임시저장
   * POST /api/approval/drafts
   */
  saveTemporaryDraft: (
    data: ApprovalDraftRequestDTO,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.post(`${APPROVAL_BASE_URL}/drafts`, data);
  },

  /**
   * 결재선 저장
   * PUT /api/approval/drafts/{drftDocSn}/lines
   */
  saveApprovalLine: (
    drftDocSn: number,
    data: ApprovalStepRequestDTO[],
  ): Promise<AxiosResponse<ApiResponse<void>>> => {
    return axiosInstance.put(`${APPROVAL_BASE_URL}/drafts/${drftDocSn}/lines`, data);
  },

  /**
   * 임시저장 기안서 삭제
   * DELETE /api/approval/drafts/{drftDocSn}
   */
  deleteTemporaryDraft: (
    drftDocSn: number,
  ): Promise<AxiosResponse<ApiResponse<void>>> => {
    return axiosInstance.delete(`${APPROVAL_BASE_URL}/drafts/${drftDocSn}`);
  },

  /**
   * 전자결재 함별 기안서 건수 조회 (서브 사이드바 배지용)
   * GET /api/approval/counts
   */
  getApprovalCounts: (): Promise<ApprovalDraftCountAxiosResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/counts`);
  },

  /**
   * 내 기안서 목록 조회
   * GET /api/approval/drafts
   */
  getMyApprovalList: (
    params?: ApprovalDraftSearchParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/drafts`, { params });
  },

  /**
   * 진행 중인 기안서 목록 조회
   * GET /api/approval/drafts/progress
   */
  getProgressApprovalList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/drafts/progress`, { params });
  },

  /**
   * 완료된 기안서 목록 조회
   * GET /api/approval/drafts/completed
   */
  getCompletedApprovalList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/drafts/completed`, { params });
  },

  /**
   * 반려된 기안서 목록 조회
   * GET /api/approval/drafts/rejected
   */
  getRejectedApprovalList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/drafts/rejected`, { params });
  },

  /**
   * 임시저장 기안서 목록 조회
   * GET /api/approval/drafts/temporary
   */
  getTemporaryApprovalList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/drafts/temporary`, { params });
  },

  /**
   * 결재 문서 상세 조회
   * GET /api/approval/documents/{drftDocSn}
   */
  getApprovalDetail: (
    drftDocSn: number,
  ): Promise<ApprovalDetailResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/documents/${drftDocSn}`);
  },

  /**
   * 기안서 결재 상태 상세 조회
   * GET /api/approval/drafts/{drftDocSn}/status
   */
  getApprovalStatus: (
    drftDocSn: number,
  ): Promise<ApprovalDetailResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/drafts/${drftDocSn}/status`);
  },

  /**
   * 결재 요청 목록 조회
   * GET /api/approval/requests
   */
  getRequestedApprovalList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/requests`, { params });
  },

  /**
   * 결재 이력 조회
   * GET /api/approval/history
   */
  getHistoryApprovalList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/history`, { params });
  },

  /**
   * 결재 완료 문서 조회
   * GET /api/approval/completed-documents
   */
  getCompletedApprovalDocumentList: (
    params?: ApprovalPageParams,
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/completed-documents`, { params });
  },

  /**
   * 결재자 문서 통합 검색
   * GET /api/approval/approver-documents
   */
  searchApprovalDocumentsForApprover: (
    params: ApprovalPageParams & {
      listType: ApprovalApproverListType;
    },
  ): Promise<ApprovalPagedListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/approver-documents`, { params });
  },

  /**
   * 결재 요청
   * POST /api/approval/drafts/{drftDocSn}/submit
   */
  submitApproval: (
    drftDocSn: number,
  ): Promise<ApprovalMutationAxiosResponse> => {
    return axiosInstance.post(`${APPROVAL_BASE_URL}/drafts/${drftDocSn}/submit`);
  },

  /**
   * 결재 회수
   * POST /api/approval/drafts/{drftDocSn}/withdraw
   */
  withdrawApproval: (
    drftDocSn: number,
  ): Promise<ApprovalMutationAxiosResponse> => {
    return axiosInstance.post(`${APPROVAL_BASE_URL}/drafts/${drftDocSn}/withdraw`);
  },

  /**
   * 결재 승인
   * POST /api/approval/documents/{drftDocSn}/approve
   */
  approveApproval: (
    drftDocSn: number,
    data?: ApprovalActionRequestDTO,
  ): Promise<ApprovalMutationAxiosResponse> => {
    return axiosInstance.post(`${APPROVAL_BASE_URL}/documents/${drftDocSn}/approve`, data);
  },

  /**
   * 결재 반려
   * POST /api/approval/documents/{drftDocSn}/reject
   */
  rejectApproval: (
    drftDocSn: number,
    data: ApprovalActionRequestDTO,
  ): Promise<ApprovalMutationAxiosResponse> => {
    return axiosInstance.post(`${APPROVAL_BASE_URL}/documents/${drftDocSn}/reject`, data);
  },

  /**
   * 승인 가능 여부 확인
   * GET /api/approval/documents/{drftDocSn}/approve
   */
  canApprove: (
    drftDocSn: number,
  ): Promise<ApprovalAvailabilityAxiosResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/documents/${drftDocSn}/approve`);
  },

  /**
   * 반려 가능 여부 확인
   * GET /api/approval/documents/{drftDocSn}/reject
   */
  canReject: (
    drftDocSn: number,
  ): Promise<ApprovalAvailabilityAxiosResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/documents/${drftDocSn}/reject`);
  },


  /**
   * 결재 템플릿 목록 조회
   * GET /api/approval/templates
   */
  getApprovalTemplates: (): Promise<ApprovalTemplateListResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/templates`);
  },

  /**
   * 결재 템플릿 생성
   * POST /api/approval/templates
   */
  createApprovalTemplate: (
    data: ApprovalTemplateCreateRequestDTO,
  ): Promise<ApprovalTemplateAxiosResponse> => {
    return axiosInstance.post(`${APPROVAL_BASE_URL}/templates`, data);
  },

  /**
   * 결재 템플릿 수정
   * PATCH /api/approval/templates
   */
  updateApprovalTemplate: (
    data: ApprovalTemplateUpdateRequestDTO,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.patch(`${APPROVAL_BASE_URL}/templates`, data);
  },

  /**
   * 결재 템플릿 조회
   * GET /api/approval/templates/{tmplatCd}
   */
  getApprovalTemplate: (
    tmplatCd: string,
  ): Promise<ApprovalTemplateAxiosResponse> => {
    return axiosInstance.get(`${APPROVAL_BASE_URL}/templates/${tmplatCd}`);
  },

  /**
   * 결재 템플릿 즐겨찾기 변경
   * PATCH /api/approval/templates/{tmplatCd}/favorite
   */
  toggleTemplateFavorite: (
    tmplatCd: string,
  ): Promise<ApprovalMutationAxiosResponse> => {
    return axiosInstance.patch(`${APPROVAL_BASE_URL}/templates/${tmplatCd}/favorite`);
  },

  /**
   * 결재 템플릿 삭제 (제작자 또는 '결재 양식 삭제' 권한 보유자만 가능)
   * DELETE /api/approval/templates/{tmplatCd}
   */
  deleteApprovalTemplate: (
    tmplatCd: string,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.delete(`${APPROVAL_BASE_URL}/templates/${tmplatCd}`);
  },
} as const;
