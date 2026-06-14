import React, { useEffect, useState } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, FileText, LayoutList } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Song, SongSection } from '../../types'
import { CATEGORY_LABELS, SECTION_DOT_COLORS } from './constants'

interface NewSongDialogProps {
  open: boolean
  category: Song['category']
  /** Whether a presentation is currently open (enables "add straight to slides"). */
  hasPres: boolean
  onClose: () => void
  onCategoryChange: (cat: Song['category']) => void
  onImport: (markdown: string, addToPresentation: boolean) => void
  onShowSyntaxGuide: () => void
}

type Mode = 'simple' | 'markdown'

interface FormSection {
  id: string
  type: SongSection
  lyrics: string
}

// Friendly bilingual labels for each section type. The English keyword in
// parentheses is what gets written into the generated markdown so the existing
// parser recognises the section type.
const SECTION_TYPE_OPTIONS: { type: SongSection; label: string; en: string }[] = [
  { type: 'verse', label: 'Câu hát', en: 'Verse' },
  { type: 'chorus', label: 'Điệp khúc', en: 'Chorus' },
  { type: 'pre-chorus', label: 'Trước điệp khúc', en: 'Pre-Chorus' },
  { type: 'bridge', label: 'Đoạn nối', en: 'Bridge' },
  { type: 'intro', label: 'Dạo đầu', en: 'Intro' },
  { type: 'outro', label: 'Kết', en: 'Outro' },
  { type: 'tag', label: 'Điệp ngữ (Tag)', en: 'Tag' }
]

const EN_LABEL: Record<SongSection, string> = Object.fromEntries(
  SECTION_TYPE_OPTIONS.map((o) => [o.type, o.en])
) as Record<SongSection, string>

function emptySection(type: SongSection = 'verse'): FormSection {
  return { id: uuidv4(), type, lyrics: '' }
}

export function NewSongDialog({
  open,
  category,
  hasPres,
  onClose,
  onCategoryChange,
  onImport,
  onShowSyntaxGuide
}: NewSongDialogProps) {
  const [mode, setMode] = useState<Mode>('simple')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [songKey, setSongKey] = useState('')
  const [sections, setSections] = useState<FormSection[]>([emptySection()])
  const [markdown, setMarkdown] = useState('')

  // Reset the whole form each time the dialog is opened.
  useEffect(() => {
    if (open) {
      setMode('simple')
      setTitle('')
      setAuthor('')
      setSongKey('')
      setSections([emptySection()])
      setMarkdown('')
    }
  }, [open])

  if (!open) return null

  const categories = ['thanh-ca', 'biet-thanh-ca', 'tvchh', 'custom'] as const

  // ── Section helpers ──────────────────────────────────────────────
  const updateSection = (id: string, patch: Partial<FormSection>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const addSection = () =>
    setSections((prev) => [...prev, emptySection(prev[prev.length - 1]?.type ?? 'verse')])

  const removeSection = (id: string) =>
    setSections((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev))

  const moveSection = (index: number, dir: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  // ── Build markdown from the simple form ──────────────────────────
  const buildMarkdownFromForm = (): string => {
    const lines: string[] = []
    lines.push(`# ${title.trim() || 'Untitled Song'}`)
    if (author.trim()) lines.push(`## Author: ${author.trim()}`)
    if (songKey.trim()) lines.push(`## Key: ${songKey.trim()}`)
    lines.push('')

    const totalByType: Partial<Record<SongSection, number>> = {}
    sections.forEach((s) => (totalByType[s.type] = (totalByType[s.type] ?? 0) + 1))
    const seen: Partial<Record<SongSection, number>> = {}

    for (const s of sections) {
      if (!s.lyrics.trim()) continue
      seen[s.type] = (seen[s.type] ?? 0) + 1
      const needsNumber = (totalByType[s.type] ?? 0) > 1
      const label = needsNumber ? `${EN_LABEL[s.type]} ${seen[s.type]}` : EN_LABEL[s.type]
      lines.push(`[${label}]`)
      lines.push(s.lyrics.trim())
      lines.push('')
    }
    return lines.join('\n').trim()
  }

  const simpleValid = title.trim().length > 0 && sections.some((s) => s.lyrics.trim().length > 0)
  const canImport = mode === 'simple' ? simpleValid : markdown.trim().length > 0

  const handleImport = (addToPresentation: boolean) => {
    const md = mode === 'simple' ? buildMarkdownFromForm() : markdown
    if (!md.trim()) return
    onImport(md, addToPresentation)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-in">
      <div className="bg-panel rounded-xl border border-app w-[720px] h-[640px] shadow-2xl flex flex-col modal-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-primary font-semibold text-lg">Thêm bài hát mới</h2>
            <p className="text-muted text-xs mt-0.5">
              Điền lời bài hát theo từng đoạn — không cần biết Markdown.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode switch */}
        <div className="px-6 flex-shrink-0">
          <div className="inline-flex p-0.5 rounded-lg bg-surface">
            <button
              onClick={() => setMode('simple')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'simple' ? 'bg-panel text-primary shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Đơn giản
            </button>
            <button
              onClick={() => {
                // Carry the form content over so power users can fine-tune it.
                if (mode === 'simple') setMarkdown(buildMarkdownFromForm())
                setMode('markdown')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'markdown' ? 'bg-panel text-primary shadow-sm' : 'text-muted hover:text-primary'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Markdown
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="px-6 pt-3 flex-shrink-0">
          <p className="label-xs mb-1.5">Phân loại</p>
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

        {/* Body */}
        {mode === 'simple' ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            {/* Song metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label-xs mb-1 block">Tên bài hát *</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thánh Thay"
                  className="input-base w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="label-xs mb-1 block">Tác giả</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Không bắt buộc"
                  className="input-base w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="label-xs mb-1 block">Tông (Key)</label>
                <input
                  value={songKey}
                  onChange={(e) => setSongKey(e.target.value)}
                  placeholder="VD: C, G..."
                  className="input-base w-full px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Sections */}
            <div>
              <p className="label-xs mb-2">Các đoạn lời</p>
              <div className="space-y-3">
                {sections.map((s, idx) => (
                  <div key={s.id} className="card p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SECTION_DOT_COLORS[s.type]}`} />
                      <select
                        value={s.type}
                        onChange={(e) => updateSection(s.id, { type: e.target.value as SongSection })}
                        className="input-base px-2 py-1 text-xs"
                      >
                        {SECTION_TYPE_OPTIONS.map((o) => (
                          <option key={o.type} value={o.type}>
                            {o.label} ({o.en})
                          </option>
                        ))}
                      </select>
                      <div className="flex-1" />
                      <button
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        title="Lên"
                        className="p-1 rounded text-muted hover:text-primary hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                        title="Xuống"
                        className="p-1 rounded text-muted hover:text-primary hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeSection(s.id)}
                        disabled={sections.length === 1}
                        title="Xóa đoạn"
                        className="p-1 rounded text-muted hover:text-red-500 hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={s.lyrics}
                      onChange={(e) => updateSection(s.id, { lyrics: e.target.value })}
                      placeholder="Nhập lời cho đoạn này. Mỗi dòng là một dòng hiển thị trên slide."
                      rows={Math.max(3, s.lyrics.split('\n').length)}
                      className="input-base w-full px-3 py-2 text-sm resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addSection}
                className="mt-3 w-full py-2.5 border-2 border-dashed border-app-2 rounded-lg text-muted hover:text-orange-500 hover:border-orange-400 transition-colors text-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm đoạn
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col px-6 py-4">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <p className="label-xs">Markdown (nâng cao)</p>
              <button onClick={onShowSyntaxGuide} className="text-xs text-muted hover:text-orange-500">
                Hướng dẫn cú pháp
              </button>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={`# Tên bài hát\n## Author: Tác giả\n## Key: G\n\n[Verse 1]\nLời câu 1...\n\n[Chorus]\nLời điệp khúc...`}
              className="flex-1 input-base px-3 py-2 text-sm font-mono resize-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-app flex-shrink-0">
          <span className="text-xs text-faint">
            {mode === 'simple' && !simpleValid
              ? 'Cần có tên bài hát và ít nhất một đoạn có lời.'
              : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface hover:bg-hover-2 text-primary text-sm"
            >
              Hủy
            </button>
            <button
              onClick={() => handleImport(false)}
              disabled={!canImport}
              className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                hasPres
                  ? 'bg-surface hover:bg-hover-2 text-primary border border-app'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              Thêm vào thư viện
            </button>
            {hasPres && (
              <button
                onClick={() => handleImport(true)}
                disabled={!canImport}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Thêm & đưa vào slide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
