import type { ReactNode } from 'react'
import { cn } from '@shared/lib'
import './badge.css'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return <span className={cn('ui-badge', `ui-badge--${tone}`, className)}>{children}</span>
}
