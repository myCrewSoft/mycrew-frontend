export type ProjectTaskStatusCode = '00' | '01' | '02' | '03' | '04'
export type ProjectTaskPriorityCode = '01' | '02' | '03'
export type ProjectTaskScopeCode = '01' | '02'
export type ProjectTaskTypeCode = '01' | '02' | '03' | '04' | '05'
export type ProjectTaskViewMode = 'list' | 'card'

export interface ProjectTask {
  taskId: number
  projId: number | null
  taskTypeCd: ProjectTaskTypeCode
  taskScopeCd: ProjectTaskScopeCode
  taskMngrId: number
  taskMngrName: string
  taskStatCd: ProjectTaskStatusCode
  taskPriorityCd: ProjectTaskPriorityCode
  taskNm: string
  taskCn: string
  taskBgngDt: string
  taskEndDt: string
  taskProgressRate: number
}
