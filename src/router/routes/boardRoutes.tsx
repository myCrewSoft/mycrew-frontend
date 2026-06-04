import type { RouteObject } from 'react-router-dom'
import BoardPage from '../../pages/board/BoardPage'

export const boardRoutes: RouteObject[] = [
  { path: '/board', element: <BoardPage /> },
  { path: '/board/notices', element: <BoardPage /> },
  { path: '/board/departments', element: <BoardPage /> },
  { path: '/board/free', element: <BoardPage /> },
  { path: '/board/anonymous', element: <BoardPage /> },
]
