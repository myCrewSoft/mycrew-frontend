export type BoardKind = 'notice' | 'department' | 'free' | 'anonymous'

export interface BoardListItem {
  id: number
  type: BoardKind
  title: string
  authorName: string
  createdAt: string
  viewCount?: number
  commentCount?: number
  isPinned?: boolean
  hasAttachment?: boolean
}

export interface BoardListResponse {
  items: BoardListItem[]
  page: number
  totalPages: number
  totalCount: number
}

export interface BoardListParams {
  type: BoardKind
  page?: number
  keyword?: string
  departmentCode?: string
}

export interface BoardMeta {
  type: BoardKind
  title: string
  description: string
  accentClassName: string
}
