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

export interface PermissionStatusUpdateRequest {
  enabled: 'Y' | 'N';
}

export interface ScopeOptionResponse {
  scopeId: string;
  scopeCode: string;
  scopeName: string;
  label: string;
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
  prflImgFileId: number | null;
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

export interface RankResponse {
  rankId: string;
  rankName: string;
  sortOrder: number;
  enabled: 'Y' | 'N';
  assignedEmployeeCount?: number;
}

export interface RankCreateRequest {
  rankId: string;
  rankName: string;
  sortOrder: number;
}

export interface RankUpdateRequest {
  rankName: string;
  sortOrder: number;
  enabled?: 'Y' | 'N';
}

export interface RankDeleteRequest {
  replacementRankId?: string | null;
}

export interface RankAssignRequest {
  empIds: number[];
}

export interface RankRevokeRequest {
  empIds: number[];
}

export interface AdminDepartmentResponseDTO {
  deptCd: string;
  deptNm: string;
  parentDeptCd: string | null;
  parentDeptNm: string | null;
  useYn: string;
  memberCount: number;
}

export interface DepartmentCreateRequestDTO {
  parentDeptCd?: string | null;
  deptNm: string;
}

export interface DepartmentUpdateRequestDTO {
  parentDeptCd?: string | null;
  deptNm: string;
}

export interface DepartmentDeleteRequestDTO {
  replacementDeptCd?: string | null;
}

export interface AdminDepartmentMemberResponseDTO {
  empId: number;
  empNm: string;
  prflImgFileId: number | null;
  deptCd: string;
  deptNm: string;
  jobGrdCd: string | null;
  jobGrdNm: string | null;
  jobPstnCd: string | null;
  jobPstnNm: string | null;
  empStatCd: string | null;
  empStatNm: string | null;
}

export interface DepartmentMemberAssignRequestDTO {
  empIds: number[];
}

export interface DepartmentMemberTransferRequestDTO {
  targetDeptCd: string;
  empIds: number[];
}

export interface DepartmentMemberMutationResponseDTO {
  sourceDeptCd: string | null;
  targetDeptCd: string;
  affectedEmployeeCount: number;
}
