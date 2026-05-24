import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import MainSidebar from './sidebar/MainSidebar'
import SubSidebar from './sidebar/SubSidebar'

export default function MainLayout() {
  const [isSubOpen, setIsSubOpen] = useState(true)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <MainSidebar />
      <SubSidebar
        isOpen={isSubOpen}
        onToggle={() => setIsSubOpen((current) => !current)}
        onOpen={() => setIsSubOpen(true)}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f1f5f9] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
