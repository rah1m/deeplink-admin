import { useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext, type ToastContextValue, type ToastTone } from './use-toast'
import './toast.css'

interface ToastItem {
  id: number
  tone: ToastTone
  text: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((text: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random()
    setItems((arr) => [...arr, { id, tone, text }])
    setTimeout(() => {
      setItems((arr) => arr.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const value: ToastContextValue = {
    push,
    success: (t) => push(t, 'success'),
    error: (t) => push(t, 'danger'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="ui-toast-stack">
          {items.map((t) => (
            <div key={t.id} className={`ui-toast ui-toast--${t.tone}`}>
              {t.text}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
