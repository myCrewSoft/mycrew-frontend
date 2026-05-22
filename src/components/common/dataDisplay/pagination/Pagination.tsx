import { ChevronLeft, ChevronRight } from 'lucide-react'
import IconButton from '../../button/IconButton'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="flex items-center justify-center gap-2">
      <IconButton
        size="sm"
        aria-label="이전 페이지"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </IconButton>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition-colors ${
            item === page
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {item}
        </button>
      ))}

      <IconButton
        size="sm"
        aria-label="다음 페이지"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={16} />
      </IconButton>
    </div>
  )
}

export default Pagination
