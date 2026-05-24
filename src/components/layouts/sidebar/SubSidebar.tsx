import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../common/button/Button'
import SubSidebarActionButton from './SubSidebarActionButton'
import SubSidebarMenuItem from './SubSidebarMenuItem'
import SubSidebarSection from './SubSidebarSection'
import { getSidebarKey, subSidebarConfigs } from './sidebar.config'

interface SubSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onOpen: () => void
}

const SubSidebar = ({ isOpen, onToggle, onOpen }: SubSidebarProps) => {
  const location = useLocation()
  const sidebarKey = getSidebarKey(location.pathname)
  const sidebarConfig = subSidebarConfigs[sidebarKey] ?? subSidebarConfigs.project

  return (
    <>
      <aside
        className={`relative h-full flex-shrink-0 border-r border-slate-100 bg-[#f8fafc] transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-72 p-6 opacity-100'
            : 'w-0 overflow-hidden border-r-0 p-0 opacity-0'
        }`}
      >
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
