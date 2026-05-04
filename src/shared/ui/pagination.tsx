import { Button } from './button'
import './pagination.css'

interface PaginationProps {
  total: number
  limit: number
  offset: number
  onChange: (offset: number) => void
}

export function Pagination({ total, limit, offset, onChange }: PaginationProps) {
  const page = Math.floor(offset / limit) + 1
  const pages = Math.max(1, Math.ceil(total / limit))

  const prev = () => onChange(Math.max(0, offset - limit))
  const next = () => onChange(Math.min((pages - 1) * limit, offset + limit))

  return (
    <div className="ui-pagination">
      <span className="ui-pagination__info">
        {total === 0
          ? '0 records'
          : `${offset + 1}–${Math.min(total, offset + limit)} of ${total}`}
      </span>
      <div className="ui-pagination__controls">
        <Button size="sm" variant="secondary" onClick={prev} disabled={page <= 1}>
          ← Prev
        </Button>
        <span className="ui-pagination__page">
          Page {page} / {pages}
        </span>
        <Button size="sm" variant="secondary" onClick={next} disabled={page >= pages}>
          Next →
        </Button>
      </div>
    </div>
  )
}
