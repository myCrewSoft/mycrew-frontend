import { Folder, Users, Archive, Star } from 'lucide-react'
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
          label="프로젝트 드라이브"
          path="/drive/shared"
          active={location.pathname === '/drive/shared'}
        />
        <SubSidebarMenuItem
          icon={Star}
          label="즐겨찾기 목록"
          path="/drive/shared"
          active={location.pathname === '/drive/bookmark'}
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