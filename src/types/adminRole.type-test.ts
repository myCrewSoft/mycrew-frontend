import { adminApi } from '../api/adminApi';
import type {
  PermissionStatusUpdateRequest,
  RoleAssignRequest,
  RoleCreateRequest,
  RoleDeleteRequest,
  RoleRevokeRequest,
  ScopeOptionResponse,
  RoleUpdateRequest,
} from './admin';

export const roleCreateRequest: RoleCreateRequest = {
  roleCode: 'ROLE_MANAGER',
  roleName: '관리자',
  description: null,
  permissionIds: [1, 2],
};

export const roleUpdateRequest: RoleUpdateRequest = {
  roleName: '관리자',
  description: null,
  permissionIds: [1],
};

export const invalidRoleUpdateRequest: RoleUpdateRequest = {
  // @ts-expect-error roleCode must only be sent when creating a role.
  roleCode: 'ROLE_MANAGER',
  roleName: '관리자',
  permissionIds: [1],
};

export const roleDeleteRequest: RoleDeleteRequest = {
  replacementRoleId: null,
};

export const roleAssignRequest: RoleAssignRequest = {
  empIds: [1001, 1002],
  scopeTypeCd: 'GLOBAL',
  scopeId: null,
};

export const roleRevokeRequest: RoleRevokeRequest = {
  empIds: [1001],
  scopeTypeCd: 'DEPT',
  scopeId: 'DEV',
};

export const permissionStatusUpdateRequest: PermissionStatusUpdateRequest = {
  enabled: 'N',
};

export const departmentScopeOption: ScopeOptionResponse = {
  scopeId: 'D001',
  scopeCode: 'D001',
  scopeName: '개발팀',
  label: 'D001 - 개발팀',
};

export const roleApiCalls = [
  adminApi.getPermissions(),
  adminApi.updatePermissionStatus(1, permissionStatusUpdateRequest),
  adminApi.getDepartmentScopeOptions(),
  adminApi.getProjectScopeOptions(),
  adminApi.getTaskScopeOptions(),
  adminApi.getRoles(),
  adminApi.getRoleDetail(1),
  adminApi.createRole(roleCreateRequest),
  adminApi.updateRole(1, roleUpdateRequest),
  adminApi.deleteRole(1, roleDeleteRequest),
  adminApi.assignRole(1, roleAssignRequest),
  adminApi.revokeRole(1, roleRevokeRequest),
];
