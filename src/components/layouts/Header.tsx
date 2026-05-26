import { Bell, Mail, MessageSquare } from 'lucide-react'
import NotificationIconButton from '../common/button/NotificationIconButton'
import SearchInput from '../common/form/searchInput/SearchInput'
import HeaderPopover from '../common/overlay/headerPopover/HeaderPopover'
import MessengerPopoverContent from './headerPopover/messenger/MessengerPopoverContent'
import HeaderProfileStatusMenu from './headerPopover/profile/HeaderProfileStatusMenu'
import NotificationPopoverContent from './headerPopover/NotificationPopoverContent'
import { notificationApi } from '../../api/notificationApi'
import { useApi } from '../../hooks/useApi'

const Header = () => {
  const { execute: readAllNotifications } = useApi<null>(
    notificationApi.readAllNotifications,
    { immediate: false },
  )

  return (
    <header className="flex h-16 w-full min-w-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-3">
      <SearchInput
        wrapperClassName="max-w-md"
        placeholder="통합 검색"
        aria-label="통합 검색"
      />

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
          {/* 메일 팝오버 내용 컴포넌트를 여기에 넣으면 됩니다. 예: <MailPopoverContent /> */}
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
  )
}

export default Header
