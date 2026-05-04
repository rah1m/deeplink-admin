import { QueryProvider } from './providers/query-provider'
import { AppRouter } from './router/router'
import { ToastProvider } from '@shared/ui'
import './styles/global.css'

export function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </QueryProvider>
  )
}
