import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

interface Props {
  children: React.ReactNode;
  /** 접근에 필요한 역할. 미지정 시 로그인 여부만 확인한다. */
  role?: string;
}

/**
 * 인증/권한이 필요한 라우트를 보호하는 컴포넌트.
 *
 * [설계 원칙]
 * 모든 인증 상태 계산(토큰 파싱, 만료 체크, 권한 추출)은
 * AuthContext 초기화 시 React 렌더 사이클 밖에서 완료된다.
 * 이 컴포넌트는 계산된 결과를 읽기만 하므로
 *   - Date.now() 렌더 중 호출 없음  → React Compiler 경고 없음
 *   - isExpired 초기값 null 없음     → 깜빡임(Flicker) 없음
 *   - 이중 렌더 없음                 → 성능 낭비 없음
 *   - 첫 렌더에서 즉시 판단          → children API 호출 원천 차단
 *
 * [검사 순서]
 * 1. 토큰(payload) 없음 → /login
 * 2. 토큰 만료          → /login?expired=true
 * 3. 권한 없음          → /unauthorized
 * 4. 통과               → children 렌더
 */
export default function ProtectedRoute({ children, role }: Props) {
  const { auth } = useAuth();

  // 1. 토큰 없음 또는 파싱 실패
  if (!auth.payload) {
    return <Navigate to="/login" replace />;
  }

  // 2. 토큰 만료
  if (auth.isExpired) {
    return <Navigate to="/login?expired=true" replace />;
  }

  // 3. 권한 체크
  if (role && !auth.roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. 통과 — 단 1회 렌더로 부드럽게 진입
  return <>{children}</>;
}
