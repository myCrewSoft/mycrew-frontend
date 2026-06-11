export interface ProjectListResponseDto {
    projId : number,
    projNm : string,
    projBgngYmd : string,
    projEndYmd : string,
    projStatCd : string,
    projLdrNm : string,
    projPrgrsRt : number
}

export interface ProjectCreateRequestDto {
    projNm : string,
    projCn? : string,
    projBgngYmd : string,
    projEndYmd : string,
    projMemberList : {empId : number}[],
}

//상세 조회
export interface ProjectMemberResponseDto {
  empId: number
  empNm: string
  deptNm: string
  joinDt: string
}

export interface ProjectDetailResponseDto {
    projId: number
    projNm: string
    projCn: string
    projBgngYmd: string
    projEndYmd: string
    projStatCd: string       // 01:예정 02:진행중 03:중단 04:완료
    projLdrNm: string
    projLdrEmpId: number
    projCreatDt: string
    projMdfcnDt: string
    projPrgrsRt: number
    projMemberList: ProjectMemberResponseDto[]
}

//프로젝트 수정
export interface ProjectUpdateRequestDto {
    projNm : string
    projCn : string
    projBgngYmd ?: string
    projEndYmd ?: string
    projStatCd ?: string
}

//프로젝트 참여자 추가
export interface ProjectMemberAddRequest {
    addMemberList: { empId: number }[]
}