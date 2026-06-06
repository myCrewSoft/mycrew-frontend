export interface DriveResponseDto {
  driveItemId: number
  prntDriveItemId?: number
 
  frstRgtrId?: number           // 최초 등록자 ID
  lastMdfrId?: number           // 최종 수정자 ID
 
  itemTypeCd: string            // 01: 폴더 / 02: 파일
  bookmarkYn: string            // Y / N
  itemNm: string
 
  frstRegDt?: string            // 생성일시
  lastMdfcnDt?: string          // 수정일시
  timeAgo?: string              // 몇 분 전 / 몇 시간 전
 
  delYn?: string                // 삭제 여부 (Y / N)
  delDt?: string                // 삭제일시
  deltrMbrId?: number           // 삭제자 ID
 
  driveScopeCd?: string         // 01: 개인 드라이브 / 02: 프로젝트 드라이브
  projId?: number               // 프로젝트 드라이브일 때만
 
  fileSz?: string               // 파일 크기 (포맷된 문자열, 예: "1.2 MB") — 파일일 때만
  orgnlFileNm?: string          // 원본 파일명 — 파일일 때만
  childCnt?:number              // 하위 아이템 개수
  deltrMbrNm?:string            // 삭제자 이름
  frstRgtrNm?:string            // 생성자 이름
  lastMdfrNm?:string            // 수정자 이름
}

export interface DriveRenameRequestDto{
    itemNm : string
}