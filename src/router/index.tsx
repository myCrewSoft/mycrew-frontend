import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';
import MainLayout from '../components/layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// TODO: 페이지 import 추가
// import LoginPage from '../pages/auth/LoginPage';

export const router = createBrowserRouter([
  // 인증 불필요
  {
    element: <AuthLayout />,
    children: [
      // { path: '/login',  element: <LoginPage /> },
      // { path: '/signup', element: <SignupPage /> },
    ],
  },

  // 로그인 필요
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      // { path: '/', element: <MainPage /> },
    ],
  },

  // 관리자 전용
  {
    element: <ProtectedRoute role="ROLE_ADMIN"><MainLayout /></ProtectedRoute>,
    children: [
      // { path: '/admin', element: <AdminPage /> },
    ],
  },
]);
