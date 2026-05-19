import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { computeAuthState, clearAuthState, type AuthState } from '../store/authStore';

// ── Context 타입 ──────────────────────────────────────────────────

interface AuthContextValue {
  auth: AuthState;
  /** 토큰 갱신 완료 후 호출. axios 인터셉터에서 token-refreshed 이벤트로 트리거. */
  refreshAuth: () => void;
  /** 로그아웃 시 호출. 토큰 제거 + 상태 초기화. */
  clearAuth: () => void;
}

// ── Context 생성 ──────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────

/**
 * 앱 전체에 인증 상태를 제공하는 Provider.
 * main.tsx 에서 앱 최상단을 감싸야 한다.
 *
 * [설계 원칙]
 * computeAuthState() 를 useState lazy initializer 로 실행한다.
 * lazy initializer 는 마운트 시 딱 한 번만 호출되며,
 * React 렌더 함수 내부가 아닌 초기화 콜백으로 취급되어
 * Date.now() 호출이 React Compiler 경고를 발생시키지 않는다.
 *
 * [토큰 갱신 동기화]
 * axios 인터셉터가 토큰을 갱신하면 'token-refreshed' 이벤트를 발행한다.
 * AuthProvider 가 이 이벤트를 수신하여 auth 상태를 재계산한다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * computeAuthState 를 lazy initializer 로 전달한다.
   * () => computeAuthState() 가 아닌 computeAuthState 를 직접 전달해야
   * React 가 초기화 함수로 인식하여 한 번만 호출한다.
   */
  const [auth, setAuth] = useState<AuthState>(computeAuthState);

  /**
   * 토큰 갱신 완료 후 auth 상태를 재계산한다.
   * axios 인터셉터에서 'token-refreshed' 이벤트를 발행하면 자동으로 실행된다.
   */
  const refreshAuth = useCallback(() => {
    setAuth(computeAuthState());
  }, []);

  /**
   * 로그아웃 처리. localStorage 토큰 제거 + 상태 초기화.
   * 로그아웃 버튼 클릭 핸들러에서 직접 호출한다.
   */
  const clearAuth = useCallback(() => {
    setAuth(clearAuthState());
  }, []);

  /**
   * axios 인터셉터의 토큰 갱신 완료 이벤트를 수신한다.
   * 이벤트 방식을 사용하면 axios.ts 가 AuthContext 를 직접 import 하지 않아도 되어
   * 순환 의존성(Circular Dependency) 을 방지할 수 있다.
   */
  useEffect(() => {
    window.addEventListener('token-refreshed', refreshAuth);
    return () => {
      window.removeEventListener('token-refreshed', refreshAuth);
    };
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ auth, refreshAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom Hook ───────────────────────────────────────────────────

/**
 * 인증 상태와 관련 액션을 반환하는 커스텀 훅.
 * AuthProvider 내부에서만 사용 가능하다.
 *
 * @example
 * const { auth, clearAuth } = useAuth();
 * if (auth.isExpired) clearAuth();
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
