export interface DriveResponseDto {
    driveItemId: number
    prntDriveItemId?: number
    itemTypeCd: string        // 01: 폴더 / 02: 파일
    bookmarkYn: string        // Y / N
    itemNm: string
    frstRegDt?: string
    lastMdfcnDt?: string
    timeAgo?: string
    fileSz?: number           // 파일 크기 (byte) — 파일일 때만
    orgnlFileNm?: string      // 원본 파일명 — 파일일 때만
}