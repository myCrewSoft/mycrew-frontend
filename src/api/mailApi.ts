import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type {
  MailBulkRequest,
  MailBulkResponse,
  MailDetailResponse,
  MailDraftRequest,
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
  syncMails: (maxResults = 50) =>
    axiosInstance.post<ApiResponse<unknown>>('/api/mails/sync', null, {
      params: { maxResults },
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

  deleteDraft: (mailId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/mails/drafts/${mailId}`),
};
