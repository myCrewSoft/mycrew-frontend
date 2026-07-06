import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type {
  MailBulkRequest,
  MailBulkResponse,
  MailDetailResponse,
  MailDraftRequest,
  MailLabelRequest,
  MailLabelResponse,
  MailUnreadCountResponse,
  MailImportantUpdateRequest,
  MailListQuery,
  MailMutationResponse,
  MailSendRequest,
  MailSendResponse,
  MailSummaryResponse,
  MailTrashClearResponse,
  MailTrashQuery,
} from '../types/mail.dto';

const createMailFormData = (
  request: MailSendRequest,
  attachments: File[],
) => {
  const formData = new FormData();
  formData.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' }),
  );
  attachments.forEach((file) => {
    formData.append('attachments', file);
  });
  return formData;
};

export const mailApi = {
  // Gmail 전체 동기화는 수십 초가 걸릴 수 있어, 이 호출만 타임아웃을 넉넉히 둔다.
  // (전역 기본 10초는 다른 호출 보호용으로 그대로 유지)
  syncMails: (maxResults = 50) =>
    axiosInstance.post<ApiResponse<unknown>>('/api/mails/sync', null, {
      params: { maxResults },
      timeout: 60_000,
    }),

  getMails: (query: MailListQuery) =>
    axiosInstance.get<ApiResponse<MailSummaryResponse[]>>('/api/mails', {
      params: query,
    }),

  getTrashMails: (query: MailTrashQuery) =>
    axiosInstance.get<ApiResponse<MailSummaryResponse[]>>('/api/mails/trash', {
      params: query,
    }),

  getMailDetail: (mailId: number) =>
    axiosInstance.get<ApiResponse<MailDetailResponse>>(`/api/mails/${mailId}`),

  sendMail: (request: MailSendRequest, attachments: File[] = []) =>
    axiosInstance.post<ApiResponse<MailSendResponse>>(
      '/api/mails',
      createMailFormData(request, attachments),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  moveToTrash: (mailId: number) =>
    axiosInstance.delete<ApiResponse<MailMutationResponse>>(
      `/api/mails/${mailId}`,
    ),

  markAsRead: (mailId: number) =>
    axiosInstance.patch<ApiResponse<MailMutationResponse>>(
      `/api/mails/${mailId}/read`,
    ),

  markAsUnread: (mailId: number) =>
    axiosInstance.patch<ApiResponse<MailMutationResponse>>(
      `/api/mails/${mailId}/unread`,
    ),

  downloadAttachment: (mailId: number, attachmentId: number) =>
    axiosInstance.get<Blob>(
      `/api/mails/${mailId}/attachments/${attachmentId}`,
      { responseType: 'blob' },
    ),

  updateImportant: (
    mailId: number,
    request: MailImportantUpdateRequest,
  ) =>
    axiosInstance.patch<ApiResponse<MailMutationResponse>>(
      `/api/mails/${mailId}/important`,
      request,
    ),

  clearTrash: () =>
    axiosInstance.delete<ApiResponse<MailTrashClearResponse>>(
      '/api/mails/trash',
    ),

  restoreTrashMail: (mailId: number) =>
    axiosInstance.post<ApiResponse<MailMutationResponse>>(
      `/api/mails/trash/${mailId}/restore`,
    ),

  bulkAction: (request: MailBulkRequest) =>
    axiosInstance.post<ApiResponse<MailBulkResponse>>('/api/mails/bulk', request),

  saveDraft: (request: MailDraftRequest) =>
    axiosInstance.post<ApiResponse<number>>('/api/mails/drafts', request),

  getDraft: (mailId: number) =>
    axiosInstance.get<ApiResponse<MailDetailResponse>>(
      `/api/mails/drafts/${mailId}`,
    ),

  sendDraft: (mailId: number) =>
    axiosInstance.post<ApiResponse<MailSendResponse>>(
      `/api/mails/drafts/${mailId}/send`,
    ),

  deleteDraft: (mailId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/mails/drafts/${mailId}`),

  getMailUnreadCount: () =>
    axiosInstance.get<ApiResponse<MailUnreadCountResponse>>(
      '/api/mails/unread-count',
    ),

  getUserLabels: () =>
    axiosInstance.get<ApiResponse<MailLabelResponse[]>>('/api/mails/labels'),

  createLabel: (request: MailLabelRequest) =>
    axiosInstance.post<ApiResponse<MailLabelResponse>>('/api/mails/labels', request),

  renameLabel: (labelId: number, request: MailLabelRequest) =>
    axiosInstance.patch<ApiResponse<MailLabelResponse>>(
      `/api/mails/labels/${labelId}`,
      request,
    ),

  deleteLabel: (labelId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/mails/labels/${labelId}`),

  getMailsByLabel: (labelId: number, query: { page?: number; size?: number }) =>
    axiosInstance.get<ApiResponse<MailSummaryResponse[]>>(
      `/api/mails/labels/${labelId}/mails`,
      { params: query },
    ),

  getMailLabels: (mailId: number) =>
    axiosInstance.get<ApiResponse<MailLabelResponse[]>>(
      `/api/mails/${mailId}/labels`,
    ),

  applyLabel: (mailId: number, labelId: number) =>
    axiosInstance.post<ApiResponse<void>>(
      `/api/mails/${mailId}/labels/${labelId}`,
    ),

  removeLabel: (mailId: number, labelId: number) =>
    axiosInstance.delete<ApiResponse<void>>(
      `/api/mails/${mailId}/labels/${labelId}`,
    ),
};
