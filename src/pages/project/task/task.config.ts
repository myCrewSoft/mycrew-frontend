import type {
  ProjectTaskPriorityCode,
  ProjectTaskScopeCode,
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
    label: '미착수',
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
    label: '일시중지',
    dot: 'bg-amber-500',
    badge: '!border-amber-200 !bg-amber-100 !text-amber-700',
    bar: 'bg-amber-500',
  },
  '04': {
    label: '폐기',
    dot: 'bg-red-500',
    badge: '!border-red-200 !bg-red-100 !text-red-700',
    bar: 'bg-red-500',
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

export const taskScopeConfig: Record<ProjectTaskScopeCode, { label: string; badge: string }> = {
  '01': { label: '프로젝트', badge: '!border-blue-200 !bg-blue-50 !text-blue-600' },
  '02': { label: '개인', badge: '!border-violet-200 !bg-violet-50 !text-violet-600' },
}

export const taskTypeConfig: Record<ProjectTaskTypeCode, { label: string; badge: string }> = {
  '01': { label: '일반 업무', badge: '!border-slate-200 !bg-slate-100 !text-slate-600' },
  '02': { label: '테스트', badge: '!border-sky-200 !bg-sky-50 !text-sky-600' },
  '03': { label: '문서 작성', badge: '!border-emerald-200 !bg-emerald-50 !text-emerald-600' },
  '04': { label: '회의', badge: '!border-amber-200 !bg-amber-50 !text-amber-600' },
  '05': { label: '보고', badge: '!border-rose-200 !bg-rose-50 !text-rose-600' },
}

export const taskColumns: ProjectTaskStatusCode[] = ['00', '01', '03', '02']
