import {
  inferPermissionCategory,
  permissionCategoryOptions,
  type PermissionCategory,
} from './adminPermissionCategories.ts';
import type { PermissionResponse } from '../../types/admin';

const categoryValues = permissionCategoryOptions.map((category) => category.value);

export const requiredPermissionCategories: PermissionCategory[] = [
  'ALL',
  'ADMIN',
  'DEPT',
  'BOARD',
  'PROJECT',
  'TASK',
  'APPROVAL',
  'DRIVE',
  'SCHEDULE',
  'OTHER',
];

export const requiredPermissionCategoryLabels = categoryValues.includes('APPROVAL')
  && categoryValues.includes('DRIVE')
  && categoryValues.includes('SCHEDULE');

const createPermission = (
  permissionCode: string,
  permissionName: string,
  description: string | null = null,
): PermissionResponse => ({
  permissionId: 1,
  permissionCode,
  permissionName,
  description,
  enabled: 'Y',
});

const assertCategory = (
  actual: PermissionCategory,
  expected: PermissionCategory,
) => {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, received ${actual}`);
  }
};

export const approvalCategory: PermissionCategory = inferPermissionCategory(
  createPermission('APPROVAL_TEMPLATE_DELETE', '결재 양식 삭제'),
);
assertCategory(approvalCategory, 'APPROVAL');

export const driveCategory: PermissionCategory = inferPermissionCategory(
  createPermission('FILE_MANAGE', '공유 드라이브 관리', '드라이브 권한'),
);
assertCategory(driveCategory, 'DRIVE');

export const scheduleCategory: PermissionCategory = inferPermissionCategory(
  createPermission('CALENDAR_CREATE', '일정 등록'),
);
assertCategory(scheduleCategory, 'SCHEDULE');
