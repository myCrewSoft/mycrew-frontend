import type { AuthState } from './authStore';
import ProtectedRoute from '../components/ProtectedRoute';

declare const auth: AuthState;

// Frontend authorization must not depend on JWT role claims.
// @ts-expect-error AuthState should not expose roles for route authorization.
export const forbiddenRoles = auth.roles;

type ProtectedRouteProps = Parameters<typeof ProtectedRoute>[0];

// Server-side authorization owns role decisions; routes only check login state.
export const protectedRouteProps: ProtectedRouteProps = {
  children: null,
  // @ts-expect-error ProtectedRoute should not accept a role prop.
  role: 'ROLE_ADMIN',
};
