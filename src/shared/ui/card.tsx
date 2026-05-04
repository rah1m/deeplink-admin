import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib'
import './card.css'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  padding?: 'none' | 'md' | 'lg'
}

export function Card({
  title,
  description,
  actions,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div className={cn('ui-card', className)} {...rest}>
      {(title || actions) && (
        <div className="ui-card__head">
          <div>
            {title && <div className="ui-card__title">{title}</div>}
            {description && <div className="ui-card__desc">{description}</div>}
          </div>
          {actions && <div className="ui-card__actions">{actions}</div>}
        </div>
      )}
      <div className={cn('ui-card__body', `ui-card__body--${padding}`)}>{children}</div>
    </div>
  )
}
