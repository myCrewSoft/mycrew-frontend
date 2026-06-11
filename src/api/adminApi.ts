import type { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type {
  AdminAccessResponse,
  AdminDepartmentMemberResponseDTO,
  AdminDepartmentResponseDTO,
  DepartmentCreateRequestDTO,
  DepartmentDeleteRequestDTO,
  DepartmentMemberAssignRequestDTO,
  DepartmentMemberMutationResponseDTO,
  DepartmentMemberTransferRequestDTO,
  DepartmentUpdateRequestDTO,
  PermissionResponse,
  PermissionStatusUpdateRequest,
  RankAssignRequest,
  RankCreateRequest,
  RankDeleteRequest,
  RankResponse,
  RankRevokeRequest,
  RankUpdateRequest,
  RoleAssignRequest,
  RoleCreateRequest,
  RoleDeleteRequest,
  RoleDetailResponse,
  RoleListResponse,
  RoleRevokeRequest,
  RoleUpdateRequest,
  ScopeOptionResponse,
} from '../types/admin';
import type {
  AdminEmployeeDetail,
  AdminEmployeeListItem,
  AdminEmployeeRegisterRequest,
  AdminEmployeeSearchParams,
  AdminEmployeeStatusUpdateRequest,
} from '../types/adminEmployee';

export const adminApi = {
  getAccess: (): Promise<AxiosResponse<ApiResponse<AdminAccessResponse>>> => {
    return axiosInstance.get('/api/admin/access');
  },
  getEmployees: (
    params: AdminEmployeeSearchParams = {},
  ): Promise<AxiosResponse<ApiResponse<AdminEmployeeListItem[]>>> => {
    return axiosInstance.get('/api/admin/members', { params });
  },
  registerEmployee: (
    request: AdminEmployeeRegisterRequest,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.post('/api/admin/members', request);
  },
  getEmployeeDetail: (
    empId: number,
  ): Promise<AxiosResponse<ApiResponse<AdminEmployeeDetail>>> => {
    return axiosInstance.get(`/api/admin/members/${empId}`);
  },
  updateEmployeeStatus: (
    empId: number,
    request: AdminEmployeeStatusUpdateRequest,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.put(`/api/admin/members/${empId}/status`, request);
  },
  getPermissions: (): Promise<
    AxiosResponse<ApiResponse<PermissionResponse[]>>
  > => {
    return axiosInstance.get('/api/admin/permissions');
  },
  updatePermissionStatus: (
    permissionId: number,
    request: PermissionStatusUpdateRequest,
  ): Promise<AxiosResponse<ApiResponse<PermissionResponse>>> => {
    return axiosInstance.put(
      `/api/admin/permissions/${permissionId}/status`,
      request,
    );
  },
  getDepartmentScopeOptions: (): Promise<
    AxiosResponse<ApiResponse<ScopeOptionResponse[]>>
  > => {
    return axiosInstance.get('/api/admin/departments/scope-options');
  },
  getProjectScopeOptions: (): Promise<
    AxiosResponse<ApiResponse<ScopeOptionResponse[]>>
  > => {
    return axiosInstance.get('/api/admin/projects/scope-options');
  },
  getTaskScopeOptions: (): Promise<
    AxiosResponse<ApiResponse<ScopeOptionResponse[]>>
  > => {
    return axiosInstance.get('/api/admin/tasks/scope-options');
  },
  getRoles: (): Promise<AxiosResponse<ApiResponse<RoleListResponse[]>>> => {
    return axiosInstance.get('/api/admin/roles');
  },
  getRoleDetail: (
    roleId: number,
  ): Promise<AxiosResponse<ApiResponse<RoleDetailResponse>>> => {
    return axiosInstance.get(`/api/admin/roles/${roleId}`);
  },
  createRole: (
    request: RoleCreateRequest,
  ): Promise<AxiosResponse<ApiResponse<RoleDetailResponse>>> => {
    return axiosInstance.post('/api/admin/roles', request);
  },
  updateRole: (
    roleId: number,
    request: RoleUpdateRequest,
  ): Promise<AxiosResponse<ApiResponse<RoleDetailResponse>>> => {
    return axiosInstance.put(`/api/admin/roles/${roleId}`, request);
  },
  deleteRole: (
    roleId: number,
    request: RoleDeleteRequest,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.delete(`/api/admin/roles/${roleId}`, {
      data: request,
    });
  },
  assignRole: (
    roleId: number,
    request: RoleAssignRequest,
  ): Promise<AxiosResponse<ApiResponse<RoleDetailResponse>>> => {
    return axiosInstance.post(`/api/admin/roles/${roleId}/assignments`, request);
  },
  revokeRole: (
    roleId: number,
    request: RoleRevokeRequest,
  ): Promise<AxiosResponse<ApiResponse<RoleDetailResponse>>> => {
    return axiosInstance.delete(`/api/admin/roles/${roleId}/assignments`, {
      data: request,
    });
  },
  getRanks: (): Promise<AxiosResponse<ApiResponse<RankResponse[]>>> => {
    return axiosInstance.get('/api/admin/ranks');
  },
  createRank: (
    request: RankCreateRequest,
  ): Promise<AxiosResponse<ApiResponse<RankResponse>>> => {
    return axiosInstance.post('/api/admin/ranks', request);
  },
  updateRank: (
    rankId: string,
    request: RankUpdateRequest,
  ): Promise<AxiosResponse<ApiResponse<RankResponse>>> => {
    return axiosInstance.put(`/api/admin/ranks/${rankId}`, request);
  },
  deleteRank: (
    rankId: string,
    request: RankDeleteRequest,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.delete(`/api/admin/ranks/${rankId}`, {
      data: request,
    });
  },
  assignRank: (
    rankId: string,
    request: RankAssignRequest,
  ): Promise<AxiosResponse<ApiResponse<RankResponse>>> => {
    return axiosInstance.post(
      `/api/admin/ranks/${rankId}/assignments`,
      request,
    );
  },
  revokeRank: (
    rankId: string,
    request: RankRevokeRequest,
  ): Promise<AxiosResponse<ApiResponse<RankResponse>>> => {
    return axiosInstance.delete(`/api/admin/ranks/${rankId}/assignments`, {
      data: request,
    });
  },
  getDepartments: (): Promise<
    AxiosResponse<ApiResponse<AdminDepartmentResponseDTO[]>>
  > => {
    return axiosInstance.get('/api/admin/departments');
  },
  getDepartmentDetail: (
    deptCd: string,
  ): Promise<AxiosResponse<ApiResponse<AdminDepartmentResponseDTO>>> => {
    return axiosInstance.get(
      `/api/admin/departments/${encodeURIComponent(deptCd)}`,
    );
  },
  createDepartment: (
    request: DepartmentCreateRequestDTO,
  ): Promise<AxiosResponse<ApiResponse<AdminDepartmentResponseDTO>>> => {
    return axiosInstance.post('/api/admin/departments', request);
  },
  updateDepartment: (
    deptCd: string,
    request: DepartmentUpdateRequestDTO,
  ): Promise<AxiosResponse<ApiResponse<AdminDepartmentResponseDTO>>> => {
    return axiosInstance.put(
      `/api/admin/departments/${encodeURIComponent(deptCd)}`,
      request,
    );
  },
  deleteDepartment: (
    deptCd: string,
    request?: DepartmentDeleteRequestDTO | null,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.delete(
      `/api/admin/departments/${encodeURIComponent(deptCd)}`,
      request ? { data: request } : undefined,
    );
  },
  getDepartmentMembers: (
    deptCd: string,
  ): Promise<AxiosResponse<ApiResponse<AdminDepartmentMemberResponseDTO[]>>> => {
    return axiosInstance.get(
      `/api/admin/departments/${encodeURIComponent(deptCd)}/members`,
    );
  },
  assignDepartmentMembers: (
    deptCd: string,
    request: DepartmentMemberAssignRequestDTO,
  ): Promise<AxiosResponse<ApiResponse<DepartmentMemberMutationResponseDTO>>> => {
    return axiosInstance.post(
      `/api/admin/departments/${encodeURIComponent(deptCd)}/members`,
      request,
    );
  },
  transferDepartmentMembers: (
    deptCd: string,
    request: DepartmentMemberTransferRequestDTO,
  ): Promise<AxiosResponse<ApiResponse<DepartmentMemberMutationResponseDTO>>> => {
    return axiosInstance.put(
      `/api/admin/departments/${encodeURIComponent(deptCd)}/members/transfer`,
      request,
    );
  },
};
