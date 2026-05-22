import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../common/header/Header'
import MainSidebar from '../common/sidebar/MainSidebar'

export default function MainLayout() {
  const [isSubOpen, setIsSubOpen] = useState(true)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <MainSidebar
        isSubOpen={isSubOpen}
        onToggleSub={() => setIsSubOpen((current) => !current)}
        onOpenSub={() => setIsSubOpen(true)}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto bg-[#f1f5f9] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
