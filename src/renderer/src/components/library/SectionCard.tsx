import React from 'react'
import { Plus, ChevronUp, ChevronDown, Pencil, Check, Trash2 } from 'lucide-react'
import { SongSlide } from '../../types'
import { SECTION_COLORS, SECTION_DOT_COLORS } from './constants'

interface SectionCardProps {
  section: SongSlide
  index: number
  totalSections: number
  isEditing: boolean
  editContent: string
  hasPres: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddToPresentation: () => void
  onEditContentChange: (content: string) => void
}

export function SectionCard({
  section,
  index,
  totalSections,
  isEditing,
  editContent,
  hasPres,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddToPresentation,
  onEditContentChange
}: SectionCardProps) {
  const colorClass = SECTION_COLORS[section.sectionType]
  const dotColor = SECTION_DOT_COLORS[section.sectionType]

  return (
    <div className="card overflow-hidden">
      <div className={`flex items-center justify-between px-3 py-2 ${colorClass} rounded-t`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0`} />
          <span className="text-xs font-bold uppercase tracking-wide">{section.sectionLabel}</span>
        </div>

        <div className="flex items-center gap-1">
          {hasPres && (
            <button
              onClick={onAddToPresentation}
              className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium bg-white/20 hover:bg-white/40 rounded transition-colors"
            >
              <Plus className="w-3 h-3" /> Slide
            </button>
          )}
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={isEditing ? onSave : onEdit}
            className={`flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              isEditing ? 'bg-white/40 hover:bg-white/60' : 'bg-white/20 hover:bg-white/40'
            }`}
          >
            {isEditing ? <><Check className="w-3 h-3" /> Save</> : <><Pencil className="w-3 h-3" /> Edit</>}
          </button>
          {isEditing && (
            <button
              onClick={onCancel}
              className="px-2 py-0.5 text-[10px] bg-white/20 hover:bg-white/40 rounded transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/40 transition-colors"
            title="Delete section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 bg-panel">
        {isEditing ? (
          <textarea
            autoFocus
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave()
              if (e.key === 'Escape') onCancel()
            }}
            rows={Math.max(3, editContent.split('\n').length + 1)}
            className="w-full input-base px-2 py-1.5 text-sm font-mono resize-none"
          />
        ) : (
          <p className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">
            {section.content || <span className="text-faint italic">Empty section</span>}
          </p>
        )}
      </div>
    </div>
  )
}
