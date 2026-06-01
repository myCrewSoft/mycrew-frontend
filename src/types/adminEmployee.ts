export interface AdminEmployeeSearchParams {
  keyword?: string;
  deptCd?: string;
  empStatCd?: string;
  jobGrdCd?: string;
  jobPstnCd?: string;
  execYn?: string;
  enabled?: string;
  page?: number;
  size?: number;
}

export type AdminEmployeeStatusCode =
  | 'EMP_INITIAL'
  | 'EMP_ACTIVE'
  | 'EMP_INACTIVE'
  | 'EMP_RETIRED'
  | 'EMP_VACATION'
  | 'EMP_LOGIN'
  | 'EMP_LOGOUT';

export interface AdminEmployeeStatusOption {
  code: AdminEmployeeStatusCode;
  label: string;
}

export const adminEmployeeStatusOptions: AdminEmployeeStatusOption[] = [
  { code: 'EMP_INITIAL', label: '계정 등록 단계' },
  { code: 'EMP_ACTIVE', label: '정상 재직' },
  { code: 'EMP_INACTIVE', label: '비활성' },
  { code: 'EMP_RETIRED', label: '퇴사' },
  { code: 'EMP_VACATION', label: '휴가' },
  { code: 'EMP_LOGIN', label: '출근' },
  { code: 'EMP_LOGOUT', label: '퇴근' },
];

export interface AdminEmployeeStatusUpdateRequest {
  empStatCd: AdminEmployeeStatusCode;
}

export interface AdminRole {
  roleId?: number;
  roleCd?: string | null;
  roleNm?: string | null;
  roleExpln?: string | null;
}

export interface AdminRoleAssignment {
  roleAssignId?: number;
  roleId?: number;
  empId?: number;
  roleName?: string;
  roleCd?: string;
  scopeTypeCd?: string;
  scopeId?: string;
  enabled?: string | null;
  role?: AdminRole | null;
}

export interface AdminMailAccount {
  emailAddr?: string | null;
  mailAddr?: string | null;
  emlAddr?: string | null;
  email?: string | null;
  providerCd?: string | null;
  tokenStatusCd?: string | null;
  useYn?: string | null;
}

export interface AdminDepartment {
  deptCd: string;
  prntDeptCd?: string | null;
  deptNm: string;
  useYn?: string | null;
}

export interface AdminJobPosition {
  jobPstnCd: string;
  jobPstnNm: string;
  useYn?: string | null;
}

export interface AdminJobGrade {
  jobGrdCd: string;
  jobGrdNm: string;
  useYn?: string | null;
}

export interface AdminEmpStat {
  empStatCd: string;
  empStatNm: string;
  empStatExpln?: string | null;
}

export interface AdminEmployeeListItem {
  empId: number;
  deptCd: string | null;
  jobPstnCd: string | null;
  jobGrdCd: string | null;
  empStatCd: string | null;
  jobDutyCn: string | null;
  empNm: string;
  genderCd: string | null;
  mblTelno: string | null;
  zip: string | null;
  addr: string | null;
  prflImgFileId: number | null;
  execYn: string | null;
  entcoYmd: string | null;
  retcoYmd: string | null;
  frstRegDt: string | null;
  lastMdfcnDt: string | null;
  enabled: string | null;
  department: AdminDepartment | null;
  jobPosition: AdminJobPosition | null;
  jobGrade: AdminJobGrade | null;
  empStat: AdminEmpStat | null;
  roleAssignmentList: AdminRoleAssignment[] | null;
}

export interface AdminEmployeeDetail {
  empId: number;
  jobDutyCn: string | null;
  empNm: string;
  genderCd: string | null;
  mblTelno: string | null;
  zip: string | null;
  addr: string | null;
  prflImgFileId: number | null;
  execYn: string | null;
  entcoYmd: string | null;
  retcoYmd: string | null;
  frstRegDt: string | null;
  lastMdfcnDt: string | null;
  enabled: string | null;
  mbrStampFileId: number | null;
  department: AdminDepartment | null;
  jobPosition: AdminJobPosition | null;
  jobGrade: AdminJobGrade | null;
  empStat: AdminEmpStat | null;
  roleAssignmentList: AdminRoleAssignment[] | null;
  mailAccountList: AdminMailAccount[] | null;
}

export interface AdminEmployeeRegisterRequest {
  empId: number;
  empNm: string;
  rrno: string;
  genderCd: string;
  mblTelno: string;
  zip: string;
  addr: string;
  entcoYmd: string;
}
