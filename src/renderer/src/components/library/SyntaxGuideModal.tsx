import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Song } from '../../types'
import { SECTION_COLORS, SECTION_DOT_COLORS, MARKDOWN_SYNTAX_GUIDE } from './constants'

interface SyntaxGuideModalProps {
  open: boolean
  onClose: () => void
}

export function SyntaxGuideModal({ open, onClose }: SyntaxGuideModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-panel rounded-xl border border-app p-6 w-[560px] max-h-[80vh] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-primary font-semibold text-lg">Markdown Syntax Guide</h2>
          <button onClick={onClose} className="text-muted hover:text-primary text-xl leading-none">×</button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
          {(Object.entries(SECTION_DOT_COLORS) as [Song['slides'][0]['sectionType'], string][]).map(([type, dot]) => (
            <span key={type} className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${SECTION_COLORS[type]}`}>
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {type}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{MARKDOWN_SYNTAX_GUIDE}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
