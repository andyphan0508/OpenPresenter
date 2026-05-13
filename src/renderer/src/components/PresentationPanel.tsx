import React, { useState } from 'react'
import { useStore } from '../store/useStore'

export function PresentationPanel() {
  const {
    presentations, currentPresentationId,
    createPresentation, deletePresentation,
    setCurrentPresentation, updatePresentation
  } = useStore()

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) { createPresentation(newName.trim()); setNewName(''); setShowNew(false) }
  }

  const handleRename = (id: string) => {
    if (editingName.trim()) updatePresentation(id, { name: editingName.trim() })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full bg-app">
      <div className="p-3 border-b border-app flex items-center justify-between">
        <h2 className="text-primary font-semibold text-sm">Presentations</h2>
        <button onClick={() => setShowNew(true)}
          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors">
          + New
        </button>
      </div>

      {showNew && (
        <div className="p-3 border-b border-app bg-panel">
          <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false) }}
            placeholder="Presentation name..."
            className="input-base w-full px-2 py-1.5 text-xs mb-2" />
          <div className="flex gap-1">
            <button onClick={() => setShowNew(false)} className="flex-1 py-1 text-xs rounded bg-surface text-muted hover:text-primary">Cancel</button>
            <button onClick={handleCreate} className="flex-1 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600">Create</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {presentations.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-4xl mb-2 opacity-20">🗂</div>
            <p className="text-muted text-xs">No presentations yet</p>
            <button onClick={() => setShowNew(true)} className="mt-2 text-xs text-orange-500 hover:text-orange-400">Create one</button>
          </div>
        ) : presentations.map((pres) => (
          <div key={pres.id} onClick={() => setCurrentPresentation(pres.id)}
            className={`p-3 cursor-pointer border-b border-app transition-colors group bg-hover ${
              currentPresentationId === pres.id ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''
            }`}>
            {editingId === pres.id ? (
              <input autoFocus type="text" value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRename(pres.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(pres.id); if (e.key === 'Escape') setEditingId(null) }}
                onClick={(e) => e.stopPropagation()}
                className="w-full input-base px-1 py-0.5 text-xs" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium truncate">{pres.name}</p>
                  <p className="text-muted text-xs mt-0.5">{pres.slides.length} slide{pres.slides.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="hidden group-hover:flex gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(pres.id); setEditingName(pres.name) }}
                    className="w-5 h-5 rounded bg-surface hover:bg-hover-2 text-muted hover:text-primary text-xs flex items-center justify-center"
                    title="Rename">✏</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${pres.name}"?`)) deletePresentation(pres.id) }}
                    className="w-5 h-5 rounded bg-surface hover:bg-red-500 hover:text-white text-muted text-xs flex items-center justify-center"
                    title="Delete">✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
