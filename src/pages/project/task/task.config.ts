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
    icon: string
    bar: string
  }
> = {
  '00': {
    label: '해야 할 일',
    dot: 'bg-slate-400',
    badge: '!border-slate-200 !bg-gradient-to-r !from-slate-50 !to-slate-100 !text-slate-700 shadow-sm shadow-slate-100',
    icon: 'bg-slate-200 text-slate-600',
    bar: 'bg-slate-300',
  },
  '01': {
    label: '진행 중',
    dot: 'bg-blue-500',
    badge: '!border-blue-200 !bg-gradient-to-r !from-blue-50 !to-indigo-50 !text-blue-700 shadow-sm shadow-blue-100',
    icon: 'bg-blue-600 text-white',
    bar: 'bg-blue-500',
  },
  '02': {
    label: '완료',
    dot: 'bg-emerald-500',
    badge: '!border-emerald-200 !bg-gradient-to-r !from-emerald-50 !to-teal-50 !text-emerald-700 shadow-sm shadow-emerald-100',
    icon: 'bg-emerald-500 text-white',
    bar: 'bg-emerald-500',
  },
  '03': {
    label: '중단',
    dot: 'bg-amber-500',
    badge: '!border-amber-200 !bg-gradient-to-r !from-amber-50 !to-orange-50 !text-amber-700 shadow-sm shadow-amber-100',
    icon: 'bg-amber-500 text-white',
    bar: 'bg-amber-500',
  },
  '04': {
    label: '폐기',
    dot: 'bg-rose-500',
    badge: '!border-rose-200 !bg-gradient-to-r !from-rose-50 !to-red-50 !text-rose-700 shadow-sm shadow-rose-100',
    icon: 'bg-rose-500 text-white',
    bar: 'bg-rose-500',
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

export const taskTypeConfig: Record<
  ProjectTaskTypeCode,
  { label: string; badge: string; icon: string }
> = {
  '01': {
    label: '일반 업무',
    badge: '!border-slate-200 !bg-white !text-slate-700 shadow-sm shadow-slate-100',
    icon: 'bg-slate-100 text-slate-600',
  },
  '02': {
    label: '테스트',
    badge: '!border-sky-200 !bg-sky-50/70 !text-sky-700 shadow-sm shadow-sky-100',
    icon: 'bg-sky-100 text-sky-600',
  },
  '03': {
    label: '문서 작성',
    badge: '!border-violet-200 !bg-violet-50/70 !text-violet-700 shadow-sm shadow-violet-100',
    icon: 'bg-violet-100 text-violet-600',
  },
  '04': {
    label: '회의',
    badge: '!border-amber-200 !bg-amber-50/70 !text-amber-700 shadow-sm shadow-amber-100',
    icon: 'bg-amber-100 text-amber-600',
  },
  '05': {
    label: '보고',
    badge: '!border-rose-200 !bg-rose-50/70 !text-rose-700 shadow-sm shadow-rose-100',
    icon: 'bg-rose-100 text-rose-600',
  },
}

export const taskColumns: ProjectTaskStatusCode[] = ['00', '01', '03', '02', '04']

export const getTaskStatusConfig = (status: string) =>
  taskStatusConfig[status as ProjectTaskStatusCode] ?? {
    label: status,
    dot: 'bg-slate-300',
    badge: '!border-slate-200 !bg-white !text-slate-500',
    icon: 'bg-slate-100 text-slate-500',
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
    icon: 'bg-slate-100 text-slate-500',
  }
