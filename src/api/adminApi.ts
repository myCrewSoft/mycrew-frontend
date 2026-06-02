import type { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import type { ApiResponse } from './axiosInstance';
import type {
  AdminAccessResponse,
  PermissionResponse,
  PermissionStatusUpdateRequest,
  RoleAssignRequest,
  RoleCreateRequest,
  RoleDeleteRequest,
  RoleDetailResponse,
  RoleListResponse,
  RoleRevokeRequest,
  RoleUpdateRequest,
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
};
