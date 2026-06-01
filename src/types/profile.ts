export interface ProfileDepartment {
  deptCd?: string | null;
  deptNm?: string | null;
}

export interface ProfileJobPosition {
  jobPstnCd?: string | null;
  jobPstnNm?: string | null;
}

export interface ProfileJobGrade {
  jobGrdCd?: string | null;
  jobGrdNm?: string | null;
}

export interface EmployeeProfile {
  empNm: string;
  prflImgFileId: number | null;
  department: ProfileDepartment | null;
  jobPosition: ProfileJobPosition | null;
  jobGrade: ProfileJobGrade | null;
}
