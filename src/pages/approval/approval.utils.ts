import {
  CheckCircle2,
  Clock3,
  FileText,
  PenLine,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { approvalApi, type ApprovalPageParams } from '../../api/approvalApi'
import { ApiError } from '../../api/axiosInstance'
import type { ApprovalBox, BadgeVariant } from './approval.types'

export const pageMeta: Record<
  ApprovalBox,
  {
    title: string
    description: string
    icon: typeof FileText
    badgeVariant: BadgeVariant
  }
> = {
  'sent-progress': {
    title: '진행 중 기안서 목록',
    description: '내가 상신했고 아직 결재가 완료되지 않은 기안서입니다.',
    icon: Clock3,
    badgeVariant: 'warning',
  },
  'sent-completed': {
    title: '완료된 기안서 목록',
    description: '내가 상신한 문서 중 결재가 완료된 기안서입니다.',
    icon: CheckCircle2,
    badgeVariant: 'success',
  },
  'sent-rejected': {
    title: '반려된 기안서 목록',
    description: '내가 상신한 문서 중 반려 처리된 기안서입니다.',
    icon: XCircle,
    badgeVariant: 'danger',
  },
  'sent-temporary': {
    title: '임시저장 기안서',
    description: '임시저장한 기안서를 확인하고 다시 결재 요청할 수 있습니다.',
    icon: PenLine,
    badgeVariant: 'outline',
  },
  'received-requests': {
    title: '결재 요청 목록',
    description: '내 결재 처리가 필요한 수신 문서입니다.',
    icon: FileText,
    badgeVariant: 'primary',
  },
  'received-history': {
    title: '결재 내역',
    description: '내가 결재자로 승인 또는 반려 처리한 문서 이력입니다.',
    icon: RotateCcw,
    badgeVariant: 'outline',
  },
  'received-completed': {
    title: '결재 완료 문서',
    description: '내가 승인 처리했고 최종 완료된 문서입니다.',
    icon: CheckCircle2,
    badgeVariant: 'success',
  },
}

export const routeToBox = (folder?: string, status?: string): ApprovalBox | null => {
  if (folder === 'sent' && status === 'progress') return 'sent-progress'
  if (folder === 'sent' && status === 'completed') return 'sent-completed'
  if (folder === 'sent' && status === 'rejected') return 'sent-rejected'
  if (folder === 'sent' && status === 'temporary') return 'sent-temporary'
  if (folder === 'received' && status === 'requests') return 'received-requests'
  if (folder === 'received' && status === 'history') return 'received-history'
  if (folder === 'received' && status === 'completed') return 'received-completed'
  return null
}

export const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export const getStatusLabel = (statusCode: string) => {
  const normalized = statusCode.toUpperCase()
  if (normalized.includes('TEMP')) return '임시저장'
  if (normalized.includes('PROGRESS') || normalized.includes('PRGRS')) return '진행 중'
  if (normalized.includes('COMPLETE') || normalized.includes('CMPTN')) return '완료'
  if (normalized.includes('REJECT') || normalized.includes('RTRN')) return '반려'
  if (normalized.includes('REQUEST')) return '결재 요청'
  return statusCode || '-'
}

export const getStepStatusLabel = (statusCode: string) => {
  const normalized = statusCode.toUpperCase()
  if (normalized.includes('APPROVE') || normalized.includes('APRVD')) return '승인'
  if (normalized.includes('REJECT') || normalized.includes('RTRN')) return '반려'
  if (normalized.includes('WAIT')) return '대기'
  if (normalized.includes('PROGRESS') || normalized.includes('PRGRS')) return '진행 중'
  return statusCode || '-'
}

export const getStatusVariant = (statusCode: string): BadgeVariant => {
  const label = getStatusLabel(statusCode)
  if (label === '완료') return 'success'
  if (label === '반려') return 'danger'
  if (label === '진행 중') return 'warning'
  if (label === '결재 요청') return 'primary'
  return 'outline'
}

export const getListRequest = (box: ApprovalBox, params?: ApprovalPageParams) => {
  switch (box) {
    case 'sent-progress':
      return approvalApi.getProgressApprovalList(params)
    case 'sent-completed':
      return approvalApi.getCompletedApprovalList(params)
    case 'sent-rejected':
      return approvalApi.getRejectedApprovalList(params)
    case 'sent-temporary':
      return approvalApi.getTemporaryApprovalList(params)
    case 'received-requests':
      return approvalApi.getRequestedApprovalList(params)
    case 'received-history':
      return approvalApi.getHistoryApprovalList(params)
    case 'received-completed':
      return approvalApi.getCompletedApprovalDocumentList(params)
  }
}

export const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
