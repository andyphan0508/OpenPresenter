import React, { useState } from 'react'
import { Palette, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Song, SongSlide } from '../../types'
import { CATEGORY_LABELS, CATEGORY_BADGE } from './constants'
import { SectionCard } from './SectionCard'
import { SongTemplateEditor } from './SongTemplateEditor'

interface SongDetailProps {
  song: Song
  hasPres: boolean
  isEditingMarkdown: boolean
  markdownContent: string
  editingSectionId: string | null
  sectionEditContent: string
  onAddToPresentation: () => void
  onEditMarkdown: () => void
  onDeleteSong: () => void
  onSaveMarkdown: () => void
  onCancelMarkdownEdit: () => void
  onMarkdownChange: (content: string) => void
  onSectionEditStart: (id: string, content: string) => void
  onSectionSave: (sectionId: string) => void
  onSectionCancel: () => void
  onSectionDelete: (sectionId: string) => void
  onSectionMove: (sectionId: string, dir: -1 | 1) => void
  onSectionAddToPres: (sectionId: string) => void
  onAddSection: (section: SongSlide) => void
  onShowSyntaxGuide: () => void
}

export function SongDetail({
  song,
  hasPres,
  isEditingMarkdown,
  markdownContent,
  editingSectionId,
  sectionEditContent,
  onAddToPresentation,
  onEditMarkdown,
  onDeleteSong,
  onSaveMarkdown,
  onCancelMarkdownEdit,
  onMarkdownChange,
  onSectionEditStart,
  onSectionSave,
  onSectionCancel,
  onSectionDelete,
  onSectionMove,
  onSectionAddToPres,
  onAddSection,
  onShowSyntaxGuide
}: SongDetailProps) {
  const slides = song.slides ?? []
  const [showTemplate, setShowTemplate] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-app">
      {/* Song header */}
      <div className="p-4 border-b border-app bg-panel flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-primary font-semibold text-lg">{song.title}</h2>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_BADGE[song.category]}`}>
              {CATEGORY_LABELS[song.category]}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {song.author && <span className="text-secondary text-sm">{song.author}</span>}
            {song.key && <span className="text-xs text-muted">Key: {song.key}</span>}
            <span className="text-xs text-faint">{slides.length} sections</span>
          </div>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          {hasPres && (
            <button
              onClick={onAddToPresentation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors font-medium"
            >
              <Plus className="w-4 h-4" /> All Slides
            </button>
          )}
          <button
            onClick={() => setShowTemplate((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
              showTemplate ? 'bg-orange-500 text-white' : 'bg-surface hover:bg-hover-2 text-primary'
            }`}
            title="Edit the style applied to all slides of this song"
          >
            <Palette className="w-4 h-4" /> Template
          </button>
          <button
            onClick={onEditMarkdown}
            className="px-3 py-1.5 bg-surface hover:bg-hover-2 text-primary text-sm rounded transition-colors"
          >
            Edit MD
          </button>
          <button
            onClick={onDeleteSong}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-red-500 hover:text-white text-muted text-sm rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
      {isEditingMarkdown ? (
        <div className="flex-1 min-w-0 flex flex-col p-4 gap-3 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <p className="text-muted text-xs font-medium uppercase tracking-wider">Markdown Editor</p>
            <div className="flex gap-2">
              <button onClick={onShowSyntaxGuide} className="text-xs text-muted hover:text-primary">
                Syntax Guide
              </button>
              <button
                onClick={onCancelMarkdownEdit}
                className="text-xs text-muted hover:text-primary px-2 py-1 rounded bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={onSaveMarkdown}
                className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
              >
                Save
              </button>
            </div>
          </div>
          <textarea
            value={markdownContent}
            onChange={(e) => onMarkdownChange(e.target.value)}
            className="flex-1 input-base px-3 py-2 text-sm font-mono resize-none"
            placeholder="Enter song in markdown format..."
          />
        </div>
      ) : (
        <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-2">
          {slides.map((section, idx) => (
            <SectionCard
              key={section.id}
              section={section}
              index={idx}
              totalSections={slides.length}
              isEditing={editingSectionId === section.id}
              editContent={editingSectionId === section.id ? sectionEditContent : section.content}
              hasPres={hasPres}
              onEdit={() => onSectionEditStart(section.id, section.content)}
              onSave={() => onSectionSave(section.id)}
              onCancel={onSectionCancel}
              onDelete={() => { if (confirm('Delete this section?')) onSectionDelete(section.id) }}
              onMoveUp={() => onSectionMove(section.id, -1)}
              onMoveDown={() => onSectionMove(section.id, 1)}
              onAddToPresentation={() => onSectionAddToPres(section.id)}
              onEditContentChange={(content) => onSectionEditStart(section.id, content)}
            />
          ))}

          <button
            onClick={() => {
              const newSection: SongSlide = {
                id: uuidv4(),
                sectionType: 'verse',
                sectionLabel: `Verse ${slides.filter((s) => s.sectionType === 'verse').length + 1}`,
                content: ''
              }
              onAddSection(newSection)
            }}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-[#333] rounded-lg text-muted hover:text-orange-500 hover:border-orange-400 transition-colors text-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>
      )}

        {showTemplate && (
          <div className="w-72 flex-shrink-0 border-l border-app bg-panel overflow-y-auto">
            <SongTemplateEditor song={song} />
          </div>
        )}
      </div>
    </div>
  )
}
