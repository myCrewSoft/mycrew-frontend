import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  role?: string;
}

export default function ProtectedRoute({ children, role }: Props) {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  if (role) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.roles?.includes(role)) return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
