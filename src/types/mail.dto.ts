import type { PageInfo } from '../api/axiosInstance';

export type MailboxType =
  | 'inbox'
  | 'sent'
  | 'all'
  | 'self'
  | 'tome'
  | 'important'
  | 'unread'
  | 'draft';

export type MailRouteBox = MailboxType | 'trash';

export interface MailListQuery {
  type?: MailboxType;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface MailTrashQuery {
  page?: number;
  size?: number;
}

export interface MailSummaryResponse {
  mailId: number;
  externalMessageId: string;
  threadId: string;
  subject: string;
  snippet: string | null;
  fromEmail: string | null;
  toSummary: string | null;
  sentAt: string;
  unread: boolean;
  important: boolean;
  hasAttachment: boolean;
  mailboxTypes: string[];
}

export type MailParticipantType = 'FROM' | 'TO' | 'CC' | 'BCC' | 'REPLY_TO';

export interface MailParticipantResponse {
  type: MailParticipantType;
  email: string;
}

export interface MailAttachmentResponse {
  attachmentId: number;
  originalFileName: string;
  fileSize: number;
  contentType: string | null;
}

export interface MailDetailResponse {
  mailId: number;
  externalMessageId: string;
  threadId: string;
  subject: string;
  content: string | null;
  contentRenderMode?: 'SANDBOX_IFRAME' | string | null;
  snippet: string | null;
  fromEmail: string | null;
  participants: MailParticipantResponse[];
  attachments: MailAttachmentResponse[];
  sentAt: string;
  unread: boolean;
  important: boolean;
  labels: string[];
}

export interface MailSendRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  inReplyToMailId?: number;
}

export interface MailBulkRequest {
  action: 'read' | 'unread' | 'trash' | 'important';
  mailIds: number[];
  important?: boolean;
}

export interface MailBulkResponse {
  processed: number;
  failed: number;
}

export interface MailDraftRequest {
  mailId?: number;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content?: string;
}

export interface MailSendResponse {
  mailId: number;
  externalMessageId: string;
  threadId: string;
  sentAt: string;
}

export interface MailImportantUpdateRequest {
  important: boolean;
}

export type MailMutationStatus =
  | 'TRASHED'
  | 'READ'
  | 'IMPORTANT_UPDATED'
  | 'RESTORED'
  | 'DELETED';

export interface MailMutationResponse {
  mailId: number;
  status: MailMutationStatus;
}

export interface MailTrashClearResponse {
  deletedCount: number;
}

export interface MailListResult {
  items: MailSummaryResponse[];
  pagination: PageInfo | null;
}
