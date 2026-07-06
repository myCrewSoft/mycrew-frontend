import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { auth } = useAuth();
  const location = useLocation();
  const hasRefreshToken = Boolean(localStorage.getItem('refreshToken'));
  const firstLoginRequired =
    localStorage.getItem('firstLoginRequired') === 'true';

  if (!auth.payload && !hasRefreshToken) {
    return <Navigate to="/login" replace />;
  }

  if (auth.isExpired && !hasRefreshToken) {
    return <Navigate to="/login?expired=true" replace />;
  }

  if (firstLoginRequired && location.pathname !== '/first-login') {
    return <Navigate to="/first-login" replace />;
  }

  return <>{children}</>;
}
