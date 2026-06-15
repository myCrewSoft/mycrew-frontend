import type { TaskCreateRequest, TaskDetailResponse, TaskListResponse } from '../../../types'

export type ProjectTaskStatusCode = '00' | '01' | '02' | '03'
export type ProjectTaskPriorityCode = '01' | '02' | '03'
export type ProjectTaskTypeCode = '01' | '02' | '03' | '04' | '05'
export type ProjectTaskViewMode = 'list' | 'card'

export type ProjectTask = TaskListResponse
export type ProjectTaskDetail = TaskDetailResponse
export type ProjectTaskCreateForm = TaskCreateRequest
export type TaskCreateForm = TaskCreateRequest
