import { Plus } from 'lucide-react'

interface Props {
  onClick?: () => void

  className?: string

  icon?: React.ReactNode
}

const FloatingButton = ({
  onClick,
  className = '',
  icon,
}: Props) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50

        flex h-16 w-16 items-center justify-center

        rounded-full

        bg-blue-600 text-white

        shadow-2xl

        transition-all duration-200

        hover:scale-105

        active:scale-95

        ${className}
      `}
    >
      {icon || <Plus size={28} />}
    </button>
  )
}

export default FloatingButton