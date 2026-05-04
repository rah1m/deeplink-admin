import { Link } from '@tanstack/react-router'
import { Button, EmptyState } from '@shared/ui'

export function NotFoundPage() {
  return (
    <div style={{ padding: 64 }}>
      <EmptyState
        title="404 — Page not found"
        description="The page you're looking for doesn't exist."
        action={
          <Link to="/">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
