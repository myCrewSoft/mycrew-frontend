import { Upload } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface FileUploadProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
}

const FileUpload = ({
  label = '파일 첨부',
  helperText = '파일을 선택하거나 이 영역에 끌어다 놓으세요.',
  className = '',
  ...props
}: FileUploadProps) => {
  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${className}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
        <Upload size={20} />
      </span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-xs text-slate-400">{helperText}</span>
      <input type="file" className="sr-only" {...props} />
    </label>
  )
}

export default FileUpload
