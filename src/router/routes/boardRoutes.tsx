import type { RouteObject } from 'react-router-dom'
import BoardPage from '../../pages/board/BoardPage'
import BoardDetailPage from '../../pages/board/BoardDetailPage'

export const boardRoutes: RouteObject[] = [
  { path: '/board', element: <BoardPage /> },
  { path: '/board/notices', element: <BoardPage /> },
  { path: '/board/notices/:boardId', element: <BoardDetailPage /> },
  { path: '/board/departments', element: <BoardPage /> },
  { path: '/board/departments/:boardId', element: <BoardDetailPage /> },
  { path: '/board/free', element: <BoardPage /> },
  { path: '/board/free/:boardId', element: <BoardDetailPage /> },
  { path: '/board/anonymous', element: <BoardPage /> },
  { path: '/board/anonymous/:boardId', element: <BoardDetailPage /> },
]
