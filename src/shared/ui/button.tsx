import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib'
import './button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
  leftIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn('ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="ui-btn__spinner" /> : leftIcon}
      {children}
    </button>
  )
}
