import { FolderKanban, Users } from 'lucide-react'
import ProfileAvatar from '../../../common/avatar/ProfileAvatar'
import useImage from '../../../../hooks/useImage'
import type { ChatRoom } from './messenger.types'
import {
  getStatusDotClassName,
  isDirectChatRoom,
  isProjectChatRoom,
} from './messenger.utils'

interface ChatRoomAvatarProps {
  room: ChatRoom
  size?: number
  showStatus?: boolean
}

const ChatRoomImage = ({
  fileId,
  name,
}: {
  fileId: number
  name: string
}) => {
  const src = useImage(fileId)

  if (!src) return null

  return (
    <img
      src={src}
      alt={`${name} 채팅방 이미지`}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

const ChatRoomAvatar = ({
  room,
  size = 40,
  showStatus = true,
}: ChatRoomAvatarProps) => {
  const customImageId = room.chatRoomImageAtchFileId
  const directChat = isDirectChatRoom(room)
  const iconSize = Math.round(size * 0.45)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {customImageId ? (
        <div className="relative h-full w-full overflow-hidden rounded-full bg-slate-100">
          <ChatRoomImage fileId={customImageId} name={room.name} />
        </div>
      ) : directChat ? (
        <ProfileAvatar
          fileId={room.prflImgFileId}
          name={room.name}
          size={size}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full ${
            isProjectChatRoom(room)
              ? 'bg-violet-100 text-violet-600'
              : 'bg-indigo-100 text-indigo-600'
          }`}
        >
          {isProjectChatRoom(room) ? (
            <FolderKanban size={iconSize} aria-hidden="true" />
          ) : (
            <Users size={iconSize} aria-hidden="true" />
          )}
        </div>
      )}

      {showStatus && directChat && room.status && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${getStatusDotClassName(room.status)}`}
        />
      )}
    </div>
  )
}

export default ChatRoomAvatar
