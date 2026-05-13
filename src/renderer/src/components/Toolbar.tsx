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
      <div className="h-14 bg-panel border-b border-app flex items-center px-4 gap-2 select-none app-drag flex-shrink-0">
        {/* Traffic lights space on macOS */}
        <div className="w-16 no-drag" />

        {/* App name */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">OP</span>
          </div>
          <span className="text-primary font-semibold text-sm">OpenPresenter</span>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-[#444]" />

        {/* Panel toggles */}
        <div className="flex items-center gap-1 no-drag">
          <ToolbarButton active={activePanel === 'presentations'} onClick={() => setActivePanel('presentations')} icon="🗂" label="Presentations" />
          <ToolbarButton active={activePanel === 'library'} onClick={() => setActivePanel('library')} icon="🎵" label="Song Library" />
          <ToolbarButton active={activePanel === 'settings'} onClick={() => setActivePanel('settings')} icon="⚙️" label="Settings" />
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-[#444]" />

        <button
          onClick={() => setShowNewPresDialog(true)}
          className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-surface-2 text-primary text-sm transition-colors bg-hover"
        >
          <span>+</span>
          <span>New</span>
        </button>

        {pres && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-muted text-sm">|</span>
            <span className="text-primary text-sm font-medium truncate max-w-48">{pres.name}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="no-drag w-8 h-8 flex items-center justify-center rounded bg-surface hover:bg-hover-2 text-muted hover:text-primary transition-colors text-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Output button */}
        <button
          onClick={onToggleOutput}
          className={`no-drag flex items-center gap-2 px-4 py-1.5 rounded font-medium text-sm transition-all ${
            outputEnabled
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-surface hover:bg-surface text-primary border border-app'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${outputEnabled ? 'bg-white animate-pulse' : 'bg-gray-400 dark:bg-[#666]'}`} />
          <span>Output</span>
        </button>
      </div>

      {showNewPresDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-panel rounded-xl border border-app p-6 w-96 shadow-2xl">
            <h2 className="text-primary font-semibold text-lg mb-4">New Presentation</h2>
            <input
              autoFocus
              type="text"
              value={newPresName}
              onChange={(e) => setNewPresName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewPresentation()
                if (e.key === 'Escape') setShowNewPresDialog(false)
              }}
              placeholder="Presentation name..."
              className="input-base w-full px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewPresDialog(false)} className="px-4 py-2 rounded-lg bg-surface hover:bg-hover-2 text-primary text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleNewPresentation} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ToolbarButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-orange-500/20 text-orange-500 dark:text-orange-400 border border-orange-500/30'
          : 'text-muted hover:text-primary bg-hover'
      }`}
    >
      <span>{icon}</span>
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}
