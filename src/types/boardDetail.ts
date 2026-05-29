import type { BoardKind } from './board'

export interface BoardAttachment {
  id: number
  fileName: string
  fileSize: string
  fileType: 'pdf' | 'doc' | 'xls' | 'image' | 'etc'
}

export interface BoardComment {
  id: number
  authorName: string
  departmentName?: string
  content: string
  createdAt: string
  isReply?: boolean
}

export interface BoardDetail {
  id: number
  type: BoardKind
  badgeLabel: string
  title: string
  authorName: string
  authorDepartment?: string
  createdAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  content: string[]
  attachments: BoardAttachment[]
  commentsEnabled: boolean
  comments: BoardComment[]
}

