import { ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useImage from '../../../../hooks/useImage'

interface ChatRoomImagePickerProps {
  currentFileId?: number | null
  removed?: boolean
  onChange: (file: File | null) => void
  onRemove?: () => void
}

const CurrentImage = ({ fileId }: { fileId: number }) => {
  const src = useImage(fileId)

  if (!src) return null

  return (
    <img
      src={src}
      alt="현재 채팅방 이미지"
      className="h-full w-full object-cover"
    />
  )
}

const ChatRoomImagePicker = ({
  currentFileId,
  removed = false,
  onChange,
  onRemove,
}: ChatRoomImagePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileChange = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null)
      onChange(null)
      return
    }

    setPreviewUrl(URL.createObjectURL(file))
    onChange(file)
  }

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    onChange(null)
    onRemove?.()

    if (inputRef.current) inputRef.current.value = ''
  }

  const hasImage =
    Boolean(previewUrl) || (!removed && Boolean(currentFileId))

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-slate-700">
        채팅방 이미지
      </span>

      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="새 채팅방 이미지 미리보기"
              className="h-full w-full object-cover"
            />
          ) : !removed && currentFileId ? (
            <CurrentImage fileId={currentFileId} />
          ) : (
            <ImagePlus size={22} aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] ?? null)
            }
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            이미지 선택
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={14} />
              제거
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatRoomImagePicker
