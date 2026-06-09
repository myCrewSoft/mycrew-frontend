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