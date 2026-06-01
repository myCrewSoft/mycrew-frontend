export interface AuthState {
  payload: Record<string, unknown> | null;
  isExpired: boolean;
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + (4 - (base64.length % 4)) % 4,
      '=',
    );
    const decoded = atob(padded);
    const json = decodeURIComponent(
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

export function computeAuthState(): AuthState {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return { payload: null, isExpired: false };
  }

  const payload = decodePayload(token);

  if (!payload) {
    return { payload: null, isExpired: false };
  }

  const isExpired = typeof payload.exp === 'number'
    && payload.exp * 1000 < Date.now();

  return { payload, isExpired };
}

export function clearAuthState(): AuthState {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('empId');
  localStorage.removeItem('authVersion');
  localStorage.removeItem('firstLoginRequired');
  return { payload: null, isExpired: false };
}
