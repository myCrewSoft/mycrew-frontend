// ── 타입 정의 ─────────────────────────────────────────────────────

export interface AuthState {
  payload: Record<string, unknown> | null; // 디코딩된 JWT payload
  isExpired: boolean;                      // 만료 여부
  roles: string[];                         // 권한 목록
}

// ── 유틸 함수 ─────────────────────────────────────────────────────

/**
 * JWT payload 를 안전하게 디코딩한다.
 *
 * [atob 을 직접 쓰지 않는 이유]
 * JWT 는 Base64URL 스키마를 사용한다. (+→- /→_ 치환, 패딩 없음)
 * 브라우저 내장 atob 은 표준 Base64 만 처리하므로
 * 패딩 복원과 UTF-8 변환을 직접 처리해야 한글 등이 깨지지 않는다.
 *
 * @returns 파싱된 payload 객체. 실패 시 null 반환
 */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded    = base64.padEnd(
      base64.length + (4 - (base64.length % 4)) % 4,
      '=',
    );
    const decoded = atob(padded);
    const json    = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── 핵심 함수 ─────────────────────────────────────────────────────

/**
 * localStorage 에서 토큰을 읽어 인증 상태를 계산한다.
 *
 * [React 밖에서 실행하는 이유]
 * React 렌더 단계에서 Date.now() 를 호출하면 React Compiler 가
 * "impure function during render" 경고를 발생시킨다.
 * 이 함수는 React 렌더 사이클 밖(모듈 초기화, useState lazy initializer, 이벤트 핸들러)
 * 에서만 호출되므로 Date.now() 를 자유롭게 사용할 수 있다.
 *
 * 호출 시점:
 *  - 앱 최초 마운트 시 (AuthProvider 의 useState lazy initializer)
 *  - 토큰 갱신 완료 후 (token-refreshed 이벤트 핸들러)
 *  - 로그아웃 후 (clearAuth 호출)
 */
export function computeAuthState(): AuthState {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return { payload: null, isExpired: false, roles: [] };
  }

  const payload = decodePayload(token);

  if (!payload) {
    return { payload: null, isExpired: false, roles: [] };
  }

  // Date.now() 를 React 렌더 밖에서 호출 → React Compiler 경고 없음
  const isExpired = typeof payload.exp === 'number'
    && payload.exp * 1000 < Date.now();

  const roles = Array.isArray(payload.roles)
    ? (payload.roles as string[])
    : [];

  return { payload, isExpired, roles };
}

/**
 * 로그아웃 시 localStorage 에서 토큰을 제거하고 초기 상태를 반환한다.
 * AuthContext 의 clearAuth 에서 호출한다.
 */
export function clearAuthState(): AuthState {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  return { payload: null, isExpired: false, roles: [] };
}