import { UserRound } from 'lucide-react'
import useImage from '../../../hooks/useImage'

interface ProfileAvatarProps {
  /** 프로필 이미지 파일 ID (없으면 이니셜/아이콘 폴백) */
  fileId?: number | null
  /** 사원명 (이니셜 및 alt 용) */
  name?: string | null
  /** 한 변 크기(px) */
  size?: number
  /** 모서리 둥글기 */
  rounded?: 'full' | 'lg' | 'xl' | '2xl'
  /** 래퍼에 추가할 클래스 */
  className?: string
}

const roundedClassMap: Record<NonNullable<ProfileAvatarProps['rounded']>, string> = {
  full: 'rounded-full',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
}

const getInitial = (name?: string | null) => name?.trim().charAt(0) ?? ''

// 인증이 필요한 이미지 엔드포인트를 useImage(axios blob)로 불러와 폴백 위에 덮어 그린다.
function AvatarImage({ fileId, alt }: { fileId: number; alt: string }) {
  const src = useImage(fileId)
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

export default function ProfileAvatar({
  fileId,
  name,
  size = 40,
  rounded = 'full',
  className = '',
}: ProfileAvatarProps) {
  const initial = getInitial(name)

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-blue-100 font-black text-blue-700 ${roundedClassMap[rounded]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initial ? (
        <span>{initial}</span>
      ) : (
        <UserRound size={Math.round(size * 0.55)} aria-hidden="true" />
      )}
      {fileId ? (
        <AvatarImage fileId={fileId} alt={`${name ?? '사용자'} 프로필 이미지`} />
      ) : null}
    </span>
  )
}
