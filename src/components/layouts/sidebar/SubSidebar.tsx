import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div
      className={`relative h-full flex-shrink-0 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-72' : 'w-0'
      }`}
    >
      <aside
        className={`h-full border-r border-slate-100 bg-[#f8fafc] transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-full p-6 opacity-100'
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
      </aside>

      <button
        type="button"
        onClick={isOpen ? onToggle : onOpen}
        aria-label={isOpen ? '서브 사이드바 닫기' : '서브 사이드바 열기'}
        className="absolute -right-4 top-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg shadow-slate-200/70 ring-4 ring-slate-50 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        {isOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
      </button>
    </div>
  )
}

export default SubSidebar
