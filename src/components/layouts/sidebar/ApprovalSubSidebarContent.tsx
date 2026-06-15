import {
  CheckCircle2,
  ClipboardCheck,
  FilePenLine,
  FilePlus2,
  History,
  Inbox,
  Send,
  Star,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { approvalApi } from '../../../api/approvalApi'
import type { ApprovalDraftCountResponse } from '../../../types/approval'
import SubSidebarActionButton from './SubSidebarActionButton'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'

type CountKey = keyof ApprovalDraftCountResponse

const sentItems: { icon: typeof Inbox; label: string; path: string; countKey: CountKey }[] = [
  {
    icon: FilePenLine,
    label: '진행 중 기안서 목록',
    path: '/approval/sent/progress',
    countKey: 'sentProgress',
  },
  {
    icon: CheckCircle2,
    label: '완료된 기안서 목록',
    path: '/approval/sent/completed',
    countKey: 'sentCompleted',
  },
  {
    icon: XCircle,
    label: '반려된 기안서 목록',
    path: '/approval/sent/rejected',
    countKey: 'sentRejected',
  },
  {
    icon: Inbox,
    label: '임시저장 기안서',
    path: '/approval/sent/temporary',
    countKey: 'sentTemporary',
  },
]

const receivedItems: { icon: typeof Inbox; label: string; path: string; countKey: CountKey }[] = [
  {
    icon: Inbox,
    label: '결재 요청 목록',
    path: '/approval/received/requests',
    countKey: 'receivedRequests',
  },
  {
    icon: History,
    label: '결재 내역',
    path: '/approval/received/history',
    countKey: 'receivedHistory',
  },
  {
    icon: ClipboardCheck,
    label: '완료된 기안서 목록',
    path: '/approval/received/completed',
    countKey: 'receivedCompleted',
  },
]

const templateItems = [
  {
    icon: FilePlus2,
    label: '결재 양식',
    path: '/approval/templates/list',
  },
  {
    icon: Star,
    label: '즐겨찾기 양식',
    path: '/approval/templates/favorites',
  },
]

const ApprovalSubSidebarContent = () => {
  const location = useLocation()
  const [counts, setCounts] = useState<ApprovalDraftCountResponse | null>(null)

  const openDraftDrawer = () => {
    window.dispatchEvent(new Event('approval:open-draft'))
  }

  const loadCounts = useCallback(async () => {
    try {
      const response = await approvalApi.getApprovalCounts()
      setCounts(response.data.data ?? null)
    } catch {
      // 카운트 조회 실패 시 배지만 미표시하고 사이드바는 정상 동작
      setCounts(null)
    }
  }, [])

  // 결재 메뉴 진입/경로 변경 시 + 기안서 변경(작성·수정·삭제·결재 처리) 이벤트 시 갱신
  useEffect(() => {
    if (!location.pathname.startsWith('/approval')) return
    // 비동기 fetch 후 상태를 갱신하므로 동기 setState 가 아님
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCounts()
  }, [loadCounts, location.pathname])

  useEffect(() => {
    const refresh = () => void loadCounts()
    window.addEventListener('approval:refresh-counts', refresh)
    return () => window.removeEventListener('approval:refresh-counts', refresh)
  }, [loadCounts])

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">전자결재</h2>
      </div>

      <SubSidebarActionButton variant="primary" onClick={openDraftDrawer}>
        <span className="inline-flex items-center gap-2">
          <Send size={16} />
          기안서 작성
        </span>
      </SubSidebarActionButton>

      <SubSidebarSection title="결재 상신함">
        {sentItems.map((item) => (
          <SubSidebarMenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={location.pathname === item.path}
            count={counts?.[item.countKey]}
          />
        ))}
      </SubSidebarSection>

      <SubSidebarSection title="결재 수신함">
        {receivedItems.map((item) => (
          <SubSidebarMenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={location.pathname === item.path}
            count={counts?.[item.countKey]}
          />
        ))}
      </SubSidebarSection>

      <SubSidebarSection title="결재 양식">
        {templateItems.map((item) => (
          <SubSidebarMenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={location.pathname === item.path}
          />
        ))}
      </SubSidebarSection>
    </div>
  )
}

export default ApprovalSubSidebarContent
