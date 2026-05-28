import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '../components/layouts/AuthLayout'
import MainLayout from '../components/layouts/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import CommonComponentsGuide from '../pages/CommonComponentsGuide'
import CalendarPage from '../pages/calendar/CalendarPage'
import { CalendarProvider } from '../pages/calendar/CalendarProvider'
import { boardRoutes } from './routes/boardRoutes'
import { driveRoutes } from './routes/DriveRoutes'

// TODO: 페이지 import 추가
// import LoginPage from '../pages/auth/LoginPage'

export const router = createBrowserRouter([
  // 인증 불필요
  {
    element: <MainLayout />,
    children: [
           { index: true, element: <CommonComponentsGuide /> },
      ...boardRoutes,
      ...driveRoutes,
    ],
  },
  {
    element: (
      <CalendarProvider>
        <MainLayout />
      </CalendarProvider>
    ),
    children: [{ path: '/calendar', element: <CalendarPage /> }],
  },
  {
    element: <AuthLayout />,
    //children: [{ path: '/login', element: <LoginPage  /> }],
  },

  // 로그인 필요
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // { path: '/dashboard', element: <DashboardPage /> },
    ],
  },

  // 관리자 전용
  {
    element: (
      <ProtectedRoute role="ROLE_ADMIN">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // { path: '/admin', element: <AdminPage /> },
    ],
  },
])
