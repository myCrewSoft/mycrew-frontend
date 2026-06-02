export interface AdminAccessResponse {
  empId: number;
  adminAccessible: boolean;
}

export type RoleScopeType = 'GLOBAL' | 'DEPT' | 'PROJECT' | 'TASK' | 'SELF';

export interface PermissionResponse {
  permissionId: number;
  permissionCode: string;
  permissionName: string;
  description: string | null;
  enabled: 'Y' | 'N';
}

export interface RoleListResponse {
  roleId: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  permissionCount: number;
  assignedEmployeeCount: number;
}

export interface RoleEmployeeResponse {
  roleAssignmentId: number;
  empId: number;
  employeeName: string;
  deptCd: string | null;
  deptName: string | null;
  scopeTypeCd: RoleScopeType;
  scopeId: string | null;
  enabled: 'Y' | 'N';
}

export interface RoleDetailResponse {
  roleId: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  permissions: PermissionResponse[];
  employees: RoleEmployeeResponse[];
}

export interface RoleCreateRequest {
  roleCode: string;
  roleName: string;
  description?: string | null;
  permissionIds: number[];
}

export interface RoleUpdateRequest {
  roleName: string;
  description?: string | null;
  permissionIds: number[];
}

export interface RoleDeleteRequest {
  replacementRoleId?: number | null;
}

export interface RoleAssignRequest {
  empIds: number[];
  scopeTypeCd: RoleScopeType;
  scopeId?: string | null;
}

export interface RoleRevokeRequest {
  empIds: number[];
  scopeTypeCd?: RoleScopeType | null;
  scopeId?: string | null;
}
