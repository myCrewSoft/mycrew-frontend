import { useEffect, useState } from 'react'
import { Bell, Mail, MessageSquare, Search } from 'lucide-react'
import { notificationApi } from '../../api/notificationApi'
import { useApi } from '../../hooks/useApi'
import NotificationIconButton from '../common/button/NotificationIconButton'
import HeaderPopover from '../common/overlay/headerPopover/HeaderPopover'
import GlobalSearchPalette from './headerSearch/GlobalSearchPalette'
import MessengerPopoverContent from './headerPopover/messenger/MessengerPopoverContent'
import NotificationPopoverContent from './headerPopover/NotificationPopoverContent'
import HeaderProfileStatusMenu from './headerPopover/profile/HeaderProfileStatusMenu'

const Header = () => {
  // Global search palette open state. Header owns only opening/closing.
  const [searchOpen, setSearchOpen] = useState(false)

  const { execute: readAllNotifications } = useApi<null>(
    notificationApi.readAllNotifications,
    { immediate: false },
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="flex h-16 w-full min-w-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-3">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-500 transition-all hover:border-blue-300 hover:bg-white"
          aria-label="통합 검색 열기"
        >
          <Search size={18} className="text-slate-400" />

          <span className="min-w-0 flex-1 font-medium">통합 검색</span>

          <kbd className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-400">
            Ctrl K
          </kbd>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <HeaderPopover
            title="메일"
            trigger={({ open, toggle }) => (
              <NotificationIconButton
                active={open}
                label="메일"
                count={12}
                onClick={toggle}
                icon={
                  <Mail
                    size={20}
                    className={open ? 'text-white' : 'text-slate-700'}
                  />
                }
              />
            )}
          >
            {/* Mail popover content can be added here when the mail module is ready. */}
          </HeaderPopover>

          <HeaderPopover
            title="메신저"
            className="!w-[660px] translate-x-60"
            bodyClassName="max-h-none overflow-visible"
            trigger={({ open, toggle }) => (
              <NotificationIconButton
                active={open}
                label="메신저"
                count={7}
                onClick={toggle}
                icon={
                  <MessageSquare
                    size={20}
                    className={open ? 'text-white' : 'text-slate-700'}
                  />
                }
              />
            )}
          >
            <MessengerPopoverContent />
          </HeaderPopover>

          <HeaderPopover
            title="알림"
            onClose={() => {
              void readAllNotifications().catch(() => undefined)
            }}
            trigger={({ open, toggle }) => (
              <NotificationIconButton
                active={open}
                label="알림"
                count={5}
                badgeVariant="danger"
                onClick={toggle}
                icon={
                  <Bell
                    size={20}
                    className={open ? 'text-white' : 'text-slate-700'}
                  />
                }
              />
            )}
          >
            <NotificationPopoverContent />
          </HeaderPopover>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          <HeaderProfileStatusMenu />
        </div>
      </header>

      <GlobalSearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  )
}

export default Header
