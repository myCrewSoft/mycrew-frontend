/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { boardApi } from '../api/boardApi'

// 백엔드 응답 규격에 맞춘 인터페이스
interface BoardSideBarResponse {
  boardTypeCd: string;
  boardName: string;
  underlevel?: BoardSideBarResponse[] | null;
}

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
    ? dynamicBoards.map((board: BoardSideBarResponse) => ({
        icon: FileText,
        label: board.boardName,
        path: `/board/${board.boardTypeCd.toLowerCase()}`,
        // 💡 underlevel이 있다면 children으로 변환하여 계층 구조 유지
        children: Array.isArray(board.underlevel)
          ? board.underlevel.map((sub: BoardSideBarResponse) => ({
              icon: FileText,
              label: sub.boardName,
              path: `/board/${sub.boardName}`,
            }))
          : undefined
      }))
    : []

  return { boardMenuItems }
}