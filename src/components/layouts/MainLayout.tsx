import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import { MessengerSocketProvider } from './headerPopover/messenger/MessengerSocketProvider'
import { useNotificationStream } from './headerPopover/useNotificationStream'
import MainSidebar from './sidebar/MainSidebar'
import SubSidebar from './sidebar/SubSidebar'

export default function MainLayout() {
  const [isSubOpen, setIsSubOpen] = useState(true)
  useNotificationStream()

  return (
    <MessengerSocketProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <MainSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header />

          <div className="flex min-h-0 flex-1">
            <SubSidebar
              isOpen={isSubOpen}
              onToggle={() => setIsSubOpen((current) => !current)}
            />

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f1f5f9] p-6 [scrollbar-gutter:stable]">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </MessengerSocketProvider>
  )
}
