import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import OptimizerView from './components/OptimizerView'
import ReportView from './components/ReportView'

export default function App() {
  const [activeView, setActiveView] = useState('optimizer')

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'optimizer' ? (
          <OptimizerView />
        ) : (
          <ReportView />
        )}
      </main>
    </div>
  )
}
