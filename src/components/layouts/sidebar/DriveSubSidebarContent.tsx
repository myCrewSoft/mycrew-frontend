import { Folder, Users, Archive } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import SubSidebarSection from './SubSidebarSection'
import SubSidebarMenuItem from './SubSidebarMenuItem'

export default function DriveSubSidebarContent() {
  const location = useLocation()

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">드라이브</h2>
      </div>

      <SubSidebarSection title="저장 공간">
        <SubSidebarMenuItem
          icon={Folder}
          label="내 드라이브"
          path="/drive"
          active={location.pathname === '/drive' || location.pathname.startsWith('/drive/folders')}
        />
        <SubSidebarMenuItem
          icon={Users}
          label="공유 드라이브"
          path="/drive/shared"
          active={location.pathname === '/drive/shared'}
        />
        <SubSidebarMenuItem
          icon={Archive}
          label="휴지통"
          path="/drive/trash"
          active={location.pathname === '/drive/trash'}
        />
      </SubSidebarSection>
    </div>
  )
}