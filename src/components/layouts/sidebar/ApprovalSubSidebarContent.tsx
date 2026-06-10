import {
  CheckCircle2,
  ClipboardCheck,
  FilePenLine,
  History,
  Inbox,
  Send,
  XCircle,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import SubSidebarActionButton from './SubSidebarActionButton'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'

const sentItems = [
  {
    icon: FilePenLine,
    label: '진행 중 기안서 목록',
    path: '/approval/sent/progress',
  },
  {
    icon: CheckCircle2,
    label: '완료된 기안서 목록',
    path: '/approval/sent/completed',
  },
  {
    icon: XCircle,
    label: '반려된 기안서 목록',
    path: '/approval/sent/rejected',
  },
]

const receivedItems = [
  {
    icon: Inbox,
    label: '결재 요청 목록',
    path: '/approval/received/requests',
  },
  {
    icon: History,
    label: '결재 내역',
    path: '/approval/received/history',
  },
  {
    icon: ClipboardCheck,
    label: '완료된 기안서 목록',
    path: '/approval/received/completed',
  },
]

const ApprovalSubSidebarContent = () => {
  const location = useLocation()

  const openDraftDrawer = () => {
    window.dispatchEvent(new Event('approval:open-draft'))
  }

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
          />
        ))}
      </SubSidebarSection>
    </div>
  )
}

export default ApprovalSubSidebarContent
