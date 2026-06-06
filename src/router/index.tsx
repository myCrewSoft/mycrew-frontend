import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';
import MainLayout from '../components/layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import CommonComponentsGuide from '../pages/CommonComponentsGuide';
import AdminAccessGate from '../pages/admin/AdminAccessGate';
import FirstLoginPage from '../pages/auth/FirstLoginPage';
import LoginPage from '../pages/auth/LoginPage';
import CalendarPage from '../pages/calendar/CalendarPage';
import { CalendarProvider } from '../pages/calendar/CalendarProvider';
import DashboardPage from '../pages/dashboard/DashboardPage';
import { boardRoutes } from './routes/boardRoutes';
import ReservationPage from '../pages/Reservation/ReservationPage';
import { ReservationProvider } from '../pages/Reservation/ReservationProvider';
import { meetingRoutes } from './routes/meetingRoutes';
import ChatbotPage from '../pages/ai/Chatbotpage';
import MyPage from '../pages/mypage/MyPage';
import { driveRoutes } from './routes/driveRoutes'
import AttendancePage from '../pages/attendance/AttendancePage';
import { projectRoutes } from './routes/projectRoutes';
import MailPage from '../pages/mail/MailPage';
import OrganizationPage from '../pages/organization/OrganizationPage';
import ApprovalPage from '../pages/approval/ApprovalPage';


export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/first-login',
        element: (
          <ProtectedRoute>
            <FirstLoginPage />
          </ProtectedRoute>
        ),
      },
      { path: '/chatbot', element: <ChatbotPage /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/components', element: <CommonComponentsGuide /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '/attendance', element: <AttendancePage /> },
      { path: '/attendance/status', element: <AttendancePage /> },
      { path: '/mail', element: <MailPage /> },
      { path: '/mail/:mailbox', element: <MailPage /> },
      { path: '/approval', element: <ApprovalPage /> },
      { path: '/approval/:folder/:status', element: <ApprovalPage /> },
      { path: '/organization', element: <OrganizationPage /> },
      { path: '/organization/chart', element: <OrganizationPage /> },
      ...boardRoutes,
      ...meetingRoutes,
      ...driveRoutes,
      ...projectRoutes,
    ],
  },
  {
    element: (
      <ReservationProvider>
        <MainLayout />
      </ReservationProvider>
    ),
    children: [{ path: '/reservations', element: <ReservationPage /> }],
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
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // { path: '/dashboard', element: <DashboardPage /> },
    ],
  },
  {
    path: '/admin/*',
    element: (
      <ProtectedRoute>
        <AdminAccessGate />
      </ProtectedRoute>
    ),
  },
]);
