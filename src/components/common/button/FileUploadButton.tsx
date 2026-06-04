// src/components/common/form/fileUpload/FileUploadButton.tsx
import { useRef } from 'react'
import { Upload } from 'lucide-react'

interface FileUploadButtonProps {
  onUpload: (file: File) => void
  accept?: string
}

const FileUploadButton = ({ onUpload, accept }: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Upload size={16} className="text-blue-400" />
        파일 업로드
      </button>
    </>
  )
}

export default FileUploadButton