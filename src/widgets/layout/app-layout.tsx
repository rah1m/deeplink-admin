import type { ReactNode } from 'react'
import { Sidebar } from '@widgets/sidebar/sidebar'
import { Header } from '@widgets/header/header'
import './app-layout.css'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Header />
        <main className="app-layout__content">{children}</main>
      </div>
    </div>
  )
}
