import React from 'react'
import { Song } from '../../types'
import { CATEGORY_LABELS } from './constants'

interface NewSongDialogProps {
  open: boolean
  category: Song['category']
  markdownContent: string
  onClose: () => void
  onCategoryChange: (cat: Song['category']) => void
  onMarkdownChange: (content: string) => void
  onImport: () => void
  onShowSyntaxGuide: () => void
}

export function NewSongDialog({
  open,
  category,
  markdownContent,
  onClose,
  onCategoryChange,
  onMarkdownChange,
  onImport,
  onShowSyntaxGuide
}: NewSongDialogProps) {
  if (!open) return null

  const categories = (['thanh-ca', 'biet-thanh-ca', 'tvchh', 'custom'] as const)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-panel rounded-xl border border-app p-6 w-[700px] h-[600px] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 className="text-primary font-semibold text-lg">Import Song from Markdown</h2>
          <div className="flex gap-2">
            <button onClick={onShowSyntaxGuide} className="text-xs text-muted hover:text-orange-500">
              Syntax Guide
            </button>
            <button onClick={onClose} className="text-muted hover:text-primary text-lg leading-none">×</button>
          </div>
        </div>

        <div className="mb-3 flex-shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors border ${
                  category === cat
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-transparent text-muted border-app hover:text-primary'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <textarea
          autoFocus
          value={markdownContent}
          onChange={(e) => onMarkdownChange(e.target.value)}
          placeholder={`# Song Title\n## Author: Author Name\n## Key: G\n\n[Verse 1]\nLyrics here...\n\n[Chorus]\nChorus lyrics...`}
          className="flex-1 input-base px-3 py-2 text-sm font-mono resize-none mb-4"
        />

        <div className="flex gap-2 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface hover:bg-hover-2 text-primary text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
          >
            Import Song
          </button>
        </div>
      </div>
    </div>
  )
}
