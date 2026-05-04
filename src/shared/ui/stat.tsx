import type { ReactNode } from 'react'
import './stat.css'

interface StatProps {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: 'neutral' | 'primary' | 'success' | 'warning'
}

export function Stat({ label, value, hint, tone = 'neutral' }: StatProps) {
  return (
    <div className={`ui-stat ui-stat--${tone}`}>
      <div className="ui-stat__label">{label}</div>
      <div className="ui-stat__value">{value}</div>
      {hint && <div className="ui-stat__hint">{hint}</div>}
    </div>
  )
}
