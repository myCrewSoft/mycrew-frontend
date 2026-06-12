import useImage from '../../hooks/useImage'

interface BoardAttachmentImageProps {
  attachmentFileId?: number | null
  alt: string
}

const BoardAttachmentImage = ({
  attachmentFileId,
  alt,
}: BoardAttachmentImageProps) => {
  const imageSrc = useImage(attachmentFileId)

  if (!imageSrc) return null

  return (
    <figure className="pb-6">
      <img
        src={imageSrc}
        alt={alt}
        className="max-h-[640px] max-w-full rounded-md border border-slate-200 object-contain"
      />
    </figure>
  )
}

export default BoardAttachmentImage
