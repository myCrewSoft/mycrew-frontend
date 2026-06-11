import type {
  ProjectTaskPriorityCode,
  ProjectTaskStatusCode,
  ProjectTaskTypeCode,
} from './task.types'

export const taskStatusConfig: Record<
  ProjectTaskStatusCode,
  {
    label: string
    dot: string
    badge: string
    bar: string
  }
> = {
  '00': {
    label: '해야 할 일',
    dot: 'bg-slate-400',
    badge: '!border-slate-200 !bg-slate-100 !text-slate-600',
    bar: 'bg-slate-300',
  },
  '01': {
    label: '진행 중',
    dot: 'bg-blue-500',
    badge: '!border-blue-600 !bg-blue-600 !text-white',
    bar: 'bg-blue-500',
  },
  '02': {
    label: '완료',
    dot: 'bg-emerald-500',
    badge: '!border-emerald-200 !bg-emerald-100 !text-emerald-700',
    bar: 'bg-emerald-500',
  },
  '03': {
    label: '중단',
    dot: 'bg-amber-500',
    badge: '!border-amber-200 !bg-amber-100 !text-amber-700',
    bar: 'bg-amber-500',
  },
}

export const taskPriorityConfig: Record<
  ProjectTaskPriorityCode,
  { label: string; dot: string; badge: string }
> = {
  '01': { label: '높음', dot: 'bg-red-500', badge: '!border-red-200 !bg-red-50 !text-red-600' },
  '02': { label: '중간', dot: 'bg-amber-500', badge: '!border-amber-200 !bg-amber-50 !text-amber-600' },
  '03': { label: '낮음', dot: 'bg-slate-400', badge: '!border-slate-200 !bg-slate-100 !text-slate-600' },
}

export const taskTypeConfig: Record<ProjectTaskTypeCode, { label: string; badge: string }> = {
  '01': { label: '일반 업무', badge: '!border-slate-200 !bg-slate-100 !text-slate-600' },
  '02': { label: '테스트', badge: '!border-sky-200 !bg-sky-50 !text-sky-600' },
  '03': { label: '문서 작성', badge: '!border-emerald-200 !bg-emerald-50 !text-emerald-600' },
  '04': { label: '회의', badge: '!border-amber-200 !bg-amber-50 !text-amber-600' },
  '05': { label: '보고', badge: '!border-rose-200 !bg-rose-50 !text-rose-600' },
}

export const taskColumns: ProjectTaskStatusCode[] = ['00', '01', '03', '02']

export const getTaskStatusConfig = (status: string) =>
  taskStatusConfig[status as ProjectTaskStatusCode] ?? {
    label: status,
    dot: 'bg-slate-300',
    badge: '!border-slate-200 !bg-white !text-slate-500',
    bar: 'bg-slate-300',
  }

export const getTaskPriorityConfig = (priority: string) =>
  taskPriorityConfig[priority as ProjectTaskPriorityCode] ?? {
    label: priority,
    dot: 'bg-slate-300',
    badge: '!border-slate-200 !bg-white !text-slate-500',
  }

export const getTaskTypeConfig = (typeCd: string) =>
  taskTypeConfig[typeCd as ProjectTaskTypeCode] ?? {
    label: typeCd,
    badge: '!border-slate-200 !bg-white !text-slate-500',
  }
