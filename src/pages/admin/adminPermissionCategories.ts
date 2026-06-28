import type { PermissionResponse } from '../../types/admin';

export type PermissionCategory =
  | 'ALL'
  | 'ADMIN'
  | 'DEPT'
  | 'BOARD'
  | 'PROJECT'
  | 'TASK'
  | 'APPROVAL'
  | 'DRIVE'
  | 'SCHEDULE'
  | 'OTHER';

export const permissionCategoryOptions: Array<{
  value: PermissionCategory;
  label: string;
}> = [
  { value: 'ALL', label: '전체' },
  { value: 'ADMIN', label: '관리자' },
  { value: 'DEPT', label: '부서' },
  { value: 'BOARD', label: '게시판' },
  { value: 'PROJECT', label: '프로젝트' },
  { value: 'TASK', label: '업무' },
  { value: 'APPROVAL', label: '결재' },
  { value: 'DRIVE', label: '드라이브' },
  { value: 'SCHEDULE', label: '일정' },
  { value: 'OTHER', label: '기타' },
];

type ConcretePermissionCategory = Exclude<PermissionCategory, 'ALL' | 'OTHER'>;

const permissionCategoryRules: Array<{
  value: ConcretePermissionCategory;
  prefixes: string[];
  keywords: string[];
}> = [
  {
    value: 'ADMIN',
    prefixes: ['ADMIN'],
    keywords: ['관리자', 'ADMIN'],
  },
  {
    value: 'DEPT',
    prefixes: ['DEPT', 'DEPARTMENT'],
    keywords: ['부서', 'DEPT', 'DEPARTMENT'],
  },
  {
    value: 'BOARD',
    prefixes: ['BOARD'],
    keywords: ['게시판', 'BOARD', 'NOTICE', 'POST'],
  },
  {
    value: 'PROJECT',
    prefixes: ['PROJECT', 'PROJ'],
    keywords: ['프로젝트', 'PROJECT', 'PROJ'],
  },
  {
    value: 'TASK',
    prefixes: ['TASK'],
    keywords: ['업무', 'TASK'],
  },
  {
    value: 'APPROVAL',
    prefixes: ['APPROVAL', 'APPR', 'DRAFT'],
    keywords: ['결재', '기안', '전자결재', 'APPROVAL', 'APPR', 'DRAFT'],
  },
  {
    value: 'DRIVE',
    prefixes: ['DRIVE'],
    keywords: ['드라이브', 'DRIVE'],
  },
  {
    value: 'SCHEDULE',
    prefixes: ['SCHEDULE', 'CALENDAR', 'SCHD'],
    keywords: ['일정', '캘린더', 'SCHEDULE', 'CALENDAR', 'SCHD'],
  },
];

export const inferPermissionCategory = (
  permission: PermissionResponse,
): PermissionCategory => {
  const code = permission.permissionCode.toUpperCase();
  const prefix = code.split('_')[0] ?? '';
  const prefixRule = permissionCategoryRules.find((rule) =>
    rule.prefixes.includes(prefix),
  );

  if (prefixRule) return prefixRule.value;

  const text = [
    code,
    permission.permissionName,
    permission.description ?? '',
  ]
    .join(' ')
    .toUpperCase();
  const keywordRule = permissionCategoryRules.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword.toUpperCase())),
  );

  return keywordRule?.value ?? 'OTHER';
};
