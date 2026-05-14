/** JWT Access Token 에서 payload 를 파싱한다. */
export function parseToken(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** 저장된 Access Token 의 만료 여부를 확인한다. */
export function isTokenExpired(token: string): boolean {
  const payload = parseToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

/** 저장된 Access Token 에서 roles 를 반환한다. */
export function getRoles(token: string): string[] {
  const payload = parseToken(token);
  return payload?.roles ?? [];
}
