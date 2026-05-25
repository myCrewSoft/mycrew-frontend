import type { ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../common/button/Button'
import CalendarSubSidebarContent from './CalendarSubSidebarContent'
import SubSidebarActionButton from './SubSidebarActionButton'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'
import { getSidebarKey, subSidebarConfigs } from './sidebar.config'

interface SubSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onOpen: () => void
}

// 특정 메뉴에서 기본 메뉴 목록이 아니라 전용 UI를 보여주고 싶을 때 사용하는 매핑입니다.
// 추가할 경우 아래와 동일하게 추가할 것
// 예: /calendar 경로에서는 CalendarSubSidebarContent를 렌더링합니다.
const customSidebarContentMap: Record<string, ComponentType> = {
  calendar: CalendarSubSidebarContent,
}

const SubSidebar = ({ isOpen, onToggle, onOpen }: SubSidebarProps) => {
  const location = useLocation()

  // 현재 URL의 첫 번째 경로를 기준으로 어떤 서브사이드바를 보여줄지 결정합니다.
  // 예: /calendar/my → calendar, /project/list → project
  const sidebarKey = getSidebarKey(location.pathname)

  // 현재 경로에 맞는 기본 설정을 가져옵니다.
  // 설정이 없으면 undefined가 됩니다.
  const sidebarConfig = subSidebarConfigs[sidebarKey]

  // 현재 경로에 맞는 전용 서브사이드바 컴포넌트가 있는지 확인합니다.
  const CustomSidebarContent = customSidebarContentMap[sidebarKey]

  // 전용 컴포넌트도 없고 기본 설정도 없으면 서브사이드바와 여닫기 버튼 렌더링 X
  if (!CustomSidebarContent && !sidebarConfig) {
    return null
  }

  return (
    <>
      <aside
        className={`relative h-full flex-shrink-0 border-r border-slate-100 bg-[#f8fafc] transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-72 p-6 opacity-100'
            : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'
        }`}
      >
        {/* 전용 서브사이드바가 있으면 전용 컴포넌트를 보여줍니다. */}
        {CustomSidebarContent ? (
          <CustomSidebarContent />
        ) : (
          // 전용 컴포넌트가 없으면 sidebar.config.ts 기반으로 기본 메뉴형 서브사이드바를 보여줍니다.
          <div className="flex h-full w-full flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                {sidebarConfig.title}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {sidebarConfig.actions.map((action) => (
                <SubSidebarActionButton
                  key={action.label}
                  variant={action.variant}
                >
                  {action.label}
                </SubSidebarActionButton>
              ))}
            </div>

            {sidebarConfig.sections.map((section) => (
              <SubSidebarSection key={section.title} title={section.title}>
                {section.items.map((item) => (
                  <SubSidebarMenuItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    active={location.pathname.startsWith(item.path)}
                  />
                ))}
              </SubSidebarSection>
            ))}
          </div>
        )}

        {/* 서브사이드바가 열려 있을 때 보이는 닫기 버튼입니다. */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-6 z-50 min-w-0 border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600"
          leftIcon={
            isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
          }
          aria-label={isOpen ? '서브 사이드바 닫기' : '서브 사이드바 열기'}
        />
      </aside>

      {/* 서브사이드바가 닫혀 있을 때 왼쪽에 작게 보이는 열기 버튼입니다. */}
      {!isOpen && (
        <div className="absolute left-24 top-6 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={onOpen}
            className="min-w-0 rounded-l-none rounded-r-md border-l-0 border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-blue-600"
            leftIcon={<ChevronRight size={14} />}
            aria-label="서브 사이드바 열기"
          />
        </div>
      )}
    </>
  )
}

export default SubSidebar