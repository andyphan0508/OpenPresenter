import React, { useState } from 'react'
import { useStore } from '../store/useStore'

interface ToolbarProps {
  onToggleOutput: () => void
  outputEnabled: boolean
}

export function Toolbar({ onToggleOutput, outputEnabled }: ToolbarProps) {
  const {
    getCurrentPresentation,
    createPresentation,
    setActivePanel,
    activePanel,
    theme,
    toggleTheme
  } = useStore()

  const [showNewPresDialog, setShowNewPresDialog] = useState(false)
  const [newPresName, setNewPresName] = useState('')

  const pres = getCurrentPresentation()

  const handleNewPresentation = () => {
    if (newPresName.trim()) {
      createPresentation(newPresName.trim())
      setNewPresName('')
      setShowNewPresDialog(false)
    }
  }

  return (
    <>
      <div className="h-11 bg-panel border-b border-app flex items-center px-4 gap-2 select-none app-drag flex-shrink-0">
        {/* Traffic lights space on macOS */}
        <div className="w-16 no-drag" />

        {/* App name */}
        <div className="flex items-center gap-2 mr-1 flex-shrink-0">
          <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">OP</span>
          </div>
          <span className="text-primary font-semibold text-sm">OpenPresenter</span>
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-[#333] flex-shrink-0" />

        {/* Panel tabs */}
        <nav className="flex items-center gap-0.5 no-drag">
          <NavTab active={activePanel === 'presentations'} onClick={() => setActivePanel('presentations')}>
            Presentations
          </NavTab>
          <NavTab active={activePanel === 'library'} onClick={() => setActivePanel('library')}>
            Songs
          </NavTab>
          <NavTab active={activePanel === 'settings'} onClick={() => setActivePanel('settings')}>
            Settings
          </NavTab>
        </nav>

        <div className="h-5 w-px bg-gray-200 dark:bg-[#333] flex-shrink-0" />

        {/* New presentation shortcut */}
        <button
          onClick={() => setShowNewPresDialog(true)}
          title="New Presentation (opens dialog)"
          className="no-drag w-7 h-7 flex items-center justify-center rounded text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-lg leading-none"
        >
          +
        </button>

        {/* Current presentation indicator */}
        {pres && activePanel !== 'library' && (
          <span className="text-secondary text-xs truncate max-w-40 leading-none">{pres.name}</span>
        )}

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="no-drag w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-muted hover:text-primary transition-colors text-sm"
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>

        {/* Output / Live button */}
        <button
          onClick={onToggleOutput}
          title={outputEnabled ? 'Output is live — click to stop' : 'Click to open the output screen for your audience'}
          className={`no-drag flex items-center gap-2 px-4 py-1.5 rounded font-medium text-sm transition-all flex-shrink-0 ${
            outputEnabled
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-transparent text-muted hover:text-primary border border-app hover:border-orange-400 hover:bg-orange-500/5'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            outputEnabled ? 'bg-white animate-pulse' : 'bg-gray-400 dark:bg-[#555]'
          }`} />
          <span>{outputEnabled ? 'Live' : 'Output'}</span>
        </button>
      </div>

      {/* New Presentation dialog */}
      {showNewPresDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-panel rounded-xl border border-app p-6 w-96 shadow-2xl">
            <h2 className="text-primary font-semibold text-lg mb-1">New Presentation</h2>
            <p className="text-muted text-xs mb-4">Give your presentation a name to get started.</p>
            <input
              autoFocus
              type="text"
              value={newPresName}
              onChange={(e) => setNewPresName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewPresentation()
                if (e.key === 'Escape') setShowNewPresDialog(false)
              }}
              placeholder="e.g. Sunday Service — May 18"
              className="input-base w-full px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewPresDialog(false)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-hover-2 text-primary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNewPresentation}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavTab({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? 'bg-orange-500/10 text-orange-500 dark:text-orange-400'
          : 'text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
      }`}
    >
      {children}
    </button>
  )
}
