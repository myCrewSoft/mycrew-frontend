import { useEffect, useMemo, useRef, useState } from 'react'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import { ZoomIn } from 'lucide-react'
import { getImage } from '../../api/fileApi'
import Modal from '../../components/common/overlay/modal/Modal'

interface BoardContentViewerProps {
  content?: string | null
}

const inlineImagePattern =
  /(?:https?:\/\/[^/\s)]+)?\/api\/files\/images\/(\d+)/g

const getInlineImageIds = (content: string) => (
  Array.from(content.matchAll(inlineImagePattern))
    .map((match) => Number(match[1]))
    .filter((id) => Number.isFinite(id) && id > 0)
)

const BoardContentViewer = ({ content = '' }: BoardContentViewerProps) => {
  const viewerHostRef = useRef<HTMLDivElement | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const resolvedContent = content ?? ''
  const imageIds = useMemo(
    () => Array.from(new Set(getInlineImageIds(resolvedContent))),
    [resolvedContent],
  )

  useEffect(() => {
    let active = true
    const createdUrls: string[] = []

    imageIds.forEach((imageId) => {
      void getImage(imageId)
        .then((response) => {
          if (!active) return

          const objectUrl = URL.createObjectURL(response.data)
          createdUrls.push(objectUrl)
          setImageUrls((current) => ({
            ...current,
            [imageId]: objectUrl,
          }))
        })
        .catch(() => undefined)
    })

    return () => {
      active = false
      createdUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imageIds])

  const displayContent = useMemo(() => {
    return resolvedContent.replace(
      inlineImagePattern,
      (originalUrl, imageId: string) => (
        imageUrls[Number(imageId)] ?? originalUrl
      ),
    )
  }, [imageUrls, resolvedContent])

  useEffect(() => {
    if (!viewerHostRef.current) return

    const viewer = new Viewer({
      el: viewerHostRef.current,
      initialValue: displayContent,
      usageStatistics: false,
    })

    return () => viewer.destroy()
  }, [displayContent])

  return (
    <>
      <div
        className="board-content-viewer"
        onClick={(event) => {
          const target = event.target

          if (target instanceof HTMLImageElement) {
            setSelectedImage(target.src)
          }
        }}
      >
        <div ref={viewerHostRef} />
      </div>

      <Modal
        open={Boolean(selectedImage)}
        title={
          <span className="inline-flex items-center gap-2">
            <ZoomIn size={18} />
            이미지 원본 보기
          </span>
        }
        description="이미지를 원본 비율로 표시합니다."
        maxWidthClassName="max-w-[96vw]"
        onClose={() => setSelectedImage(null)}
      >
        {selectedImage && (
          <div className="flex max-h-[82vh] min-h-40 items-center justify-center overflow-auto bg-slate-100 p-3">
            <img
              src={selectedImage}
              alt="게시글 본문 이미지 확대"
              className="h-auto max-w-none object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  )
}

export default BoardContentViewer
