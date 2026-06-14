import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Tour } from '../Tour'

interface AppLayoutProps {
  title: string
  children: ReactNode
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const [tourTrigger, setTourTrigger] = useState(0)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Floating help button */}
      <button
        onClick={() => setTourTrigger(t => t + 1)}
        title="Show walkthrough"
        className="fixed bottom-6 right-6 z-[199] w-10 h-10 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-base font-semibold"
      >
        ?
      </button>

      <Tour openTrigger={tourTrigger} />
    </div>
  )
}
