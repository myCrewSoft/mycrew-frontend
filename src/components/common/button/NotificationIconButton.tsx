import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Badge from '../dataDisplay/badge/Badge'
import IconButton from './IconButton'

interface NotificationIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  count?: number
  badgeVariant?: 'primary' | 'danger'
}

const NotificationIconButton = ({
  icon,
  label,
  count,
  badgeVariant = 'primary',
  ...props
}: NotificationIconButtonProps) => {
  return (
    <div className="relative">
      <IconButton aria-label={label} {...props}>
        {icon}
      </IconButton>

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
