/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { boardApi } from '../api/boardApi'
import type { BoardSideBarResponse } from '../types'

const boardPathByTypeCd: Record<string, string> = {
  NOTICE: '/boards/notices',
  DEPT: '/boards/departments',
  FREE: '/boards/free',
  ANON: '/boards/anonymous',
  ANONYMOUS: '/boards/anonymous',
}

const allowedBoardTypeCodes = new Set(Object.keys(boardPathByTypeCd))

const normalizeBoardTypeCode = (boardTypeCd?: string) =>
  boardTypeCd?.trim().toUpperCase() ?? ''

const isAllowedBoard = (board: BoardSideBarResponse) =>
  allowedBoardTypeCodes.has(normalizeBoardTypeCode(board.boardTypeCd))

const getBoardPath = (boardTypeCd: string) =>
  boardPathByTypeCd[normalizeBoardTypeCode(boardTypeCd)]

type DepartmentBoardSideBarResponse = BoardSideBarResponse & {
  deptCd?: string
  deptCode?: string
  departmentCode?: string
  code?: string
}

const departmentCodeByName: Record<string, string> = {
  개발팀: 'DEV',
  운영팀: 'OPS',
  디자인팀: 'DESIGN',
  인사팀: 'HR',
  마케팅팀: 'MARKETING',
}

const getDepartmentCode = (board: DepartmentBoardSideBarResponse) => {
  const candidates = [
    board.deptCd,
    board.deptCode,
    board.departmentCode,
    board.code,
    departmentCodeByName[board.boardName],
    board.boardTypeCd?.toUpperCase() === 'DEPT' ? undefined : board.boardTypeCd,
  ]

  const departmentCode = candidates.find(
    (value): value is string => Boolean(value?.trim()),
  )

  return departmentCode?.trim().toUpperCase() ?? ''
}

const getDepartmentPath = (deptCd: string) => `/boards/dept/${encodeURIComponent(deptCd)}`

export const useBoardSidebar = (sidebarKey: string) => {
  const [dynamicBoards, setDynamicBoards] = useState<BoardSideBarResponse[]>([])

  useEffect(() => {
    if (sidebarKey === 'board') {
      boardApi.getBoardSideBar()
        .then((res: any) => {
          if (!res) return
          
          // Axios 응답 구조 파싱
          const rawData = res.data?.data || res.data?.result || res.data || res
          
          if (Array.isArray(rawData)) {
            setDynamicBoards(rawData)
          } else {
            setDynamicBoards([])
          }
        })
        .catch((err: any) => {
          // 💡 System 대신 console.error 사용
          console.error('사이드바 게시판 목록을 불러오지 못했습니다.', err)
          setDynamicBoards([])
        })
    }
  }, [sidebarKey])

  // 공통 컴포넌트가 요구하는 메뉴 구조로 매핑
  const boardMenuItems = Array.isArray(dynamicBoards)
    ? dynamicBoards
      .filter(isAllowedBoard)
      .map((board: BoardSideBarResponse) => {
        const boardTypeCode = normalizeBoardTypeCode(board.boardTypeCd)
        const children = boardTypeCode === 'DEPT' && Array.isArray(board.underlevel)
          ? board.underlevel
            .map((sub: BoardSideBarResponse) => {
              const deptCd = getDepartmentCode(sub)

              return deptCd
                ? {
                    icon: FileText,
                    label: sub.boardName,
                    path: getDepartmentPath(deptCd),
                    activeKey: getDepartmentPath(deptCd),
                  }
                : null
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
          : undefined

        return {
          icon: FileText,
          label: board.boardName,
          path: getBoardPath(board.boardTypeCd),
          children,
        }
      })
    : []

  return { boardMenuItems }
}
