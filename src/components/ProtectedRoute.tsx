import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { auth } = useAuth();

  if (!auth.payload) {
    return <Navigate to="/login" replace />;
  }

  if (auth.isExpired) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return <>{children}</>;
}
