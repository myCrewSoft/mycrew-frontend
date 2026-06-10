type Props = {
  page: number       // 0-based
  totalPages: number
  onPageChange: (next: number) => void
}

export default function ApprovalPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i)

  return (
    <div className="approval-page__pagination">
      <button
        type="button"
        className="approval-page__pagination-btn"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={[
            'approval-page__pagination-btn',
            p === page ? 'approval-page__pagination-btn--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        type="button"
        className="approval-page__pagination-btn"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>
    </div>
  )
}
