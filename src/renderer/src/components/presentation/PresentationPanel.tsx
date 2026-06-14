import React, { useState } from 'react'
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function PresentationPanel() {
  const {
    presentations,
    currentPresentationId,
    createPresentation,
    deletePresentation,
    setCurrentPresentation,
    updatePresentation
  } = useStore()

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      createPresentation(newName.trim())
      setNewName('')
      setShowNew(false)
    }
  }

  const handleRename = (id: string) => {
    if (editingName.trim()) updatePresentation(id, { name: editingName.trim() })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="px-3 py-2.5 border-b border-app flex items-center justify-between flex-shrink-0">
        <h2 className="text-primary font-semibold text-sm">Presentations</h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {showNew && (
        <div className="p-3 border-b border-app bg-surface">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setShowNew(false)
            }}
            placeholder="e.g. Sunday Service"
            className="input-base w-full px-2 py-1.5 text-xs mb-2"
          />
          <div className="flex gap-1.5">
            <button onClick={() => setShowNew(false)} className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-[#2a2a2a] text-muted hover:text-primary transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} className="flex-1 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600 font-medium transition-colors">
              Create
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {presentations.length === 0 ? (
          <div className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 dark:border-[#333] flex items-center justify-center mx-auto mb-3">
              <LayoutGrid className="w-5 h-5 text-gray-300 dark:text-[#444]" />
            </div>
            <p className="text-muted text-sm font-medium mb-1">No presentations yet</p>
            <p className="text-faint text-xs mb-3 leading-relaxed">Create one to start adding slides</p>
            <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded transition-colors font-medium">
              <Plus className="w-3.5 h-3.5" /> Create First Presentation
            </button>
          </div>
        ) : (
          presentations.map((pres) => (
            <div
              key={pres.id}
              onClick={() => setCurrentPresentation(pres.id)}
              className={`px-3 py-2.5 cursor-pointer border-b border-app transition-colors group relative ${
                currentPresentationId === pres.id
                  ? 'bg-orange-500/8 dark:bg-orange-500/10'
                  : 'hover:bg-gray-50 dark:hover:bg-[#252525]'
              }`}
            >
              {currentPresentationId === pres.id && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500 rounded-r" />
              )}
              {editingId === pres.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRename(pres.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(pres.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full input-base px-1.5 py-0.5 text-xs"
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${currentPresentationId === pres.id ? 'text-primary' : 'text-secondary'}`}>
                      {pres.name}
                    </p>
                    <p className="text-faint text-xs mt-0.5">
                      {pres.slides.length} {pres.slides.length === 1 ? 'slide' : 'slides'}
                    </p>
                  </div>
                  <div className="hidden group-hover:flex gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(pres.id); setEditingName(pres.name) }}
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-muted hover:text-primary flex items-center justify-center transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${pres.name}"? This cannot be undone.`)) deletePresentation(pres.id)
                      }}
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-[#2a2a2a] hover:bg-red-500 hover:text-white text-muted flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
