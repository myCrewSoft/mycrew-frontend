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
  scopeTypeCd?: string;
  scopeId?: string;
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
  roleAssignmentList: AdminRoleAssignment[] | null;
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
