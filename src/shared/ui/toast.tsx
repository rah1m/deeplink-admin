import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './toast.css'

type ToastTone = 'info' | 'success' | 'warning' | 'danger'

interface ToastItem {
  id: number
  tone: ToastTone
  text: string
}

interface ToastContextValue {
  push: (text: string, tone?: ToastTone) => void
  success: (text: string) => void
  error: (text: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

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

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>')
  return ctx
}
