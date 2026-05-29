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

export interface AdminRoleAssignment {
  roleId?: number;
  roleName?: string;
  roleCd?: string;
  scopeTypeCd?: string;
  scopeId?: string;
}

export interface AdminMailAccount {
  mailAddr?: string | null;
  emlAddr?: string | null;
  email?: string | null;
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
