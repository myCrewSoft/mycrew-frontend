import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';
import MainLayout from '../components/layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import CommonComponentsGuide from '../pages/CommonComponentsGuide';
import LoginPage from '../pages/auth/LoginPage';
import CalendarPage from '../pages/calendar/CalendarPage';
import { CalendarProvider } from '../pages/calendar/CalendarProvider';
import { boardRoutes } from './routes/boardRoutes';
import ReservationPage from '../pages/Reservation/ReservationPage';
import { ReservationProvider } from '../pages/Reservation/ReservationContext';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: '/components', element: <CommonComponentsGuide /> },
      ...boardRoutes,
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
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // { path: '/admin', element: <AdminPage /> },
    ],
  },
]);
