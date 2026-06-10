import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  TaskCreateRequest,
  TaskDetailResponse,
  TaskListResponse,
  TaskUpdateRequest,
} from '../types'

export const taskApi = {
  getProjectTasks: (
    projId: string | number,
  ): Promise<AxiosResponse<ApiResponse<TaskListResponse[]>>> => {
    return axiosInstance.get(`/api/projects/${projId}/tasks`)
  },

  getProjectTaskDetail: (
    projId: string | number,
    taskId: string | number,
  ): Promise<AxiosResponse<ApiResponse<TaskDetailResponse>>> => {
    return axiosInstance.get(`/api/projects/${projId}/tasks/${taskId}`)
  },

  createProjectTask: (
    projId: string | number,
    request: TaskCreateRequest,
  ): Promise<AxiosResponse<ApiResponse<number>>> => {
    return axiosInstance.post(`/api/projects/${projId}/tasks`, request)
  },

  updateProjectTask: (
    projId: string | number,
    taskId: string | number,
    request: TaskUpdateRequest,
  ): Promise<AxiosResponse<ApiResponse<void>>> => {
    return axiosInstance.put(`/api/projects/${projId}/tasks/${taskId}`, request)
  },

  deleteProjectTask: (
    projId: string | number,
    taskId: string | number,
  ): Promise<AxiosResponse<ApiResponse<string>>> => {
    return axiosInstance.delete(`/api/projects/${projId}/tasks/${taskId}`)
  },
}
