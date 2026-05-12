import React, { useState } from 'react'
import { useStore } from '../store/useStore'

interface ToolbarProps {
  onToggleOutput: () => void
  outputEnabled: boolean
}

export function Toolbar({ onToggleOutput, outputEnabled }: ToolbarProps) {
  const {
    currentPresentationId,
    getCurrentPresentation,
    createPresentation,
    setActivePanel,
    activePanel
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
      <div className="h-14 bg-[#2a2a2a] border-b border-[#3a3a3a] flex items-center px-4 gap-2 select-none app-drag">
        {/* Traffic lights space on macOS */}
        <div className="w-16 no-drag" />

        {/* App name */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">OP</span>
          </div>
          <span className="text-white font-semibold text-sm">OpenPresenter</span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[#444]" />

        {/* Panel toggles */}
        <div className="flex items-center gap-1 no-drag">
          <ToolbarButton
            active={activePanel === 'presentations'}
            onClick={() => setActivePanel('presentations')}
            icon="🗂"
            label="Presentations"
          />
          <ToolbarButton
            active={activePanel === 'library'}
            onClick={() => setActivePanel('library')}
            icon="🎵"
            label="Song Library"
          />
          <ToolbarButton
            active={activePanel === 'settings'}
            onClick={() => setActivePanel('settings')}
            icon="⚙️"
            label="Settings"
          />
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[#444]" />

        {/* New presentation */}
        <button
          onClick={() => setShowNewPresDialog(true)}
          className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white text-sm transition-colors"
        >
          <span>+</span>
          <span>New</span>
        </button>

        {/* Current presentation name */}
        {pres && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[#888] text-sm">|</span>
            <span className="text-white text-sm font-medium truncate max-w-48">{pres.name}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Output controls */}
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={onToggleOutput}
            className={`flex items-center gap-2 px-4 py-1.5 rounded font-medium text-sm transition-all ${
              outputEnabled
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                : 'bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${outputEnabled ? 'bg-white animate-pulse' : 'bg-[#666]'}`} />
            <span>Output</span>
          </button>
        </div>
      </div>

      {/* New Presentation Dialog */}
      {showNewPresDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#2a2a2a] rounded-xl border border-[#444] p-6 w-96 shadow-2xl">
            <h2 className="text-white font-semibold text-lg mb-4">New Presentation</h2>
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
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-orange-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewPresDialog(false)}
                className="px-4 py-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white text-sm transition-colors"
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

function ToolbarButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          : 'text-[#888] hover:text-white hover:bg-[#3a3a3a]'
      }`}
    >
      <span>{icon}</span>
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}
