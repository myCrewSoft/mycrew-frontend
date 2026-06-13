export interface MyPageDepartment {
  deptCd?: string | null;
  prntDeptCd?: string | null;
  deptNm?: string | null;
  useYn?: string | null;
  frstRegDt?: string | null;
  frstRgtrId?: number | null;
  lastMdfcnDt?: string | null;
  lastMdfrId?: number | null;
}

export interface MyPageJobPosition {
  jobPstnCd?: string | null;
  jobPstnNm?: string | null;
  useYn?: string | null;
  frstRgtrId?: number | null;
  frstRegDt?: string | null;
  lastMdfrId?: number | null;
  lastMdfcnDt?: string | null;
}

export interface MyPageJobGrade {
  jobGrdCd?: string | null;
  jobGrdNm?: string | null;
  useYn?: string | null;
  frstRgtrId?: number | null;
  frstRegDt?: string | null;
  lastMdfrId?: number | null;
  lastMdfcnDt?: string | null;
}

export interface MyPageRole {
  roleId?: number | null;
  roleCd?: string | null;
  roleNm?: string | null;
  roleExpln?: string | null;
  frstRgtrId?: number | null;
  frstRegDt?: string | null;
  lastMdfrId?: number | null;
  lastMdfcnDt?: string | null;
}

export interface MyPageRoleAssignment {
  roleAssignId?: number | null;
  roleId?: number | null;
  empId?: number | null;
  scopeTypeCd?: string | null;
  scopeId?: string | null;
  enabled?: string | null;
  role?: MyPageRole | null;
}

export interface EmployeeMyPage {
  empId: number | null;
  empNm: string | null;
  emailAddr: string | null;
  prflImgFileId: number | null;
  genderCd: string | null;
  mblTelno: string | null;
  zip: string | null;
  addr: string | null;
  execYn: string | null;
  mbrStampFileId: number | null;
  jobDutyCn: string | null;
  roleAssignmentList: MyPageRoleAssignment[] | null;
  entcoYmd: string | null;
  department: MyPageDepartment | null;
  jobPosition: MyPageJobPosition | null;
  jobGrade: MyPageJobGrade | null;
}

export interface ChangeEmailRequest {
  emailAddr: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeJobDutyRequest {
  jobDutyCn: string;
}

export interface ChangeProfileInfoRequest {
  empNm: string;
  mblTelno?: string;
  zip?: string;
  addr?: string;
}
