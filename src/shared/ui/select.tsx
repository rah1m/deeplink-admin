import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@shared/lib'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, children, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={inputId} className="ui-field__label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn('ui-input', error && 'ui-input--error', className)}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint ? (
        <span className="ui-field__hint">{hint}</span>
      ) : null}
    </div>
  )
})
