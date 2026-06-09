import type { RouteObject } from 'react-router-dom'
import BoardPage from '../../pages/board/BoardPage'
import BoardDetailPage from '../../pages/board/BoardDetailPage'

export const boardRoutes: RouteObject[] = [
  { path: '/boards', element: <BoardPage /> },
  { path: '/boards/:boardId', element: <BoardDetailPage /> },
  { path: '/boards/notices', element: <BoardPage /> },
  { path: '/boards/notices/:boardId', element: <BoardDetailPage /> },
  { path: '/boards/departments', element: <BoardPage /> },
  { path: '/boards/departments/:boardId', element: <BoardDetailPage /> },
  { path: '/boards/dept/:deptCd', element: <BoardPage /> },
  { path: '/boards/dept/:deptCd/:boardId', element: <BoardDetailPage /> },
  { path: '/boards/free', element: <BoardPage /> },
  { path: '/boards/free/:boardId', element: <BoardDetailPage /> },
  { path: '/boards/anonymous', element: <BoardPage /> },
  { path: '/boards/anonymous/:boardId', element: <BoardDetailPage /> },
  { path: '/boards/anon', element: <BoardPage /> },
  { path: '/boards/anon/:boardId', element: <BoardDetailPage /> },
]
