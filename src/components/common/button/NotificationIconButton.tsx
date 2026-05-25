import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Badge from '../dataDisplay/badge/Badge'
import IconButton from './IconButton'

interface NotificationIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  count?: number
  badgeVariant?: 'primary' | 'danger'
  active?: boolean
}

const NotificationIconButton = ({
  icon,
  label,
  count,
  badgeVariant = 'primary',
  active = false,
  ...props
}: NotificationIconButtonProps) => {
  return (
    <div className="relative">
      {/* active는 팝오버가 열렸을 때 아이콘 버튼을 선택된 상태로 보여주기 위해 사용합니다. */}
      <IconButton active={active} aria-label={label} {...props}>
        {icon}
      </IconButton>

      {/* count가 0보다 클 때만 우측 상단에 숫자 배지를 표시합니다. */}
      {typeof count === 'number' && count > 0 && (
        <Badge
          variant={badgeVariant}
          size="count"
          className="absolute -right-1 -top-1"
        >
          {count}
        </Badge>
      )}
    </div>
  )
}

export default NotificationIconButton
